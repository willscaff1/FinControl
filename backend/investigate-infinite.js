const { MongoClient, ObjectId } = require('mongodb');

async function investigateInfiniteRecurring() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== INVESTIGANDO POR QUE DÉBITO É INFINITO E CRÉDITO NÃO ===');
  
  // Comparar SALÁRIO (débito) vs DisneyPlus (crédito)
  const salario = await db.collection('transactions').findOne({
    description: 'SALÁRIO',
    isRecurring: true
  });
  
  const disney = await db.collection('transactions').findOne({
    description: 'DisneyPlus',
    isRecurring: true
  });
  
  console.log('💰 SALÁRIO (DÉBITO - INFINITO):');
  console.log('   - _id:', salario._id);
  console.log('   - Data criação:', salario.createdAt);
  console.log('   - Data da transação:', new Date(salario.date).toLocaleDateString());
  console.log('   - Método pagamento:', salario.paymentMethod);
  console.log('   - isRecurring:', salario.isRecurring);
  console.log('   - recurringDay:', salario.recurringDay);
  
  console.log('\n🎬 DISNEY (CRÉDITO - PARA EM 2027):');
  console.log('   - _id:', disney._id);
  console.log('   - Data criação:', disney.createdAt);
  console.log('   - Data da transação:', new Date(disney.date).toLocaleDateString());
  console.log('   - Método pagamento:', disney.paymentMethod);
  console.log('   - isRecurring:', disney.isRecurring);
  console.log('   - recurringDay:', disney.recurringDay);
  
  // Contar transações filhas de cada um
  const salarioChildren = await db.collection('transactions').countDocuments({
    recurringParentId: salario._id
  });
  
  const disneyChildren = await db.collection('transactions').countDocuments({
    recurringParentId: disney._id
  });
  
  console.log('\n📊 CONTAGEM DE FILHAS:');
  console.log(`   💰 SALÁRIO: ${salarioChildren} transações filhas`);
  console.log(`   🎬 DISNEY: ${disneyChildren} transações filhas`);
  
  // Verificar as últimas transações de cada um
  const lastSalario = await db.collection('transactions').findOne({
    recurringParentId: salario._id
  }, { sort: { date: -1 } });
  
  const lastDisney = await db.collection('transactions').findOne({
    recurringParentId: disney._id
  }, { sort: { date: -1 } });
  
  console.log('\n📅 ÚLTIMAS TRANSAÇÕES:');
  console.log(`   💰 SALÁRIO: ${new Date(lastSalario.date).toLocaleDateString()}`);
  console.log(`   🎬 DISNEY: ${new Date(lastDisney.date).toLocaleDateString()}`);
  
  // Verificar quando foram criadas essas transações "mãe"
  console.log('\n🕐 HORÁRIOS DE CRIAÇÃO:');
  console.log(`   💰 SALÁRIO: ${salario.createdAt}`);
  console.log(`   🎬 DISNEY: ${disney.createdAt}`);
  
  // Diferença de criação
  const diffMinutes = (disney.createdAt - salario.createdAt) / 1000 / 60;
  console.log(`   ⏱️  Diferença: ${diffMinutes.toFixed(2)} minutos`);
  
  // Verificar se há algum sistema automático que gera mais transações para débito
  console.log('\n🔍 VERIFICANDO GERAÇÃO AUTOMÁTICA...');
  
  // Buscar todas as transações de SALÁRIO por data
  const allSalario = await db.collection('transactions').find({
    $or: [
      { _id: salario._id },
      { recurringParentId: salario._id }
    ]
  }).sort({ date: 1 }).toArray();
  
  console.log(`💰 SALÁRIO - Total: ${allSalario.length} transações:`);
  console.log('   Primeiras 5:');
  allSalario.slice(0, 5).forEach((t, i) => {
    console.log(`     ${i+1}. ${new Date(t.date).toLocaleDateString()} (${t.isRecurring ? 'MÃE' : 'FILHA'})`);
  });
  console.log('   Últimas 5:');
  allSalario.slice(-5).forEach((t, i) => {
    console.log(`     ${allSalario.length-4+i}. ${new Date(t.date).toLocaleDateString()} (${t.isRecurring ? 'MÃE' : 'FILHA'})`);
  });
  
  await client.close();
}

investigateInfiniteRecurring().catch(console.error);
