const mongoose = require('mongoose');

async function checkTransactions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/financial-control');
    console.log('🔌 Conectado ao MongoDB');
    
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    
    // Contar todas as transações
    const totalTransactions = await Transaction.countDocuments();
    console.log(`📊 TOTAL DE TRANSAÇÕES: ${totalTransactions}`);
    console.log('');
    
    // Verificar transações normais
    const normalTransactions = await Transaction.find({ 
      $or: [
        { isRecurring: { $ne: true }, isInstallment: { $ne: true } },
        { isRecurring: false, isInstallment: false }
      ]
    });
    console.log(`💰 TRANSAÇÕES NORMAIS: ${normalTransactions.length}`);
    
    // Verificar transações recorrentes
    const recurringTransactions = await Transaction.find({ isRecurring: true });
    console.log(`🔄 TRANSAÇÕES RECORRENTES: ${recurringTransactions.length}`);
    
    // Verificar transações parceladas
    const installmentTransactions = await Transaction.find({ isInstallment: true });
    console.log(`💳 TRANSAÇÕES PARCELADAS: ${installmentTransactions.length}`);
    console.log('');
    
    if (installmentTransactions.length > 0) {
      console.log('📋 DETALHES DAS TRANSAÇÕES PARCELADAS:');
      
      // Agrupar por installmentParentId
      const groupedInstallments = {};
      
      installmentTransactions.forEach(t => {
        const parentId = t.installmentParentId || 'sem-parent';
        if (!groupedInstallments[parentId]) {
          groupedInstallments[parentId] = [];
        }
        groupedInstallments[parentId].push(t);
      });
      
      Object.keys(groupedInstallments).forEach(parentId => {
        const group = groupedInstallments[parentId];
        console.log(`\n   🏷️  Grupo ${parentId}:`);
        
        group.forEach(t => {
          console.log(`      - ${t.description} | R$ ${t.amount} | ${t.type} ${t.paymentMethod} | Parcela ${t.installmentNumber}/${t.totalInstallments} | ${new Date(t.date).toLocaleDateString()}`);
        });
        
        // Verificar se há duplicatas neste grupo
        const installmentNumbers = group.map(t => t.installmentNumber);
        const uniqueNumbers = [...new Set(installmentNumbers)];
        
        if (installmentNumbers.length !== uniqueNumbers.length) {
          console.log(`      ⚠️  DUPLICATAS DETECTADAS neste grupo!`);
        }
      });
    }
    
    console.log('');
    console.log('✅ Verificação concluída!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    process.exit(1);
  }
}

checkTransactions();
