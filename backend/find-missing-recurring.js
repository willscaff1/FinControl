const { MongoClient } = require('mongodb');

async function findMissingRecurring() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== INVESTIGANDO TRANSAÇÕES RECORRENTES PERDIDAS ===');
  
  // Buscar todas as transações "mãe" de crédito
  const creditParents = await db.collection('transactions').find({
    isRecurring: true,
    paymentMethod: 'credito'
  }).toArray();
  
  console.log(`🔍 TRANSAÇÕES RECORRENTES DE CRÉDITO "MÃE": ${creditParents.length}`);
  
  for (const parent of creditParents) {
    console.log(`\n💳 ${parent.description} - R$ ${parent.amount}`);
    console.log(`   📅 Data original: ${new Date(parent.date).toLocaleDateString()}`);
    console.log(`   🔂 Dia recorrente: ${parent.recurringDay}`);
    console.log(`   🆔 ID: ${parent._id}`);
    
    // Verificar em quais meses esta transação existe
    const children = await db.collection('transactions').find({
      recurringParentId: parent._id
    }).sort({ date: 1 }).toArray();
    
    console.log(`   👥 Transações filhas: ${children.length}`);
    
    if (children.length > 0) {
      const firstChild = children[0];
      const lastChild = children[children.length - 1];
      console.log(`   📅 Primeira: ${new Date(firstChild.date).toLocaleDateString()}`);
      console.log(`   📅 Última: ${new Date(lastChild.date).toLocaleDateString()}`);
      
      // Verificar se existe em janeiro 2026
      const januaryExists = children.some(child => {
        const date = new Date(child.date);
        return date.getFullYear() === 2026 && date.getMonth() === 0; // Janeiro = 0
      });
      
      console.log(`   ❓ Existe em Janeiro 2026: ${januaryExists ? 'SIM' : 'NÃO'}`);
      
      if (!januaryExists) {
        console.log(`   ⚠️  PROBLEMA: ${parent.description} não existe em Janeiro 2026!`);
      }
    } else {
      console.log(`   ⚠️  PROBLEMA: Nenhuma transação filha encontrada!`);
    }
  }
  
  // Verificar também dezembro 2025
  console.log('\n=== VERIFICANDO DEZEMBRO 2025 ===');
  const decemberTransactions = await db.collection('transactions').find({
    date: {
      $gte: new Date('2025-12-01'),
      $lt: new Date('2026-01-01')
    },
    paymentMethod: 'credito'
  }).toArray();
  
  console.log(`💳 Transações de crédito em Dezembro 2025: ${decemberTransactions.length}`);
  decemberTransactions.forEach(t => {
    const isRecurring = t.isRecurring || t.recurringParentId;
    console.log(`   - ${t.description} ${isRecurring ? '🔄' : ''}`);
  });
  
  await client.close();
}

findMissingRecurring().catch(console.error);
