const { MongoClient, ObjectId } = require('mongodb');

async function analyzeDebitRecurring() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== ANALISANDO TRANSAÇÕES RECORRENTES DE DÉBITO ===');
  
  // Buscar a transação SALÁRIO (débito)
  const salarioParent = await db.collection('transactions').findOne({
    description: 'SALÁRIO',
    isRecurring: true,
    paymentMethod: 'debito'
  });
  
  console.log('💰 SALÁRIO (DÉBITO):');
  console.log(`   📅 Data original: ${new Date(salarioParent.date).toLocaleDateString()}`);
  console.log(`   🔂 Dia recorrente: ${salarioParent.recurringDay}`);
  console.log(`   🆔 ID: ${salarioParent._id}`);
  
  // Buscar todas as transações filhas do SALÁRIO
  const salarioChildren = await db.collection('transactions').find({
    recurringParentId: salarioParent._id
  }).sort({ date: 1 }).toArray();
  
  console.log(`   👥 Transações filhas: ${salarioChildren.length}`);
  
  if (salarioChildren.length > 0) {
    const firstChild = salarioChildren[0];
    const lastChild = salarioChildren[salarioChildren.length - 1];
    console.log(`   📅 Primeira: ${new Date(firstChild.date).toLocaleDateString()}`);
    console.log(`   📅 Última: ${new Date(lastChild.date).toLocaleDateString()}`);
    
    // Verificar se existe em janeiro 2026
    const january2026 = salarioChildren.find(child => {
      const date = new Date(child.date);
      return date.getFullYear() === 2026 && date.getMonth() === 0; // Janeiro = 0
    });
    
    console.log(`   ❓ Existe em Janeiro 2026: ${january2026 ? 'SIM' : 'NÃO'}`);
    if (january2026) {
      console.log(`      Data: ${new Date(january2026.date).toLocaleDateString()}`);
    }
    
    // Verificar continuidade (sem gaps)
    console.log('\n🔍 VERIFICANDO CONTINUIDADE:');
    let hasGaps = false;
    for (let i = 1; i < Math.min(20, salarioChildren.length); i++) {
      const prev = new Date(salarioChildren[i-1].date);
      const curr = new Date(salarioChildren[i].date);
      
      const diffMonths = (curr.getFullYear() - prev.getFullYear()) * 12 + curr.getMonth() - prev.getMonth();
      
      if (diffMonths > 1) {
        console.log(`   ⚠️  GAP: ${prev.toLocaleDateString()} → ${curr.toLocaleDateString()} (${diffMonths} meses)`);
        hasGaps = true;
      } else {
        console.log(`   ✅ OK: ${prev.toLocaleDateString()} → ${curr.toLocaleDateString()}`);
      }
    }
    
    if (!hasGaps) {
      console.log('   🎉 SALÁRIO: SEM GAPS - FUNCIONANDO PERFEITAMENTE!');
    }
  }
  
  // Comparar com uma transação de crédito
  console.log('\n=== COMPARANDO COM TRANSAÇÃO DE CRÉDITO ===');
  
  const disneyParent = await db.collection('transactions').findOne({
    description: 'DisneyPlus',
    isRecurring: true,
    paymentMethod: 'credito'
  });
  
  console.log('🎬 DISNEYPLUS (CRÉDITO):');
  console.log(`   📅 Data original: ${new Date(disneyParent.date).toLocaleDateString()}`);
  console.log(`   🔂 Dia recorrente: ${disneyParent.recurringDay}`);
  console.log(`   🆔 ID: ${disneyParent._id}`);
  
  const disneyChildren = await db.collection('transactions').find({
    recurringParentId: disneyParent._id
  }).sort({ date: 1 }).toArray();
  
  console.log(`   👥 Transações filhas: ${disneyChildren.length}`);
  
  if (disneyChildren.length > 0) {
    const firstChild = disneyChildren[0];
    const lastChild = disneyChildren[disneyChildren.length - 1];
    console.log(`   📅 Primeira: ${new Date(firstChild.date).toLocaleDateString()}`);
    console.log(`   📅 Última: ${new Date(lastChild.date).toLocaleDateString()}`);
    
    // Verificar se existe em janeiro 2026
    const january2026 = disneyChildren.find(child => {
      const date = new Date(child.date);
      return date.getFullYear() === 2026 && date.getMonth() === 0;
    });
    
    console.log(`   ❓ Existe em Janeiro 2026: ${january2026 ? 'SIM' : 'NÃO'}`);
    
    // Verificar onde para
    console.log('\n🔍 ÚLTIMAS 10 TRANSAÇÕES DISNEY:');
    const lastTen = disneyChildren.slice(-10);
    lastTen.forEach((t, i) => {
      console.log(`   ${disneyChildren.length - 10 + i + 1}. ${new Date(t.date).toLocaleDateString()}`);
    });
  }
  
  console.log('\n=== COMPARAÇÃO DE ESTRUTURAS ===');
  console.log('💰 SALÁRIO (funciona):');
  console.log(`   - paymentMethod: ${salarioParent.paymentMethod}`);
  console.log(`   - isRecurring: ${salarioParent.isRecurring}`);
  console.log(`   - recurringDay: ${salarioParent.recurringDay}`);
  console.log(`   - createdAt: ${salarioParent.createdAt}`);
  
  console.log('🎬 DISNEY (não funciona):');
  console.log(`   - paymentMethod: ${disneyParent.paymentMethod}`);
  console.log(`   - isRecurring: ${disneyParent.isRecurring}`);
  console.log(`   - recurringDay: ${disneyParent.recurringDay}`);
  console.log(`   - createdAt: ${disneyParent.createdAt}`);
  
  await client.close();
}

analyzeDebitRecurring().catch(console.error);
