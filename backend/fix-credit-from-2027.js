const { MongoClient, ObjectId } = require('mongodb');

async function fixCreditRecurringFrom2027() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== CORRIGINDO TRANSAÇÕES DE CRÉDITO A PARTIR DE 2027 ===');
  
  // Buscar todas as transações "mãe" de crédito
  const creditParents = await db.collection('transactions').find({
    isRecurring: true,
    paymentMethod: 'credito'
  }).toArray();
  
  console.log(`🔍 Encontradas ${creditParents.length} transações de crédito "mãe"`);
  
  let totalFixed = 0;
  
  for (const parent of creditParents) {
    console.log(`\n💳 Processando: ${parent.description}`);
    
    // Definir período: de janeiro 2027 até dezembro 2030 (4 anos)
    const startMonth = 1;  // Janeiro
    const startYear = 2027;
    const endMonth = 12;   // Dezembro  
    const endYear = 2030;
    
    let currentMonth = startMonth;
    let currentYear = startYear;
    let createdCount = 0;
    
    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      // Verificar se já existe transação para este mês
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
      const endOfMonth = new Date(currentYear, currentMonth, 0);
      
      const existingTransaction = await db.collection('transactions').findOne({
        recurringParentId: parent._id,
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });
      
      if (!existingTransaction) {
        // Não existe, vamos criar
        const targetDay = Math.min(parent.recurringDay || new Date(parent.date).getDate(), endOfMonth.getDate());
        const transactionDate = new Date(currentYear, currentMonth - 1, targetDay, 12, 0, 0);
        
        const newTransaction = {
          description: parent.description,
          amount: parent.amount,
          type: parent.type,
          category: parent.category,
          paymentMethod: parent.paymentMethod,
          bank: parent.bank,
          creditCard: parent.creditCard,
          notes: parent.notes,
          userId: parent.userId,
          date: transactionDate,
          isRecurring: false,
          isFixed: true,
          recurringParentId: parent._id,
          createdAt: new Date(),
          updatedAt: new Date(),
          __v: 0
        };
        
        await db.collection('transactions').insertOne(newTransaction);
        createdCount++;
        console.log(`   ✅ Criada para ${currentMonth}/${currentYear}`);
      } else {
        console.log(`   ⏭️  Já existe para ${currentMonth}/${currentYear}`);
      }
      
      // Avançar para o próximo mês
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }
    
    console.log(`   📊 Total criadas: ${createdCount}`);
    totalFixed += createdCount;
  }
  
  console.log(`\n🎉 CORREÇÃO DE CRÉDITO CONCLUÍDA!`);
  console.log(`📊 Total de transações de crédito criadas: ${totalFixed}`);
  
  await client.close();
}

fixCreditRecurringFrom2027().catch(console.error);
