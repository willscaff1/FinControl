const { MongoClient } = require('mongodb');

async function checkRecurringStatus() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== VERIFICANDO STATUS DAS TRANSAÇÕES RECORRENTES ===');
  
  // Buscar todas as transações "mãe" (isRecurring: true)
  const parentTransactions = await db.collection('transactions').find({
    isRecurring: true
  }).toArray();
  
  console.log('🔄 TRANSAÇÕES RECORRENTES "MÃE":');
  for (const parent of parentTransactions) {
    console.log(`\n📊 ${parent.description} - R$ ${parent.amount}`);
    console.log(`   📅 Data original: ${new Date(parent.date).toLocaleDateString()}`);
    console.log(`   🔂 Dia recorrente: ${parent.recurringDay}`);
    console.log(`   🆔 ID: ${parent._id}`);
    
    // Contar quantas transações "filhas" foram criadas
    const childrenCount = await db.collection('transactions').countDocuments({
      recurringParentId: parent._id
    });
    
    console.log(`   👥 Transações filhas criadas: ${childrenCount}`);
    
    // Verificar até que mês as transações foram criadas
    const lastChild = await db.collection('transactions').findOne({
      recurringParentId: parent._id
    }, { sort: { date: -1 } });
    
    if (lastChild) {
      console.log(`   📅 Última transação: ${new Date(lastChild.date).toLocaleDateString()}`);
    }
    
    // Verificar se existe algum problema
    if (childrenCount < 24) { // Deveria ter pelo menos 2 anos de transações
      console.log(`   ⚠️  PROBLEMA: Poucas transações criadas (esperado: 24+, atual: ${childrenCount})`);
    }
  }
  
  // Verificar transações de setembro 2025 especificamente
  console.log('\n📅 TRANSAÇÕES DE SETEMBRO 2025:');
  const septemberTransactions = await db.collection('transactions').find({
    date: {
      $gte: new Date('2025-09-01'),
      $lt: new Date('2025-10-01')
    }
  }).toArray();
  
  const recurringInSeptember = septemberTransactions.filter(t => 
    t.isRecurring || t.recurringParentId
  );
  
  console.log(`Total transações setembro: ${septemberTransactions.length}`);
  console.log(`Transações recorrentes setembro: ${recurringInSeptember.length}`);
  
  recurringInSeptember.forEach(t => {
    console.log(`   - ${t.description} (${t.isRecurring ? 'MÃE' : 'FILHA'})`);
  });
  
  await client.close();
}

checkRecurringStatus().catch(console.error);
