require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.log('⚠️  MongoDB:', err.message));

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  type: String,
  category: String,
  paymentMethod: String, // PIX, débito, crédito
  bank: String, // Campo para banco (débito/PIX)
  creditCard: String, // Campo para cartão de crédito
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  isRecurring: { type: Boolean, default: false },
  recurringDay: { type: Number }, // Dia do mês para transações fixas (1-31)
  recurringParentId: { type: mongoose.Schema.Types.ObjectId }, // ID do template pai para transações geradas
  // Campos para parcelamento
  isInstallment: { type: Boolean, default: false },
  installmentNumber: { type: Number }, // Número da parcela atual (1, 2, 3...)
  totalInstallments: { type: Number }, // Total de parcelas
  installmentParentId: { type: mongoose.Schema.Types.ObjectId } // ID da primeira parcela
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

// Bank Schema
const BankSchema = new mongoose.Schema({
  name: String,
  icon: String,
  accountType: String,
  notes: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Credit Card Schema
const CreditCardSchema = new mongoose.Schema({
  name: String,
  lastDigits: String,
  limit: Number,
  dueDay: Number,
  notes: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Bank = mongoose.model('Bank', BankSchema);
const CreditCard = mongoose.model('CreditCard', CreditCardSchema);

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token necessário' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Função para gerar transações fixas do mês
// Variável para controlar se já está gerando transações para evitar duplicatas
const generatingTransactions = new Map();

const generateRecurringTransactions = async (userId, month, year) => {
  const key = `${userId}-${month}-${year}`;
  
  // Se já está gerando para este usuário/mês, pular
  if (generatingTransactions.has(key)) {
    console.log(`⏭️  Já gerando transações para ${key}, pulando...`);
    return;
  }
  
  generatingTransactions.set(key, true);
  
  try {
    console.log(`🔄 Gerando transações fixas para ${month}/${year} - Usuário: ${userId}`);
    
    // Buscar todas as transações fixas do usuário
    const recurringTransactions = await Transaction.find({
      userId,
      isRecurring: true
    });

    console.log(`📋 Templates encontrados: ${recurringTransactions.length}`);

    const currentDate = new Date();
    const requestedDate = new Date(year, month - 1, 1);
    
    // Só gerar transações para o mês atual ou futuro
    if (requestedDate < new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)) {
      console.log(`⏪ Pulando mês anterior: ${month}/${year}`);
      return; // Não gera transações para meses anteriores
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    for (const recurringTx of recurringTransactions) {
      console.log(`🔍 Processando template: ${recurringTx.description} - ID: ${recurringTx._id}`);
      
      // Verificar se a transação fixa foi criada antes ou no mês solicitado
      const recurringTxDate = new Date(recurringTx.date);
      if (recurringTxDate > endOfMonth) {
        console.log(`⏭️  Template criado após mês solicitado, pulando`);
        continue; // Pula se a transação fixa foi criada depois do mês solicitado
      }

      // Verificar se já existe uma transação deste template no mês
      const existingTransaction = await Transaction.findOne({
        userId,
        recurringParentId: recurringTx._id,
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        },
        isRecurring: false
      });

      if (existingTransaction) {
        console.log(`✅ Transação já existe para este mês: ${existingTransaction._id}`);
      } else {
        // Determinar o dia da transação no mês
        const targetDay = Math.min(recurringTx.recurringDay || recurringTx.date.getDate(), endOfMonth.getDate());
        const transactionDate = new Date(year, month - 1, targetDay, 12, 0, 0); // Definir meio-dia para evitar problemas de fuso

        console.log(`➕ Criando nova transação: ${recurringTx.description} para ${transactionDate.toLocaleDateString()}`);

        // Criar a nova transação para este mês
        const newTransaction = new Transaction({
          description: recurringTx.description,
          amount: recurringTx.amount,
          type: recurringTx.type,
          category: recurringTx.category,
          paymentMethod: recurringTx.paymentMethod,
          userId,
          date: transactionDate,
          isRecurring: false, // Esta é a transação gerada, não o template
          recurringParentId: recurringTx._id
        });

        await newTransaction.save();
        console.log(`✅ Transação criada: ${newTransaction._id}`);
      }
    }
    
    console.log(`🏁 Finalizado processamento para ${month}/${year}`);
  } catch (error) {
    console.error('Erro ao gerar transações fixas:', error);
  } finally {
    // Limpar a flag para permitir futuras gerações se necessário
    generatingTransactions.delete(key);
  }
};

// Função para gerar parcelas
const generateInstallments = async (transactionData) => {
  console.log('💳 Gerando parcelas:', transactionData.totalInstallments);
  
  if (!transactionData.isInstallment || !transactionData.totalInstallments || transactionData.totalInstallments < 2) {
    console.log('❌ Não é parcelamento válido');
    return null;
  }

  const installments = [];
  const baseDate = new Date(transactionData.date);
  // ✅ NÃO dividir o valor - usar o valor informado como valor da parcela
  const installmentAmount = transactionData.amount;
  
  for (let i = 0; i < transactionData.totalInstallments; i++) {
    const installmentDate = new Date(baseDate);
    
    // ✅ Corrigir cálculo de data - adicionar meses corretamente
    const targetYear = baseDate.getFullYear();
    const targetMonth = baseDate.getMonth() + i;
    const targetDay = baseDate.getDate();
    
    // Calcular ano e mês corretos
    const finalYear = targetYear + Math.floor(targetMonth / 12);
    const finalMonth = targetMonth % 12;
    
    // Definir a data corretamente
    installmentDate.setFullYear(finalYear, finalMonth, targetDay);
    
    // Se o dia não existe no mês (ex: 31 de fev), ajustar para último dia do mês
    if (installmentDate.getMonth() !== finalMonth) {
      installmentDate.setDate(0); // Vai para o último dia do mês anterior (que é o mês correto)
    }
    
    const installmentData = {
      ...transactionData,
      installmentNumber: i + 1,
      date: installmentDate,
      amount: installmentAmount, // ✅ Usar valor da parcela, não dividir
      description: `${transactionData.description} (${i + 1}/${transactionData.totalInstallments})`,
      isInstallment: true
    };
    
    // A primeira parcela é o "pai", as outras referenciam ela
    if (i === 0) {
      delete installmentData.installmentParentId;
    }
    
    installments.push(installmentData);
  }
  
  console.log(`💳 ${installments.length} parcelas criadas com valor R$ ${installmentAmount} cada`);
  return installments;
};

// Rotas de Auth
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, name, email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para verificar se o usuário está autenticado
app.get('/api/user/me', auth, async (req, res) => {
  try {
    res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rotas de Transação
app.get('/api/transactions', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = { userId: req.user._id };
    
    // Se mês e ano forem fornecidos, filtrar por período
    if (month && year) {
      // Gerar transações fixas para o mês solicitado
      await generateRecurringTransactions(req.user._id, parseInt(month), parseInt(year));
      
      const startDate = new Date(year, month - 1, 1); // Primeiro dia do mês
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Último dia do mês
      query.date = { $gte: startDate, $lte: endDate };
      query.isRecurring = { $ne: true }; // Excluir os templates de transações fixas da lista
    } else {
      query.isRecurring = { $ne: true }; // Sempre excluir templates
    }
    
    const transactions = await Transaction.find(query).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transactions', auth, async (req, res) => {
  try {
    const transactionData = { ...req.body, userId: req.user._id };
    // Corrigir problema de fuso horário - adicionar horário meio-dia para evitar mudança de data
    let transactionDate;
    if (transactionData.date) {
      transactionDate = new Date(transactionData.date + 'T12:00:00');
    } else {
      transactionDate = new Date();
    }
    
    // Se for transação fixa, criar o template
    if (transactionData.isRecurring) {
      // Usar o dia da transação como dia de repetição
      const recurringDay = transactionDate.getDate();
      
      // Criar o template da transação fixa
      const recurringTemplate = new Transaction({
        ...transactionData,
        isRecurring: true,
        recurringDay: recurringDay,
        date: transactionDate
      });
      await recurringTemplate.save();
      
      // Criar também a transação para o mês atual
      const currentTransaction = new Transaction({
        ...transactionData,
        isRecurring: false, // Esta é a transação real, não o template
        date: transactionDate,
        recurringParentId: recurringTemplate._id
      });
      await currentTransaction.save();
      
      res.json(currentTransaction);
    } else if (transactionData.isInstallment) {
      // Transação parcelada
      console.log('💳 Criando transação parcelada');
      
      // Criar cartão automaticamente se necessário (antes de criar as parcelas)
      if (transactionData.creditCard && transactionData.paymentMethod === 'credito') {
        console.log('💳 Backend - Verificando se cartão existe:', transactionData.creditCard);
        try {
          const existingCard = await CreditCard.findOne({ 
            name: transactionData.creditCard,
            userId: req.user._id 
          });
          
          if (!existingCard) {
            console.log('💳 Backend - Criando cartão automaticamente:', transactionData.creditCard);
            const newCard = new CreditCard({
              name: transactionData.creditCard,
              lastDigits: '0000',
              limit: 1000,
              dueDay: 10,
              notes: 'Criado automaticamente via transação parcelada.',
              userId: req.user._id
            });
            await newCard.save();
            console.log('💳 Backend - Cartão criado com sucesso:', transactionData.creditCard);
          } else {
            console.log('💳 Backend - Cartão já existe:', transactionData.creditCard);
          }
        } catch (error) {
          console.error('💳 Backend - Erro ao criar cartão:', error);
        }
      }
      
      const installments = await generateInstallments({
        ...transactionData,
        date: transactionDate
      });
      
      if (!installments || installments.length === 0) {
        return res.status(400).json({ error: 'Erro ao gerar parcelas' });
      }
      
      const savedInstallments = [];
      let firstInstallmentId = null;
      
      // Salvar todas as parcelas
      for (let i = 0; i < installments.length; i++) {
        const installmentData = { ...installments[i] }; // ✅ Criar cópia para evitar mutação
        
        // Se não é a primeira, adicionar referência à primeira
        if (i > 0 && firstInstallmentId) {
          installmentData.installmentParentId = firstInstallmentId;
        }
        
        console.log(`💳 Salvando parcela ${i + 1}:`, {
          description: installmentData.description,
          amount: installmentData.amount,
          date: installmentData.date,
          installmentNumber: installmentData.installmentNumber,
          installmentParentId: installmentData.installmentParentId || 'primeira'
        });
        
        const installment = new Transaction(installmentData);
        await installment.save();
        savedInstallments.push(installment);
        
        // Guardar ID da primeira parcela
        if (i === 0) {
          firstInstallmentId = installment._id;
          console.log(`💳 Primeira parcela salva com ID: ${firstInstallmentId}`);
        }
      }
      
      console.log(`✅ ${savedInstallments.length} parcelas salvas com sucesso`);
      res.json(savedInstallments[0]); // Retornar a primeira parcela
    } else {
      // Transação normal
      
      // Criar cartão automaticamente se necessário
      if (transactionData.creditCard && transactionData.paymentMethod === 'credito') {
        console.log('💳 Backend Normal - Verificando se cartão existe:', transactionData.creditCard);
        try {
          const existingCard = await CreditCard.findOne({ 
            name: transactionData.creditCard,
            userId: req.user._id 
          });
          
          if (!existingCard) {
            console.log('💳 Backend Normal - Criando cartão automaticamente:', transactionData.creditCard);
            const newCard = new CreditCard({
              name: transactionData.creditCard,
              lastDigits: '0000',
              limit: 1000,
              dueDay: 10,
              notes: 'Criado automaticamente via transação.',
              userId: req.user._id
            });
            await newCard.save();
            console.log('💳 Backend Normal - Cartão criado com sucesso:', transactionData.creditCard);
          } else {
            console.log('💳 Backend Normal - Cartão já existe:', transactionData.creditCard);
          }
        } catch (error) {
          console.error('💳 Backend Normal - Erro ao criar cartão:', error);
        }
      }
      
      const transaction = new Transaction({
        ...transactionData,
        date: transactionDate
      });
      await transaction.save();
      res.json(transaction);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update transaction
// Controle para evitar múltiplas atualizações simultâneas
const updatingTransactions = new Map();

app.put('/api/transactions/:id', auth, async (req, res) => {
  const updateKey = `${req.params.id}-${req.user._id}`;
  
  // Se já está atualizando esta transação, rejeitar
  if (updatingTransactions.has(updateKey)) {
    console.log(`⏭️  Já atualizando transação ${req.params.id}, rejeitando...`);
    return res.status(429).json({ error: 'Atualização já em andamento' });
  }
  
  updatingTransactions.set(updateKey, true);
  
  try {
    console.log('🔧 PUT /api/transactions/:id chamado');
    console.log('📄 Body recebido:', req.body);
    console.log('🆔 ID da transação:', req.params.id);
    console.log('👤 User ID:', req.user._id);
    
    const { updateAll = false, ...updateData } = req.body;
    
    // CRÍTICO: Remover isRecurring dos dados de entrada para evitar conversão acidental
    delete updateData.isRecurring;
    
    console.log('🔄 updateAll:', updateAll);
    console.log('📝 updateData (após limpeza):', updateData);
    
    // Corrigir data se fornecida
    let processedDate;
    if (updateData.date) {
      processedDate = new Date(updateData.date + 'T12:00:00');
      updateData.date = processedDate;
      console.log('📅 Data convertida:', updateData.date);
    }
    
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!transaction) {
      console.log('❌ Transação não encontrada');
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    
    console.log('✅ Transação encontrada:', {
      id: transaction._id,
      isRecurring: transaction.isRecurring,
      recurringParentId: transaction.recurringParentId
    });

    // Se for transação recorrente e updateAll for true
    if (updateAll && (transaction.recurringParentId || transaction.isRecurring)) {
      console.log('🔄 Processando atualização de TODAS as transações recorrentes');
      
      let templateId;
      if (transaction.isRecurring) {
        // Esta É o template
        templateId = transaction._id;
        console.log('📋 Esta transação É o template');
      } else {
        // Esta tem um template pai
        templateId = transaction.recurringParentId;
        console.log('📋 Esta transação TEM um template pai:', templateId);
      }
      
      console.log('🎯 Template ID final:', templateId);
      
      // PASSO 1: Atualizar o template (forçar isRecurring: true)
      const templateUpdateData = { 
        ...updateData,
        isRecurring: true // FORÇAR como template
      };
      
      if (processedDate) {
        templateUpdateData.recurringDay = processedDate.getDate();
        console.log('📅 recurringDay calculado:', templateUpdateData.recurringDay);
      }
      
      console.log('📝 Atualizando TEMPLATE com:', templateUpdateData);
      
      const templateUpdateResult = await Transaction.findOneAndUpdate(
        { 
          _id: templateId, 
          userId: req.user._id,
          isRecurring: true // GARANTIR que está atualizando um template
        },
        templateUpdateData,
        { new: true }
      );
      
      console.log('✅ Template atualizado:', templateUpdateResult ? 'Sucesso' : 'Falhou');
      
      // PASSO 2: Atualizar todas as instâncias (forçar isRecurring: false)
      // IMPORTANTE: Remover a data dos dados de instância para não sobrescrever as datas originais
      const instanceUpdateData = { 
        ...updateData,
        isRecurring: false // FORÇAR como instância
      };
      
      // CRÍTICO: Remover a data para não sobrescrever as datas das instâncias
      delete instanceUpdateData.date;
      
      console.log('📝 Atualizando INSTÂNCIAS com (SEM data):', instanceUpdateData);
      console.log('🔍 Buscando instâncias com:', {
        userId: req.user._id,
        recurringParentId: templateId,
        isRecurring: false
      });
      
      // Primeiro, vamos ver quantas instâncias existem
      const existingInstances = await Transaction.find({
        userId: req.user._id,
        recurringParentId: templateId,
        isRecurring: false
      });
      
      console.log(`📊 Instâncias encontradas ANTES da atualização: ${existingInstances.length}`);
      existingInstances.forEach((inst, i) => {
        console.log(`   ${i+1}. ${inst._id} - ${inst.description} - ${new Date(inst.date).toLocaleDateString()}`);
      });
      
      const updateResult = await Transaction.updateMany(
        { 
          userId: req.user._id,
          recurringParentId: templateId,
          isRecurring: false // GARANTIR que está atualizando instâncias
        },
        instanceUpdateData
      );
      
      console.log('📊 Resultado updateMany:', updateResult);
      
      // Verificar instâncias DEPOIS da atualização
      const instancesAfterUpdate = await Transaction.find({
        userId: req.user._id,
        recurringParentId: templateId,
        isRecurring: false
      });
      
      console.log(`📊 Instâncias encontradas DEPOIS da atualização: ${instancesAfterUpdate.length}`);
      instancesAfterUpdate.forEach((inst, i) => {
        console.log(`   ${i+1}. ${inst._id} - ${inst.description} - ${new Date(inst.date).toLocaleDateString()}`);
      });
      
      // Retornar a transação original atualizada
      const updatedTransaction = await Transaction.findOne({
        _id: req.params.id,
        userId: req.user._id
      });
      
      res.json(updatedTransaction);
      
    } else {
      console.log('📝 Atualizando APENAS esta transação');
      
      // PASSO 3: Atualizar apenas uma transação
      // Se for instância, forçar isRecurring: false
      // Se for template, forçar isRecurring: true
      const singleUpdateData = {
        ...updateData,
        isRecurring: transaction.isRecurring // MANTER o valor original
      };
      
      console.log('📝 Dados para atualização única:', singleUpdateData);
      
      const updatedTransaction = await Transaction.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        singleUpdateData,
        { new: true }
      );
      
      console.log('✅ Transação atualizada:', updatedTransaction);
      res.json(updatedTransaction);
    }
  } catch (error) {
    console.error('❌ Erro no PUT /api/transactions/:id:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ error: error.message });
  } finally {
    // SEMPRE limpar o lock
    updatingTransactions.delete(updateKey);
    console.log('🔓 Lock removido para:', updateKey);
  }
});

// Delete transaction (apenas do mês atual)
app.delete('/api/transactions/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    
    res.json({ message: 'Transação deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete todas as transações de uma série recorrente
app.delete('/api/transactions/:id/recurring', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    
    let templateId;
    if (transaction.isRecurring) {
      // Se é o template, usar seu próprio ID
      templateId = transaction._id;
    } else if (transaction.recurringParentId) {
      // Se é uma instância, usar o ID do template
      templateId = transaction.recurringParentId;
    } else {
      return res.status(400).json({ error: 'Esta não é uma transação recorrente' });
    }
    
    // Deletar o template
    await Transaction.findOneAndDelete({
      _id: templateId,
      userId: req.user._id,
      isRecurring: true
    });
    
    // Deletar todas as instâncias geradas
    const deleteResult = await Transaction.deleteMany({
      userId: req.user._id,
      recurringParentId: templateId,
      isRecurring: false
    });
    
    res.json({ 
      message: 'Todas as transações da série foram deletadas',
      deletedCount: deleteResult.deletedCount + 1 // +1 pelo template
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete todas as parcelas de uma transação parcelada
app.delete('/api/transactions/:id/installments', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    
    let parentId;
    if (transaction.isInstallment && transaction.installmentNumber === 1 && !transaction.installmentParentId) {
      // É a primeira parcela (pai das outras)
      parentId = transaction._id;
    } else if (transaction.installmentParentId) {
      // É uma parcela que referencia o pai
      parentId = transaction.installmentParentId;
    } else if (transaction.isInstallment) {
      // É uma parcela, mas pode ter parentId igual ao próprio ID
      parentId = transaction._id;
    } else {
      return res.status(400).json({ error: 'Esta não é uma transação parcelada' });
    }
    
    console.log(`🗑️  Deletando todas as parcelas com parentId: ${parentId}`);
    
    // Deletar todas as parcelas do grupo (incluindo a primeira)
    const deleteResult = await Transaction.deleteMany({
      userId: req.user._id,
      $or: [
        { installmentParentId: parentId },
        { _id: parentId, isInstallment: true }
      ]
    });
    
    console.log(`🗑️  Deletadas ${deleteResult.deletedCount} parcelas`);
    
    res.json({ 
      message: 'Todas as parcelas foram deletadas',
      deletedCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('❌ Erro ao deletar parcelas:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/transactions/stats', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = { userId: req.user._id, isRecurring: { $ne: true } };
    
    // Aplicar filtros de data se fornecidos
    if (month && year) {
      // Gerar transações fixas para o mês solicitado
      await generateRecurringTransactions(req.user._id, parseInt(month), parseInt(year));
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    const transactions = await Transaction.find(query);
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Despesas excluindo cartão de crédito (só PIX e DÉBITO)
    const expense = transactions
      .filter(t => t.type === 'expense' && t.paymentMethod !== 'credito')
      .reduce((sum, t) => sum + t.amount, 0);

    const creditCardTotal = transactions
      .filter(t => t.type === 'expense' && t.paymentMethod === 'credito')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      income,
      expense,
      balance: income - expense,
      count: transactions.length,
      creditCardTotal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard endpoint
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = { userId: req.user._id, isRecurring: { $ne: true } };
    
    // Se mês e ano forem fornecidos, filtrar por período
    if (month && year) {
      // Gerar transações fixas para o mês solicitado
      await generateRecurringTransactions(req.user._id, parseInt(month), parseInt(year));
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    const transactions = await Transaction.find(query).sort({ date: -1 });
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Despesas excluindo cartão de crédito (só PIX e DÉBITO)
    const expense = transactions
      .filter(t => t.type === 'expense' && t.paymentMethod !== 'credito')
      .reduce((sum, t) => sum + t.amount, 0);

    // Total do cartão de crédito
    const creditCardTotal = transactions
      .filter(t => t.type === 'expense' && t.paymentMethod === 'credito')
      .reduce((sum, t) => sum + t.amount, 0);

    // Últimas 5 transações do período
    const recentTransactions = transactions.slice(0, 5);

    res.json({
      stats: {
        income,
        expense,
        balance: income - expense,
        count: transactions.length
      },
      creditCardTotal,
      recentTransactions,
      period: month && year ? { month: parseInt(month), year: parseInt(year) } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar transações de exemplo (apenas para desenvolvimento)
app.post('/api/seed-data', auth, async (req, res) => {
  try {
    // Verificar se já existem transações
    const existingTransactions = await Transaction.find({ userId: req.user._id });
    if (existingTransactions.length > 0) {
      return res.json({ message: 'Dados de exemplo já existem' });
    }

    const sampleTransactions = [
      {
        description: 'Salário',
        amount: 5000,
        type: 'income',
        category: 'salario',
        userId: req.user._id,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 dia atrás
      },
      {
        description: 'Almoço restaurante',
        amount: 45.50,
        type: 'expense',
        category: 'alimentacao',
        userId: req.user._id,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 dias atrás
      },
      {
        description: 'Uber',
        amount: 25.30,
        type: 'expense',
        category: 'transporte',
        userId: req.user._id,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 dias atrás
      },
      {
        description: 'Freelance',
        amount: 800,
        type: 'income',
        category: 'freelance',
        userId: req.user._id,
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 dias atrás
      },
      {
        description: 'Supermercado',
        amount: 156.80,
        type: 'expense',
        category: 'alimentacao',
        userId: req.user._id,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 dias atrás
      },
      {
        description: 'Cinema',
        amount: 35.00,
        type: 'expense',
        category: 'lazer',
        userId: req.user._id,
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 dias atrás
      },
      {
        description: 'Consulta médica',
        amount: 150.00,
        type: 'expense',
        category: 'saude',
        userId: req.user._id,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 dias atrás
      },
      {
        description: 'Venda produto',
        amount: 250,
        type: 'income',
        category: 'venda',
        userId: req.user._id,
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 dias atrás
      }
    ];

    await Transaction.insertMany(sampleTransactions);
    res.json({ message: 'Dados de exemplo criados com sucesso!', count: sampleTransactions.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// ENDPOINTS PARA CARTÕES DE CRÉDITO
// ========================================

// Listar cartões de crédito
app.get('/api/credit-cards', auth, async (req, res) => {
  try {
    const creditCards = await CreditCard.find({ userId: req.user._id }).sort({ name: 1 });
    res.json(creditCards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar cartão de crédito
app.post('/api/credit-cards', auth, async (req, res) => {
  try {
    const creditCard = new CreditCard({
      ...req.body,
      userId: req.user._id
    });
    await creditCard.save();
    res.json(creditCard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar cartão de crédito
app.put('/api/credit-cards/:id', auth, async (req, res) => {
  try {
    const creditCard = await CreditCard.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!creditCard) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    res.json(creditCard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar cartão de crédito
app.delete('/api/credit-cards/:id', auth, async (req, res) => {
  try {
    const creditCard = await CreditCard.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!creditCard) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    res.json({ message: 'Cartão deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// ENDPOINTS PARA BANCOS
// ========================================

// Listar bancos
app.get('/api/banks', auth, async (req, res) => {
  try {
    const banks = await Bank.find({ userId: req.user._id }).sort({ name: 1 });
    res.json(banks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar banco
app.post('/api/banks', auth, async (req, res) => {
  try {
    const bank = new Bank({
      ...req.body,
      userId: req.user._id
    });
    await bank.save();
    res.json(bank);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar banco
app.put('/api/banks/:id', auth, async (req, res) => {
  try {
    const bank = await Bank.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!bank) {
      return res.status(404).json({ error: 'Banco não encontrado' });
    }
    res.json(bank);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar banco
app.delete('/api/banks/:id', auth, async (req, res) => {
  try {
    const bank = await Bank.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!bank) {
      return res.status(404).json({ error: 'Banco não encontrado' });
    }
    res.json({ message: 'Banco deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('🚀 Servidor rodando na porta ' + PORT);
  console.log('🔗 API: http://localhost:' + PORT + '/api');
});