const { MongoClient, ObjectId } = require('mongodb');

async function checkJanuary2027() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== VERIFICANDO JANEIRO 2027 ===');
  
  // Buscar TODAS as transações de janeiro 2027
  const allJanuaryTransactions = await db.collection('transactions').find({
    date: {
      $gte: new Date('2027-01-01'),
      $lt: new Date('2027-02-01')
    }
  }).sort({ date: 1 }).toArray();
  
  console.log(`📊 TOTAL DE TRANSAÇÕES EM JANEIRO 2027: ${allJanuaryTransactions.length}`);
  
  // Separar por método de pagamento
  const creditTransactions = allJanuaryTransactions.filter(t => t.paymentMethod === 'credito');
  const debitTransactions = allJanuaryTransactions.filter(t => t.paymentMethod === 'debito');
  
  console.log(`💳 CRÉDITO: ${creditTransactions.length} transações`);
  console.log(`💰 DÉBITO: ${debitTransactions.length} transações`);
  
  // Verificar quais são recorrentes
  const recurringTransactions = allJanuaryTransactions.filter(t => 
    t.isRecurring || t.recurringParentId
  );
  
  console.log(`🔄 RECORRENTES: ${recurringTransactions.length} transações`);
  
  console.log('\n=== DETALHES DAS TRANSAÇÕES DE JANEIRO 2027 ===');
  allJanuaryTransactions.forEach((t, i) => {
    const isRecurring = t.isRecurring || t.recurringParentId;
    console.log(`${i+1}. ${t.description} - R$ ${t.amount} (${t.paymentMethod}) ${isRecurring ? '🔄' : ''}`);
    console.log(`   📅 Data: ${new Date(t.date).toLocaleDateString()}`);
    if (t.recurringParentId) {
      console.log(`   🔗 Parent: ${t.recurringParentId}`);
    }
  });
  
  // Verificar especificamente as transações de crédito recorrentes
  console.log('\n=== TRANSAÇÕES DE CRÉDITO RECORRENTES EM JANEIRO 2027 ===');
  const creditRecurring = creditTransactions.filter(t => t.isRecurring || t.recurringParentId);
  
  if (creditRecurring.length === 0) {
    console.log('❌ NENHUMA TRANSAÇÃO DE CRÉDITO RECORRENTE EM JANEIRO 2027!');
    
    // Verificar dezembro 2026
    console.log('\n=== VERIFICANDO DEZEMBRO 2026 ===');
    const decemberTransactions = await db.collection('transactions').find({
      date: {
        $gte: new Date('2026-12-01'),
        $lt: new Date('2027-01-01')
      },
      paymentMethod: 'credito'
    }).toArray();
    
    console.log(`💳 Transações de crédito em Dezembro 2026: ${decemberTransactions.length}`);
    decemberTransactions.forEach(t => {
      const isRecurring = t.isRecurring || t.recurringParentId;
      console.log(`   - ${t.description} ${isRecurring ? '🔄' : ''}`);
    });
    
    // Verificar fevereiro 2027
    console.log('\n=== VERIFICANDO FEVEREIRO 2027 ===');
    const februaryTransactions = await db.collection('transactions').find({
      date: {
        $gte: new Date('2027-02-01'),
        $lt: new Date('2027-03-01')
      },
      paymentMethod: 'credito'
    }).toArray();
    
    console.log(`💳 Transações de crédito em Fevereiro 2027: ${februaryTransactions.length}`);
    februaryTransactions.forEach(t => {
      const isRecurring = t.isRecurring || t.recurringParentId;
      console.log(`   - ${t.description} ${isRecurring ? '🔄' : ''}`);
    });
  } else {
    console.log(`✅ ${creditRecurring.length} transações de crédito recorrentes encontradas:`);
    creditRecurring.forEach(t => {
      console.log(`   - ${t.description}`);
    });
  }
  
  await client.close();
}

checkJanuary2027().catch(console.error);
