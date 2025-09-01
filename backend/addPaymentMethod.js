/**
 * Script para adicionar paymentMethod aos registros existentes
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => console.log('❌ Erro:', err.message));

// Schema atualizado das transações
const TransactionSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  type: String,
  category: String,
  paymentMethod: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  isRecurring: { type: Boolean, default: false },
  recurringDay: { type: Number },
  recurringParentId: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', TransactionSchema);

async function addPaymentMethodField() {
  try {
    console.log('🔧 Adicionando campo paymentMethod aos registros existentes...');
    
    // Encontrar todas as transações que não têm paymentMethod
    const transactionsWithoutPayment = await Transaction.find({
      paymentMethod: { $exists: false }
    });
    
    console.log(`📋 Transações sem paymentMethod: ${transactionsWithoutPayment.length}`);
    
    if (transactionsWithoutPayment.length > 0) {
      // Adicionar paymentMethod padrão
      const result = await Transaction.updateMany(
        { paymentMethod: { $exists: false } },
        { $set: { paymentMethod: 'pix' } }
      );
      
      console.log(`✅ ${result.modifiedCount} registros atualizados com paymentMethod: 'pix'`);
    }
    
    // Mostrar estatísticas finais
    const finalCount = await Transaction.countDocuments({});
    const withPaymentMethod = await Transaction.countDocuments({
      paymentMethod: { $exists: true }
    });
    
    console.log(`📊 Resultado:`);
    console.log(`   Total de transações: ${finalCount}`);
    console.log(`   Com paymentMethod: ${withPaymentMethod}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    mongoose.disconnect();
  }
}

addPaymentMethodField();
