const mongoose = require('mongoose');

// Conectar ao banco
mongoose.connect('mongodb://localhost:27017/financial-control');

// Schema da transação (simplificado)
const TransactionSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  type: String,
  category: String,
  paymentMethod: String,
  bank: String,
  creditCard: String,
  userId: { type: mongoose.Schema.Types.ObjectId },
  date: { type: Date, default: Date.now },
  isRecurring: { type: Boolean, default: false },
  recurringDay: { type: Number },
  recurringParentId: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', TransactionSchema);

async function simulateAPI() {
  try {
    console.log('🧪 Simulando API call: GET /api/transactions?month=9&year=2025');
    
    const month = 9;  // Setembro
    const year = 2025;
    
    // Simular a mesma lógica da API
    const startDate = new Date(year, month - 1, 1); // Primeiro dia do mês  
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Último dia do mês
    
    console.log(`📅 Filtrando por período: ${startDate.toISOString()} até ${endDate.toISOString()}`);
    
    let query = {};
    query.date = { $gte: startDate, $lte: endDate };
    query.isRecurring = { $ne: true }; // Excluir os templates de transações fixas da lista
    
    console.log('🔍 Query utilizada:', JSON.stringify(query, null, 2));
    
    const transactions = await Transaction.find(query).sort({ date: -1 });
    
    console.log(`📊 Total de transações retornadas: ${transactions.length}`);
    
    // Filtrar apenas transações de bancos
    const bankTransactions = transactions.filter(t => 
      t.bank && 
      (t.paymentMethod === 'debito' || t.paymentMethod === 'pix')
    );
    
    console.log(`🏦 Transações de bancos (débito/pix): ${bankTransactions.length}`);
    
    bankTransactions.forEach(tx => {
      const isGenerated = tx.recurringParentId ? '🔄' : '📝';
      console.log(`  ${isGenerated} ${tx.description} (${tx.bank}) - R$ ${tx.amount} - ${tx.date.toISOString().split('T')[0]} - Parent: ${tx.recurringParentId || 'N/A'}`);
    });
    
    // Verificar especificamente transações com recurringParentId
    const generatedBankTransactions = bankTransactions.filter(t => t.recurringParentId);
    console.log(`\n🔄 Transações de banco GERADAS (com recurringParentId): ${generatedBankTransactions.length}`);
    
    generatedBankTransactions.forEach(tx => {
      console.log(`  ✨ ${tx.description} (${tx.bank}) - R$ ${tx.amount} - ${tx.date.toISOString().split('T')[0]}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.disconnect();
  }
}

simulateAPI();
