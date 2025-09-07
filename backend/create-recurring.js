const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb://localhost:27017";

async function createRecurringTransactions() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Conectado ao MongoDB Local');
    
    const db = client.db('financial-control');
    const transactions = db.collection('transactions');
    
    // Primeiro, marcar apenas transações de débito/PIX como recorrentes para bancos
    const result1 = await transactions.updateOne(
      { description: 'SALÁRIO', bank: 'Bradesco', paymentMethod: 'debito' },
      { 
        $set: { 
          isRecurring: true,
          recurringDay: 5
        } 
      }
    );
    
    console.log('✅ SALÁRIO marcado como recorrente:', result1.modifiedCount);
    
    // Remover isRecurring das transações de crédito (elas não devem aparecer em bancos)
    const result2 = await transactions.updateMany(
      { paymentMethod: 'credito', isRecurring: true },
      { 
        $unset: { 
          isRecurring: "",
          recurringDay: ""
        } 
      }
    );
    
    console.log('✅ Transações de crédito desmarcadas:', result2.modifiedCount);
    
    // Criar mais transações recorrentes de débito/PIX para banco
    const recurringTransactions = [
      {
        description: 'Aluguel Mensal',
        amount: 1200,
        type: 'expense',
        category: 'moradia',
        paymentMethod: 'debito',
        bank: 'Bradesco',
        date: new Date('2025-09-05'),
        isRecurring: true,
        recurringDay: 5,
        notes: 'Aluguel fixo mensal'
      },
      {
        description: 'Conta de Água',
        amount: 80,
        type: 'expense',
        category: 'casa',
        paymentMethod: 'debito',
        bank: 'Bradesco',
        date: new Date('2025-09-10'),
        isRecurring: true,
        recurringDay: 10,
        notes: 'Conta de água mensal'
      },
      {
        description: 'Conta de Luz',
        amount: 150,
        type: 'expense',
        category: 'casa',
        paymentMethod: 'pix',
        bank: 'Bradesco',
        date: new Date('2025-09-15'),
        isRecurring: true,
        recurringDay: 15,
        notes: 'Conta de luz mensal'
      }
    ];
    
    for (const transaction of recurringTransactions) {
      // Verificar se já existe
      const existing = await transactions.findOne({ 
        description: transaction.description,
        bank: transaction.bank 
      });
      
      if (!existing) {
        const result = await transactions.insertOne(transaction);
        console.log(`✅ Transação recorrente criada: ${transaction.description}`);
      } else {
        console.log(`⚠️ Transação já existe: ${transaction.description}`);
      }
    }
    
    // Listar apenas transações recorrentes de débito/PIX (para bancos)
    const recurringBank = await transactions.find({ 
      isRecurring: true,
      $or: [
        { paymentMethod: 'debito' },
        { paymentMethod: 'pix' }
      ]
    }).toArray();
    
    console.log('🔄 Transações recorrentes para BANCOS (débito/PIX):');
    recurringBank.forEach(t => {
      console.log(`- ${t.description} (${t.paymentMethod}, ${t.bank})`);
    });
    
    // Listar transações recorrentes de crédito (para cartões)
    const recurringCredit = await transactions.find({ 
      isRecurring: true,
      paymentMethod: 'credito'
    }).toArray();
    
    console.log('💳 Transações recorrentes para CARTÕES (crédito):');
    recurringCredit.forEach(t => {
      console.log(`- ${t.description} (${t.paymentMethod}, ${t.creditCard})`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
  }
}

createRecurringTransactions();
