const { MongoClient, ObjectId } = require('mongodb');

async function fixRecurringTransactions() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== CORRIGINDO TRANSAÇÕES RECORRENTES ===');
  
  // Buscar todas as transações "mãe" (isRecurring: true)
  const parentTransactions = await db.collection('transactions').find({
    isRecurring: true
  }).toArray();
  
  console.log(`🔍 Encontradas ${parentTransactions.length} transações recorrentes "mãe"`);
  
  let totalFixed = 0;
  
  for (const parent of parentTransactions) {
    console.log(`\n🔄 Processando: ${parent.description}`);
    
    // Definir período: de setembro 2025 até dezembro 2026 (15 meses)
    const startMonth = 9;  // Setembro
    const startYear = 2025;
    const endMonth = 12;   // Dezembro
    const endYear = 2026;
    
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
  
  console.log(`\n🎉 CORREÇÃO CONCLUÍDA!`);
  console.log(`📊 Total de transações criadas: ${totalFixed}`);
  
  await client.close();
}

fixRecurringTransactions().catch(console.error);
