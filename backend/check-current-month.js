const { MongoClient } = require('mongodb');

async function checkTransactionDetails() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== VERIFICANDO TRANSAÇÕES DETALHADAS ===');
  
  // Buscar transações de setembro 2025
  const transactions = await db.collection('transactions').find({
    date: {
      $gte: new Date('2025-09-01'),
      $lt: new Date('2025-10-01')
    }
  }).toArray();
  
  console.log('📅 TRANSAÇÕES DE SETEMBRO 2025:');
  transactions.forEach((t, i) => {
    console.log(`${i+1}. ${t.description} - R$ ${t.amount}`);
    console.log(`   📅 Data: ${new Date(t.date).toLocaleDateString()}`);
    console.log(`   🔄 isRecurring: ${t.isRecurring}`);
    console.log(`   🎯 isFixed: ${t.isFixed}`);
    console.log(`   ⚡ isVirtualFixed: ${t.isVirtualFixed}`);
    console.log(`   💳 Método: ${t.paymentMethod}`);
    console.log(`   🏷️ Categoria: ${t.category}`);
    console.log('   ---');
  });
  
  // Contar transações que devem ter badge
  const comBadge = transactions.filter(t => t.isRecurring || t.isFixed);
  console.log(`🏷️ TOTAL COM BADGE: ${comBadge.length} de ${transactions.length} transações`);
  
  await client.close();
}

checkTransactionDetails().catch(console.error);
