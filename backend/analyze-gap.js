const { MongoClient } = require('mongodb');

async function analyzeRecurringGap() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== ANALISANDO ONDE AS TRANSAÇÕES PARAM ===');
  
  // Pegar o DisneyPlus como exemplo
  const disneyChildren = await db.collection('transactions').find({
    recurringParentId: new ObjectId('68bc7d84a1cc12d763fedce2') // DisneyPlus
  }).sort({ date: 1 }).toArray();
  
  console.log(`📊 DisneyPlus - Total de ${disneyChildren.length} transações filhas:`);
  
  // Mostrar as últimas 10 transações
  const lastTen = disneyChildren.slice(-10);
  lastTen.forEach((t, i) => {
    console.log(`${disneyChildren.length - 10 + i + 1}. ${new Date(t.date).toLocaleDateString()}`);
  });
  
  // Verificar se há um gap específico
  for (let i = 1; i < disneyChildren.length; i++) {
    const prev = new Date(disneyChildren[i-1].date);
    const curr = new Date(disneyChildren[i].date);
    
    const diffMonths = (curr.getFullYear() - prev.getFullYear()) * 12 + curr.getMonth() - prev.getMonth();
    
    if (diffMonths > 1) {
      console.log(`⚠️  GAP ENCONTRADO entre ${prev.toLocaleDateString()} e ${curr.toLocaleDateString()}`);
      console.log(`   Diferença: ${diffMonths} meses`);
    }
  }
  
  await client.close();
}

// Adicionar ObjectId import
const { ObjectId } = require('mongodb');

analyzeRecurringGap().catch(console.error);
