const { MongoClient, ObjectId } = require('mongodb');

async function forceGeneration() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('financial-control');
    const transactions = db.collection('transactions');
    
    console.log('🔄 Forçando geração manual para setembro 2025...');
    
    // Buscar templates recorrentes de bancos
    const bankTemplates = await transactions.find({
      isRecurring: true,
      bank: { $ne: null, $ne: '' },
      paymentMethod: { $in: ['debito', 'pix'] }
    }).toArray();
    
    console.log(`📋 Templates de bancos encontrados: ${bankTemplates.length}`);
    
    const month = 9; // Setembro
    const year = 2025;
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    
    for (const template of bankTemplates) {
      console.log(`\n🔍 Processando template: ${template.description}`);
      
      // Verificar se já existe transação gerada para este template no mês
      const existingTransaction = await transactions.findOne({
        recurringParentId: template._id,
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });
      
      if (existingTransaction) {
        console.log(`✅ Já existe: ${existingTransaction.description} em ${existingTransaction.date.toISOString().split('T')[0]}`);
      } else {
        console.log(`🚀 Criando nova transação...`);
        
        // Determinar o dia da transação no mês
        const targetDay = Math.min(template.recurringDay || template.date.getDate(), endOfMonth.getDate());
        const transactionDate = new Date(year, month - 1, targetDay, 12, 0, 0);
        
        console.log(`📅 Data calculada: ${transactionDate.toISOString().split('T')[0]} (dia ${targetDay})`);
        
        // Criar a transação
        const newTransaction = {
          description: template.description,
          amount: template.amount,
          type: template.type,
          category: template.category,
          paymentMethod: template.paymentMethod,
          bank: template.bank,
          date: transactionDate,
          isRecurring: false,
          recurringParentId: template._id,
          userId: template.userId
        };
        
        const result = await transactions.insertOne(newTransaction);
        console.log(`✅ Transação criada com ID: ${result.insertedId}`);
      }
    }
    
    console.log('\n🎉 Geração concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
  }
}

forceGeneration();
