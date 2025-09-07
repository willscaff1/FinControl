const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/financial-control-system');

const transactionSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  type: String,
  category: String,
  paymentMethod: String,
  bank: String,
  creditCard: String,
  notes: String,
  userId: String,
  date: Date,
  isRecurring: Boolean,
  isFixed: Boolean,
  recurringParentId: mongoose.Schema.Types.ObjectId,
  recurringDay: Number
});

const Transaction = mongoose.model('Transaction', transactionSchema);

(async () => {
  try {
    console.log('🔍 Verificando templates recorrentes...');
    
    // Buscar templates recorrentes
    const templates = await Transaction.find({ isRecurring: true }).sort({ description: 1 });
    console.log('Templates encontrados:', templates.length);
    
    if (templates.length > 0) {
      console.log('\n📋 Templates:');
      templates.forEach(template => {
        console.log(`- ${template.description} (${template.paymentMethod} - ${template.bank || template.creditCard})`);
      });
    } else {
      console.log('❌ Nenhum template recorrente encontrado');
      console.log('💡 Vamos criar um template de teste para débito...');
      
      const testTemplate = new Transaction({
        description: 'Conta de Luz',
        amount: 150.00,
        type: 'saida',
        category: 'casa',
        paymentMethod: 'debito',
        bank: 'Bradesco',
        notes: 'Conta mensal de energia',
        userId: '675a4d24bcba5653a36fe908',
        isRecurring: true,
        recurringDay: 15,
        date: new Date('2025-09-15T12:00:00')
      });
      
      await testTemplate.save();
      console.log('✅ Template de teste criado: Conta de Luz');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
})();
