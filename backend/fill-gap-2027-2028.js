const { MongoClient, ObjectId } = require('mongodb');

async function fillGap2027And2028() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('financial-control');
  
  console.log('=== PREENCHENDO GAP 2027 E INÍCIO DE 2028 ===');
  
  // Buscar todas as transações "mãe" de crédito
  const creditParents = await db.collection('transactions').find({
    isRecurring: true,
    paymentMethod: 'credito'
  }).toArray();
  
  console.log(`🔍 Encontradas ${creditParents.length} transações de crédito "mãe"`);
  
  let totalFixed = 0;
  
  for (const parent of creditParents) {
    console.log(`\n💳 Processando: ${parent.description}`);
    
    let createdCount = 0;
    
    // PREENCHER TODO O ANO 2027 (12 meses)
    console.log('   📅 Preenchendo 2027...');
    for (let month = 1; month <= 12; month++) {
      const startOfMonth = new Date(2027, month - 1, 1);
      const endOfMonth = new Date(2027, month, 0);
      
      const existingTransaction = await db.collection('transactions').findOne({
        recurringParentId: parent._id,
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });
      
      if (!existingTransaction) {
        const targetDay = Math.min(parent.recurringDay || new Date(parent.date).getDate(), endOfMonth.getDate());
        const transactionDate = new Date(2027, month - 1, targetDay, 12, 0, 0);
        
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
        console.log(`      ✅ ${month}/2027`);
      } else {
        console.log(`      ⏭️  ${month}/2027 já existe`);
      }
    }
    
    // PREENCHER JANEIRO A AGOSTO 2028 (8 meses)
    console.log('   📅 Preenchendo Jan-Ago 2028...');
    for (let month = 1; month <= 8; month++) {
      const startOfMonth = new Date(2028, month - 1, 1);
      const endOfMonth = new Date(2028, month, 0);
      
      const existingTransaction = await db.collection('transactions').findOne({
        recurringParentId: parent._id,
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });
      
      if (!existingTransaction) {
        const targetDay = Math.min(parent.recurringDay || new Date(parent.date).getDate(), endOfMonth.getDate());
        const transactionDate = new Date(2028, month - 1, targetDay, 12, 0, 0);
        
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
        console.log(`      ✅ ${month}/2028`);
      } else {
        console.log(`      ⏭️  ${month}/2028 já existe`);
      }
    }
    
    console.log(`   📊 Total criadas: ${createdCount}`);
    totalFixed += createdCount;
  }
  
  console.log(`\n🎉 PREENCHIMENTO DO GAP CONCLUÍDO!`);
  console.log(`📊 Total de transações criadas: ${totalFixed}`);
  
  await client.close();
}

fillGap2027And2028().catch(console.error);
