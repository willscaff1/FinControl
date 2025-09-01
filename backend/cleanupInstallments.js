const mongoose = require('mongoose');

async function cleanupInstallmentDuplicates() {
  try {
    await mongoose.connect('mongodb://localhost:27017/financial-control');
    console.log('🔌 Conectado ao MongoDB');
    
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    
    // Contar transações antes
    const totalBefore = await Transaction.countDocuments();
    console.log(`📊 Total de transações ANTES: ${totalBefore}`);
    
    // Encontrar transações parceladas
    const installmentTransactions = await Transaction.find({ isInstallment: true });
    console.log(`💳 Transações parceladas encontradas: ${installmentTransactions.length}`);
    
    // Mostrar detalhes
    installmentTransactions.forEach(t => {
      console.log(`   - ${t.description} | R$ ${t.amount} | Parcela ${t.installmentNumber}/${t.totalInstallments} | ${new Date(t.date).toLocaleDateString()}`);
    });
    
    // Remover TODAS as transações parceladas para começar limpo
    const deleteResult = await Transaction.deleteMany({ isInstallment: true });
    console.log(`🗑️  Transações parceladas removidas: ${deleteResult.deletedCount}`);
    
    // Contar transações depois
    const totalAfter = await Transaction.countDocuments();
    console.log(`📊 Total de transações DEPOIS: ${totalAfter}`);
    
    console.log('✅ Limpeza concluída! Agora pode testar novamente.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    process.exit(1);
  }
}

cleanupInstallmentDuplicates();
