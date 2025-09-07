require('dotenv').config();
const mongoose = require('mongoose');

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.log('⚠️  MongoDB:', err.message));

const TransactionSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  type: String,
  category: String,
  paymentMethod: String,
  bank: String,
  creditCard: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  isRecurring: { type: Boolean, default: false },
  recurringDay: { type: Number },
  recurringParentId: { type: mongoose.Schema.Types.ObjectId },
  isInstallment: { type: Boolean, default: false },
  installmentNumber: { type: Number },
  totalInstallments: { type: Number },
  installmentParentId: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', TransactionSchema);

async function investigateDuplicates() {
  try {
    console.log('🔍 Investigando duplicatas em setembro/2025...\n');
    
    // Buscar todas as transações de setembro 2025
    const startDate = new Date(2025, 8, 1); // Setembro = mês 8 (0-indexed)
    const endDate = new Date(2025, 8, 30, 23, 59, 59, 999);
    
    const allTransactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });
    
    console.log(`📊 Total de transações em setembro/2025: ${allTransactions.length}\n`);
    
    // Analisar tipos de transações
    const templates = allTransactions.filter(t => t.isRecurring);
    const generated = allTransactions.filter(t => t.recurringParentId);
    const normal = allTransactions.filter(t => !t.isRecurring && !t.recurringParentId);
    const installments = allTransactions.filter(t => t.isInstallment);
    
    console.log(`📋 Breakdown:`);
    console.log(`  - Templates (isRecurring): ${templates.length}`);
    console.log(`  - Geradas (recurringParentId): ${generated.length}`);
    console.log(`  - Normais: ${normal.length}`);
    console.log(`  - Parcelamentos: ${installments.length}\n`);
    
    // Encontrar duplicatas por descrição
    const descriptions = allTransactions.map(t => t.description);
    const duplicateDescriptions = descriptions.filter((desc, index) => descriptions.indexOf(desc) !== index);
    const uniqueDuplicates = [...new Set(duplicateDescriptions)];
    
    if (uniqueDuplicates.length > 0) {
      console.log(`⚠️ DUPLICATAS ENCONTRADAS: ${uniqueDuplicates.length}`);
      
      for (const desc of uniqueDuplicates) {
        console.log(`\n🔍 Analisando: "${desc}"`);
        const duplicates = allTransactions.filter(t => t.description === desc);
        
        duplicates.forEach((dup, index) => {
          console.log(`  ${index + 1}. ID: ${dup._id}`);
          console.log(`     Data: ${dup.date.toISOString().split('T')[0]}`);
          console.log(`     Valor: R$ ${dup.amount}`);
          console.log(`     isRecurring: ${dup.isRecurring}`);
          console.log(`     recurringParentId: ${dup.recurringParentId || 'N/A'}`);
          console.log(`     Método: ${dup.paymentMethod}`);
          console.log(`     Bank/Cartão: ${dup.bank || dup.creditCard || 'N/A'}`);
          console.log(`     CreatedAt: ${dup.createdAt}`);
        });
      }
    }
    
    // Listar templates existentes
    console.log(`\n📌 TEMPLATES RECORRENTES EXISTENTES:`);
    const allTemplates = await Transaction.find({ isRecurring: true });
    allTemplates.forEach(template => {
      console.log(`  - ${template.description} (ID: ${template._id})`);
      console.log(`    Data original: ${template.date.toISOString().split('T')[0]}`);
      console.log(`    Dia recorrente: ${template.recurringDay || 'N/A'}`);
      console.log(`    Método: ${template.paymentMethod}, Bank/Cartão: ${template.bank || template.creditCard || 'N/A'}\n`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    mongoose.disconnect();
  }
}

investigateDuplicates();
