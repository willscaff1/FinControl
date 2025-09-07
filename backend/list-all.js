const { MongoClient } = require('mongodb');

async function listAllTransactions() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('financial-control');
    const transactions = db.collection('transactions');
    
    // Listar todas as transações
    const allTransactions = await transactions.find({}).toArray();
    console.log('📊 Total de transações no banco:', allTransactions.length);
    
    // Listar por banco
    const bankTransactions = allTransactions.filter(t => t.bank);
    console.log('🏦 Transações com banco:', bankTransactions.length);
    
    bankTransactions.forEach(tx => {
      console.log(`  - ${tx.description} (${tx.bank}) - ${tx.paymentMethod} - R$ ${tx.amount} - Recorrente: ${tx.isRecurring || false}`);
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.close();
  }
}

listAllTransactions();
