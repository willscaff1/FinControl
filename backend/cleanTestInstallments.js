const mongoose = require('mongoose');

async function cleanTestInstallments() {
  try {
    await mongoose.connect('mongodb://localhost:27017/financial-control');
    console.log('🔌 Conectado ao MongoDB');
    
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    
    // Remover todas as transações de teste parceladas
    const deleteResult = await Transaction.deleteMany({ 
      isInstallment: true,
      description: { $regex: /TESTE.*\(\d+\/\d+\)/ } 
    });
    
    console.log(`🗑️  Removidas ${deleteResult.deletedCount} transações de teste parceladas`);
    
    // Verificar o que sobrou
    const remaining = await Transaction.find({ isInstallment: true });
    console.log(`💳 Transações parceladas restantes: ${remaining.length}`);
    
    if (remaining.length > 0) {
      remaining.forEach(t => {
        console.log(`   - ${t.description} | Parcela ${t.installmentNumber}/${t.totalInstallments}`);
      });
    }
    
    console.log('✅ Limpeza concluída! Pode testar as novas transações parceladas.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    process.exit(1);
  }
}

cleanTestInstallments();
