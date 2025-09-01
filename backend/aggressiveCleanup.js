/**
 * Script de limpeza agressiva - deixa apenas 1 template e 1 transação por mês
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => console.log('❌ Erro:', err.message));

// Schema das transações
const TransactionSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  type: String,
  category: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  isRecurring: { type: Boolean, default: false },
  recurringDay: { type: Number },
  recurringParentId: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', TransactionSchema);

async function aggressiveCleanup() {
  try {
    console.log('🧹 Iniciando limpeza agressiva do banco de dados...');
    
    // 1. Deletar TODAS as transações que não são templates
    const deleted = await Transaction.deleteMany({ 
      isRecurring: { $ne: true }
    });
    console.log(`❌ ${deleted.deletedCount} transações (não-templates) deletadas`);
    
    // 2. Manter apenas 1 template
    const templates = await Transaction.find({ isRecurring: true });
    console.log(`📋 Templates encontrados: ${templates.length}`);
    
    if (templates.length > 1) {
      // Manter o primeiro, deletar o resto
      const keepTemplate = templates[0];
      const deleteTemplates = templates.slice(1);
      
      console.log(`✅ Mantendo template: ${keepTemplate._id} - ${keepTemplate.description}`);
      
      for (const template of deleteTemplates) {
        console.log(`❌ Deletando template extra: ${template._id}`);
        await Transaction.deleteOne({ _id: template._id });
      }
    }
    
    console.log('✅ Limpeza agressiva concluída!');
    
    // 3. Mostrar estatísticas finais
    const finalTemplates = await Transaction.countDocuments({ isRecurring: true });
    const finalTransactions = await Transaction.countDocuments({ isRecurring: false });
    
    console.log(`📊 Resultado final:`);
    console.log(`   Templates: ${finalTemplates}`);
    console.log(`   Transações: ${finalTransactions}`);
    console.log(`   Total: ${finalTemplates + finalTransactions}`);
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  } finally {
    mongoose.disconnect();
  }
}

aggressiveCleanup();
