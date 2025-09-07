const { MongoClient, ObjectId } = require('mongodb');

async function findCreditGap() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== INVESTIGANDO O GAP NAS TRANSAÇÕES DE CRÉDITO ===');
  
  // Analisar DisneyPlus em detalhes
  const disneyChildren = await db.collection('transactions').find({
    recurringParentId: new ObjectId('68bc7d84a1cc12d763fedce2')
  }).sort({ date: 1 }).toArray();
  
  console.log(`🎬 DisneyPlus - ${disneyChildren.length} transações filhas:`);
  
  // Mostrar TODAS as datas para encontrar o gap
  console.log('\n📅 TODAS AS DATAS DA DISNEY:');
  disneyChildren.forEach((t, i) => {
    const date = new Date(t.date);
    console.log(`${i+1}. ${date.toLocaleDateString()} (${date.getFullYear()}/${date.getMonth()+1})`);
  });
  
  // Verificar gaps específicos
  console.log('\n🔍 PROCURANDO GAPS:');
  for (let i = 1; i < disneyChildren.length; i++) {
    const prev = new Date(disneyChildren[i-1].date);
    const curr = new Date(disneyChildren[i].date);
    
    const diffMonths = (curr.getFullYear() - prev.getFullYear()) * 12 + curr.getMonth() - prev.getMonth();
    
    if (diffMonths > 1) {
      console.log(`⚠️  GAP GIGANTE: ${prev.toLocaleDateString()} → ${curr.toLocaleDateString()}`);
      console.log(`   Diferença: ${diffMonths} meses`);
      console.log(`   Anos perdidos: ${Math.floor(diffMonths/12)} anos`);
    }
  }
  
  await client.close();
}

findCreditGap().catch(console.error);
