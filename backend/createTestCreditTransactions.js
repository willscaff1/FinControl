const mongoose = require('mongoose');

async function createTestCreditTransactions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/financial-control');
    console.log('🔌 Conectado ao MongoDB');
    
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    
    // Buscar um usuário existente
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const user = await User.findOne();
    
    if (!user) {
      console.log('❌ Nenhum usuário encontrado. Execute o app primeiro para criar um usuário.');
      process.exit(1);
    }
    
    console.log(`👤 Usando usuário: ${user.name}`);
    
    // Criar transações de teste com cartão de crédito
    const testTransactions = [
      {
        description: 'Compra no Supermercado',
        amount: 150.75,
        type: 'expense',
        category: 'alimentacao',
        paymentMethod: 'credito',
        userId: user._id,
        date: new Date('2025-08-30T12:00:00'),
        isRecurring: false,
        isInstallment: false
      },
      {
        description: 'Posto de Gasolina',
        amount: 80.00,
        type: 'expense', 
        category: 'transporte',
        paymentMethod: 'credito',
        userId: user._id,
        date: new Date('2025-08-28T12:00:00'),
        isRecurring: false,
        isInstallment: false
      },
      {
        description: 'Restaurante',
        amount: 45.30,
        type: 'expense',
        category: 'alimentacao', 
        paymentMethod: 'credito',
        userId: user._id,
        date: new Date('2025-08-25T12:00:00'),
        isRecurring: false,
        isInstallment: false
      },
      {
        description: 'Farmácia',
        amount: 25.90,
        type: 'expense',
        category: 'saude',
        paymentMethod: 'credito',
        userId: user._id,
        date: new Date('2025-08-20T12:00:00'),
        isRecurring: false,
        isInstallment: false
      },
      // Adicionar uma transação NÃO crédito para testar filtro
      {
        description: 'Compra no Débito',
        amount: 50.00,
        type: 'expense',
        category: 'alimentacao',
        paymentMethod: 'debito',
        userId: user._id,
        date: new Date('2025-08-29T12:00:00'),
        isRecurring: false,
        isInstallment: false
      }
    ];
    
    console.log('💳 Criando transações de teste...');
    
    for (const transaction of testTransactions) {
      await Transaction.create(transaction);
      console.log(`   ✅ Criada: ${transaction.description} - ${transaction.paymentMethod} - R$ ${transaction.amount}`);
    }
    
    console.log('\n📊 Verificando resultado...');
    
    // Verificar transações criadas
    const allTransactions = await Transaction.find({ userId: user._id });
    const creditTransactions = allTransactions.filter(t => 
      t.type === 'expense' && t.paymentMethod === 'credito'
    );
    
    console.log(`📈 Total de transações do usuário: ${allTransactions.length}`);
    console.log(`💳 Transações de cartão de crédito: ${creditTransactions.length}`);
    
    const total = creditTransactions.reduce((sum, t) => sum + t.amount, 0);
    console.log(`💰 Total gasto no cartão: R$ ${total.toFixed(2)}`);
    
    console.log('\n✅ Transações de teste criadas! Agora você pode testar a tela de Cartão.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao criar transações:', error);
    process.exit(1);
  }
}

createTestCreditTransactions();
