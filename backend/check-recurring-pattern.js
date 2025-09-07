const { MongoClient } = require('mongodb');

async function checkRecurringPattern() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== ANALISANDO PADRÃO DE TRANSAÇÕES RECORRENTES ===');
  
  // Buscar todas as transações de SALÁRIO para ver o padrão
  const salarios = await db.collection('transactions').find({
    description: 'SALÁRIO'
  }).sort({ date: 1 }).toArray();
  
  console.log('💰 ANÁLISE DAS TRANSAÇÕES DE SALÁRIO:');
  salarios.forEach((t, i) => {
    console.log(`${i+1}. Data: ${new Date(t.date).toLocaleDateString()}`);
    console.log(`   🔄 isRecurring: ${t.isRecurring}`);
    console.log(`   🔗 recurringParentId: ${t.recurringParentId}`);
    console.log(`   🆔 _id: ${t._id}`);
    console.log(`   📅 recurringDay: ${t.recurringDay}`);
    console.log('   ---');
  });
  
  // Fazer o mesmo para DisneyPlus
  const disney = await db.collection('transactions').find({
    description: 'DisneyPlus'
  }).sort({ date: 1 }).toArray();
  
  console.log('🎬 ANÁLISE DAS TRANSAÇÕES DE DISNEYPLUS:');
  disney.forEach((t, i) => {
    console.log(`${i+1}. Data: ${new Date(t.date).toLocaleDateString()}`);
    console.log(`   🔄 isRecurring: ${t.isRecurring}`);
    console.log(`   🔗 recurringParentId: ${t.recurringParentId}`);
    console.log(`   🆔 _id: ${t._id}`);
    console.log(`   📅 recurringDay: ${t.recurringDay}`);
    console.log('   ---');
  });
  
  await client.close();
}

checkRecurringPattern().catch(console.error);
