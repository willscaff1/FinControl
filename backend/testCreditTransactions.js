const mongoose = require('mongoose');

async function testCreditTransactions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/financial-control');
    console.log('🔌 Conectado ao MongoDB');
    
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    
    // Buscar todas as transações
    const allTransactions = await Transaction.find();
    console.log(`📊 Total de transações: ${allTransactions.length}`);
    
    // Filtrar transações de crédito
    const creditTransactions = allTransactions.filter(t => 
      t && t.type === 'expense' && t.paymentMethod === 'credito'
    );
    
    console.log(`💳 Transações de cartão de crédito: ${creditTransactions.length}`);
    
    if (creditTransactions.length > 0) {
      console.log('\n📋 Detalhes das transações de crédito:');
      let total = 0;
      
      creditTransactions.forEach(t => {
        console.log(`   - ${t.description} | R$ ${t.amount} | ${new Date(t.date).toLocaleDateString()}`);
        total += t.amount;
      });
      
      console.log(`\n💰 Total gasto no cartão: R$ ${total.toFixed(2)}`);
    } else {
      console.log('\n⚠️  Nenhuma transação de cartão de crédito encontrada.');
      console.log('   Para testar, crie uma transação com:');
      console.log('   - type: "expense"');
      console.log('   - paymentMethod: "credito"');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

testCreditTransactions();
