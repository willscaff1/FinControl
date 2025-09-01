const mongoose = require('mongoose');

async function cleanOrphanInstallments() {
  try {
    await mongoose.connect('mongodb://localhost:27017/financial-control');
    console.log('🔌 Conectado ao MongoDB');
    
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    
    // Buscar parcelas órfãs (sem installmentParentId)
    const orphans = await Transaction.find({ 
      isInstallment: true,
      installmentParentId: { $exists: false }
    });
    
    console.log(`🔍 Encontradas ${orphans.length} parcelas órfãs`);
    
    if (orphans.length > 0) {
      orphans.forEach(t => {
        console.log(`   - ${t.description} | Parcela ${t.installmentNumber}/${t.totalInstallments}`);
      });
      
      // Deletar parcelas órfãs
      const deleteResult = await Transaction.deleteMany({
        isInstallment: true,
        installmentParentId: { $exists: false }
      });
      
      console.log(`🗑️  Deletadas ${deleteResult.deletedCount} parcelas órfãs`);
    }
    
    console.log('\n✅ Limpeza concluída!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    process.exit(1);
  }
}

cleanOrphanInstallments();
