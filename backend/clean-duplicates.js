require('dotenv').config();
const mongoose = require('mongoose');

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.log('⚠️  MongoDB:', err.message));

const TransactionSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  type: String,
  category: String,
  paymentMethod: String,
  bank: String,
  creditCard: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  isRecurring: { type: Boolean, default: false },
  recurringDay: { type: Number },
  recurringParentId: { type: mongoose.Schema.Types.ObjectId },
  isInstallment: { type: Boolean, default: false },
  installmentNumber: { type: Number },
  totalInstallments: { type: Number },
  installmentParentId: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', TransactionSchema);

async function cleanDuplicates() {
  try {
    console.log('🧹 Iniciando limpeza de duplicatas...\n');
    
    // Buscar todas as transações de setembro 2025
    const startDate = new Date(2025, 8, 1);
    const endDate = new Date(2025, 8, 30, 23, 59, 59, 999);
    
    const allTransactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: 1 }); // Ordenar por data de criação
    
    console.log(`📊 Total de transações antes da limpeza: ${allTransactions.length}\n`);
    
    // Agrupar por descrição
    const groupedByDescription = {};
    allTransactions.forEach(t => {
      if (!groupedByDescription[t.description]) {
        groupedByDescription[t.description] = [];
      }
      groupedByDescription[t.description].push(t);
    });
    
    let deletedCount = 0;
    
    for (const [description, transactions] of Object.entries(groupedByDescription)) {
      if (transactions.length > 1) {
        console.log(`\n🔍 Processando: "${description}" (${transactions.length} duplicatas)`);
        
        // Separar templates, geradas e normais
        const templates = transactions.filter(t => t.isRecurring);
        const generated = transactions.filter(t => t.recurringParentId);
        const normal = transactions.filter(t => !t.isRecurring && !t.recurringParentId);
        
        console.log(`  - Templates: ${templates.length}`);
        console.log(`  - Geradas: ${generated.length}`);
        console.log(`  - Normais: ${normal.length}`);
        
        // ESTRATÉGIA DE LIMPEZA:
        // 1. Se tem template + gerada: manter apenas a gerada
        // 2. Se tem normal + gerada: manter apenas a gerada
        // 3. Se tem apenas normais duplicadas: manter a mais antiga
        
        const toDelete = [];
        
        if (templates.length > 0 && generated.length > 0) {
          // Caso: template + gerada -> deletar template
          console.log(`  ✂️ Estratégia: Deletar template, manter gerada`);
          toDelete.push(...templates);
          
        } else if (normal.length > 0 && generated.length > 0) {
          // Caso: normal + gerada -> deletar normal
          console.log(`  ✂️ Estratégia: Deletar normal, manter gerada`);
          toDelete.push(...normal);
          
        } else if (normal.length > 1) {
          // Caso: múltiplas normais -> manter apenas a mais antiga
          console.log(`  ✂️ Estratégia: Manter normal mais antiga, deletar outras`);
          const sortedNormal = normal.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          toDelete.push(...sortedNormal.slice(1)); // Deletar todas exceto a primeira
          
        } else if (generated.length > 1) {
          // Caso: múltiplas geradas -> manter apenas uma
          console.log(`  ✂️ Estratégia: Manter primeira gerada, deletar outras`);
          const sortedGenerated = generated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          toDelete.push(...sortedGenerated.slice(1));
        }
        
        // Executar deleções
        for (const transaction of toDelete) {
          console.log(`  🗑️ Deletando: ${transaction._id} (${transaction.isRecurring ? 'template' : transaction.recurringParentId ? 'gerada' : 'normal'})`);
          await Transaction.findByIdAndDelete(transaction._id);
          deletedCount++;
        }
      }
    }
    
    console.log(`\n✅ Limpeza concluída!`);
    console.log(`🗑️ Total de transações deletadas: ${deletedCount}`);
    
    // Verificar resultado
    const remainingTransactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate }
    });
    
    console.log(`📊 Total de transações após limpeza: ${remainingTransactions.length}`);
    
    // Verificar se ainda há duplicatas
    const descriptions = remainingTransactions.map(t => t.description);
    const duplicates = descriptions.filter((desc, index) => descriptions.indexOf(desc) !== index);
    const uniqueDuplicates = [...new Set(duplicates)];
    
    if (uniqueDuplicates.length === 0) {
      console.log(`✅ Nenhuma duplicata restante!`);
    } else {
      console.log(`⚠️ Duplicatas restantes: ${uniqueDuplicates.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    mongoose.disconnect();
  }
}

cleanDuplicates();
