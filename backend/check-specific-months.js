const { MongoClient } = require('mongodb');

async function checkSpecificMonths() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== VERIFICANDO MESES ESPECÍFICOS ===');
  
  // Verificar outubro 2025
  console.log('\n📅 OUTUBRO 2025:');
  const octoberTransactions = await db.collection('transactions').find({
    date: {
      $gte: new Date('2025-10-01'),
      $lt: new Date('2025-11-01')
    }
  }).toArray();
  
  const recurringInOctober = octoberTransactions.filter(t => 
    t.isRecurring || t.recurringParentId
  );
  
  console.log(`Total transações: ${octoberTransactions.length}`);
  console.log(`Transações recorrentes: ${recurringInOctober.length}`);
  recurringInOctober.forEach(t => {
    console.log(`   - ${t.description} (${new Date(t.date).toLocaleDateString()})`);
  });
  
  // Verificar novembro 2025
  console.log('\n📅 NOVEMBRO 2025:');
  const novemberTransactions = await db.collection('transactions').find({
    date: {
      $gte: new Date('2025-11-01'),
      $lt: new Date('2025-12-01')
    }
  }).toArray();
  
  const recurringInNovember = novemberTransactions.filter(t => 
    t.isRecurring || t.recurringParentId
  );
  
  console.log(`Total transações: ${novemberTransactions.length}`);
  console.log(`Transações recorrentes: ${recurringInNovember.length}`);
  recurringInNovember.forEach(t => {
    console.log(`   - ${t.description} (${new Date(t.date).toLocaleDateString()})`);
  });
  
  // Verificar dezembro 2025
  console.log('\n📅 DEZEMBRO 2025:');
  const decemberTransactions = await db.collection('transactions').find({
    date: {
      $gte: new Date('2025-12-01'),
      $lt: new Date('2026-01-01')
    }
  }).toArray();
  
  const recurringInDecember = decemberTransactions.filter(t => 
    t.isRecurring || t.recurringParentId
  );
  
  console.log(`Total transações: ${decemberTransactions.length}`);
  console.log(`Transações recorrentes: ${recurringInDecember.length}`);
  recurringInDecember.forEach(t => {
    console.log(`   - ${t.description} (${new Date(t.date).toLocaleDateString()})`);
  });
  
  await client.close();
}

checkSpecificMonths().catch(console.error);
