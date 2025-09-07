const { MongoClient } = require('mongodb');

async function checkDatabase() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== VERIFICANDO TRANSAÇÕES NO BANCO ===');
  
  const transactions = await db.collection('transactions').find({}).limit(15).toArray();
  
  console.log('📊 SAMPLE DE TRANSAÇÕES:');
  transactions.forEach((t, i) => {
    console.log(`${i+1}. ${t.description}`);
    console.log(`   - isFixed: ${t.isFixed}`);
    console.log(`   - isRecurring: ${t.isRecurring}`);
    console.log(`   - isVirtualFixed: ${t.isVirtualFixed}`);
    console.log(`   - fixed: ${t.fixed}`);
    console.log(`   - recurring: ${t.recurring}`);
    console.log(`   - virtualFixed: ${t.virtualFixed}`);
    console.log('');
  });
  
  // Verificar campos que indicam transações fixas
  const fieldsCheck = await db.collection('transactions').findOne({
    $or: [
      { isFixed: true },
      { isRecurring: true },
      { isVirtualFixed: true },
      { fixed: true },
      { recurring: true },
      { virtualFixed: true }
    ]
  });
  
  console.log('🔍 PRIMEIRA TRANSAÇÃO FIXA ENCONTRADA:', fieldsCheck);
  
  // Contar quantas têm cada campo
  const counts = {
    isFixed: await db.collection('transactions').countDocuments({ isFixed: true }),
    isRecurring: await db.collection('transactions').countDocuments({ isRecurring: true }),
    isVirtualFixed: await db.collection('transactions').countDocuments({ isVirtualFixed: true }),
    fixed: await db.collection('transactions').countDocuments({ fixed: true }),
    recurring: await db.collection('transactions').countDocuments({ recurring: true }),
    virtualFixed: await db.collection('transactions').countDocuments({ virtualFixed: true })
  };
  
  console.log('📊 CONTAGEM POR CAMPO:');
  Object.entries(counts).forEach(([field, count]) => {
    console.log(`${field}: ${count} transações`);
  });
  
  await client.close();
}

checkDatabase().catch(console.error);
