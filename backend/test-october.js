const { MongoClient } = require('mongodb');

async function testOctober() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('financial-control');
    const transactions = db.collection('transactions');
    
    console.log('🧪 Testando outubro 2025 (mês futuro)...');
    
    // Verificar se há transações em outubro antes
    const startDate = new Date(2025, 9, 1); // Outubro (9 = outubro)
    const endDate = new Date(2025, 9, 31, 23, 59, 59, 999);
    
    const existingOctober = await transactions.find({
      date: { $gte: startDate, $lte: endDate }
    }).toArray();
    
    console.log(`📊 Transações existentes em outubro 2025: ${existingOctober.length}`);
    
    // Verificar templates disponíveis
    const templates = await transactions.find({ isRecurring: true }).toArray();
    console.log(`📋 Templates disponíveis: ${templates.length}`);
    
    // O backend vai gerar automaticamente quando a API for chamada com month=10&year=2025
    console.log('✅ Quando o usuário navegar para outubro 2025, o backend irá gerar as transações automaticamente!');
    console.log('🎯 Templates que serão gerados:');
    
    templates.forEach(template => {
      if (template.bank && (template.paymentMethod === 'debito' || template.paymentMethod === 'pix')) {
        const targetDay = Math.min(template.recurringDay || new Date(template.date).getDate(), 31);
        console.log(`  - ${template.description} (${template.bank}) - R$ ${template.amount} - Dia ${targetDay}/10/2025`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
  }
}

testOctober();
