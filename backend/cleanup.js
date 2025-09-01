const mongoose = require('mongoose');

// Definir o schema da transação
const transactionSchema = new mongoose.Schema({}, { strict: false });
const Transaction = mongoose.model('Transaction', transactionSchema);

async function cleanup() {
  try {
    await mongoose.connect('mongodb://localhost:27017/financial-app');
    console.log('🔌 Conectado ao MongoDB');
    
    // Contar total
    const total = await Transaction.countDocuments();
    console.log(`📊 Total antes: ${total}`);
    
    // Remover todas as instâncias (manter só templates)
    const deleteResult = await Transaction.deleteMany({ 
      $or: [
        { isRecurring: { $ne: true } },
        { isRecurring: false }
      ]
    });
    
    console.log(`🗑️  Removidas: ${deleteResult.deletedCount}`);
    
    // Contar restantes
    const remaining = await Transaction.countDocuments();
    console.log(`📊 Restantes: ${remaining}`);
    
    // Mostrar templates
    const templates = await Transaction.find({ isRecurring: true });
    console.log('📋 Templates:');
    templates.forEach(t => {
      console.log(`   - ${t.description} (${t._id})`);
    });
    
    console.log('✅ Limpeza concluída!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

cleanup();
