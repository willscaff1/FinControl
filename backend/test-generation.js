const { MongoClient } = require('mongodb');

async function testGeneration() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('financial-control');
    const transactions = db.collection('transactions');
    
    console.log('🔍 Testando geração para setembro 2025...');
    
    // Simular o que a API faz: verificar se há transações geradas para setembro 2025
    const startDate = new Date(2025, 8, 1); // Setembro (8 = setembro)
    const endDate = new Date(2025, 8, 30, 23, 59, 59, 999); // Final de setembro
    
    console.log(`📅 Período: ${startDate.toISOString()} até ${endDate.toISOString()}`);
    
    // Verificar transações existentes no período
    const existingTransactions = await transactions.find({
      date: { $gte: startDate, $lte: endDate }
    }).toArray();
    
    console.log(`📊 Transações existentes em setembro 2025: ${existingTransactions.length}`);
    
    // Verificar transações geradas (que têm recurringParentId)
    const generatedTransactions = existingTransactions.filter(t => t.recurringParentId);
    console.log(`🔄 Transações geradas (com recurringParentId): ${generatedTransactions.length}`);
    
    generatedTransactions.forEach(tx => {
      console.log(`  - ${tx.description} (${tx.bank}) - R$ ${tx.amount} - ${tx.date.toISOString().split('T')[0]}`);
    });
    
    // Verificar templates
    const templates = await transactions.find({ isRecurring: true }).toArray();
    console.log(`📋 Templates disponíveis: ${templates.length}`);
    
    templates.forEach(template => {
      console.log(`  - ${template.description} (${template.bank}) - R$ ${template.amount} - Dia: ${template.recurringDay || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.close();
  }
}

testGeneration();
