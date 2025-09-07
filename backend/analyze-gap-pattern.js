const { MongoClient, ObjectId } = require('mongodb');

async function analyzeGapPattern() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== ANALISANDO O PADRÃO DO GAP ===');
  
  // Pegar o DisneyPlus como exemplo
  const disneyParent = await db.collection('transactions').findOne({
    description: 'DisneyPlus',
    isRecurring: true
  });
  
  console.log(`🎬 Analisando DisneyPlus - ID: ${disneyParent._id}`);
  
  // Buscar TODAS as transações filhas
  const allDisneyTransactions = await db.collection('transactions').find({
    $or: [
      { _id: disneyParent._id },
      { recurringParentId: disneyParent._id }
    ]
  }).sort({ date: 1 }).toArray();
  
  console.log(`📊 Total de transações: ${allDisneyTransactions.length}`);
  
  // Analisar ano por ano
  console.log('\n📅 ANÁLISE ANO POR ANO:');
  
  const years = {};
  allDisneyTransactions.forEach(t => {
    const year = new Date(t.date).getFullYear();
    if (!years[year]) years[year] = [];
    years[year].push(t);
  });
  
  Object.keys(years).sort().forEach(year => {
    console.log(`\n${year}: ${years[year].length} transações`);
    years[year].forEach(t => {
      const date = new Date(t.date);
      const isParent = t.isRecurring;
      console.log(`   ${date.toLocaleDateString()} ${isParent ? '(MÃE)' : '(FILHA)'}`);
    });
  });
  
  // Identificar gaps específicos
  console.log('\n🔍 IDENTIFICANDO GAPS:');
  for (let i = 1; i < allDisneyTransactions.length; i++) {
    const prev = new Date(allDisneyTransactions[i-1].date);
    const curr = new Date(allDisneyTransactions[i].date);
    
    const prevYear = prev.getFullYear();
    const prevMonth = prev.getMonth() + 1;
    const currYear = curr.getFullYear();
    const currMonth = curr.getMonth() + 1;
    
    const diffMonths = (currYear - prevYear) * 12 + currMonth - prevMonth;
    
    if (diffMonths > 1) {
      console.log(`\n⚠️  GAP ENCONTRADO:`);
      console.log(`   De: ${prev.toLocaleDateString()} (${prevMonth}/${prevYear})`);
      console.log(`   Para: ${curr.toLocaleDateString()} (${currMonth}/${currYear})`);
      console.log(`   Diferença: ${diffMonths} meses`);
      
      // Verificar se há um padrão
      if (diffMonths === 31) {
        console.log(`   🔍 PADRÃO: Gap de exatamente 31 meses (2 anos e 7 meses)`);
      }
    }
  }
  
  // Verificar especificamente setembro 2028
  console.log('\n🔍 VERIFICANDO SETEMBRO 2028:');
  const sept2028 = allDisneyTransactions.find(t => {
    const date = new Date(t.date);
    return date.getFullYear() === 2028 && date.getMonth() === 8; // Setembro = 8
  });
  
  if (sept2028) {
    console.log(`✅ Encontrada em Setembro 2028: ${new Date(sept2028.date).toLocaleDateString()}`);
    console.log(`   Tipo: ${sept2028.isRecurring ? 'MÃE' : 'FILHA'}`);
    console.log(`   Parent ID: ${sept2028.recurringParentId}`);
  } else {
    console.log(`❌ Não encontrada em Setembro 2028`);
  }
  
  // Verificar quando param novamente
  console.log('\n🔍 VERIFICANDO QUANDO PARAM NOVAMENTE:');
  const lastTransaction = allDisneyTransactions[allDisneyTransactions.length - 1];
  console.log(`Última transação: ${new Date(lastTransaction.date).toLocaleDateString()}`);
  
  // Verificar se há um padrão de criação automática
  console.log('\n🤖 ANALISANDO CRIAÇÃO AUTOMÁTICA:');
  
  // Agrupar por data de criação
  const creationGroups = {};
  allDisneyTransactions.forEach(t => {
    if (t.createdAt) {
      const creationDate = new Date(t.createdAt).toLocaleDateString();
      if (!creationGroups[creationDate]) creationGroups[creationDate] = [];
      creationGroups[creationDate].push(t);
    }
  });
  
  console.log('Grupos por data de criação:');
  Object.keys(creationGroups).sort().forEach(date => {
    const group = creationGroups[date];
    console.log(`   ${date}: ${group.length} transações criadas`);
    
    if (group.length > 10) {
      console.log(`     ⚡ CRIAÇÃO EM MASSA - ${group.length} transações`);
      const firstDate = new Date(group[0].date).toLocaleDateString();
      const lastDate = new Date(group[group.length - 1].date).toLocaleDateString();
      console.log(`     Período: ${firstDate} até ${lastDate}`);
    }
  });
  
  await client.close();
}

analyzeGapPattern().catch(console.error);
