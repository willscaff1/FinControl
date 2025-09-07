const { MongoClient } = require('mongodb');

async function checkJanuary2026() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== VERIFICANDO JANEIRO 2026 ===');
  
  // Buscar TODAS as transações de janeiro 2026
  const allJanuaryTransactions = await db.collection('transactions').find({
    date: {
      $gte: new Date('2026-01-01'),
      $lt: new Date('2026-02-01')
    }
  }).sort({ date: 1 }).toArray();
  
  console.log(`📊 TOTAL DE TRANSAÇÕES EM JANEIRO 2026: ${allJanuaryTransactions.length}`);
  
  // Separar por método de pagamento
  const creditTransactions = allJanuaryTransactions.filter(t => t.paymentMethod === 'credito');
  const debitTransactions = allJanuaryTransactions.filter(t => t.paymentMethod === 'debito');
  const pixTransactions = allJanuaryTransactions.filter(t => t.paymentMethod === 'pix');
  
  console.log(`💳 CRÉDITO: ${creditTransactions.length} transações`);
  console.log(`💰 DÉBITO: ${debitTransactions.length} transações`);
  console.log(`📱 PIX: ${pixTransactions.length} transações`);
  
  // Verificar quais são recorrentes
  const recurringTransactions = allJanuaryTransactions.filter(t => 
    t.isRecurring || t.recurringParentId
  );
  
  console.log(`🔄 RECORRENTES: ${recurringTransactions.length} transações`);
  
  console.log('\n=== DETALHES DAS TRANSAÇÕES DE CRÉDITO ===');
  creditTransactions.forEach((t, i) => {
    console.log(`${i+1}. ${t.description} - R$ ${t.amount}`);
    console.log(`   📅 Data: ${new Date(t.date).toLocaleDateString()}`);
    console.log(`   💳 Cartão: ${t.creditCard || 'N/A'}`);
    console.log(`   🔄 Recorrente: ${t.isRecurring ? 'MÃE' : (t.recurringParentId ? 'FILHA' : 'NÃO')}`);
    console.log(`   🏷️ Categoria: ${t.category}`);
    console.log(`   🆔 ID: ${t._id}`);
    if (t.recurringParentId) {
      console.log(`   🔗 Parent ID: ${t.recurringParentId}`);
    }
    console.log('   ---');
  });
  
  console.log('\n=== TODAS AS TRANSAÇÕES DE JANEIRO 2026 ===');
  allJanuaryTransactions.forEach((t, i) => {
    const isRecurring = t.isRecurring || t.recurringParentId;
    console.log(`${i+1}. ${t.description} - R$ ${t.amount} (${t.paymentMethod}) ${isRecurring ? '🔄' : ''}`);
  });
  
  await client.close();
}

checkJanuary2026().catch(console.error);
