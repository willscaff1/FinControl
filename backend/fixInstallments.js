const mongoose = require('mongoose');

async function fixInstallmentProblems() {
  try {
    await mongoose.connect('mongodb://localhost:27017/financial-control');
    console.log('🔌 Conectado ao MongoDB');
    
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    
    // Encontrar todas as transações parceladas
    const installmentTransactions = await Transaction.find({ isInstallment: true }).sort({ installmentNumber: 1 });
    console.log(`💳 Encontradas ${installmentTransactions.length} transações parceladas`);
    
    // Encontrar a parcela 1/12 sem parent
    const firstInstallment = installmentTransactions.find(t => 
      t.installmentNumber === 1 && 
      t.totalInstallments === 12 && 
      !t.installmentParentId
    );
    
    if (firstInstallment) {
      console.log(`🔧 Corrigindo parcela 1/12: ${firstInstallment.description}`);
      
      // Encontrar as outras parcelas do mesmo grupo (2-12)
      const otherInstallments = installmentTransactions.filter(t =>
        t.installmentParentId && 
        t.totalInstallments === 12 &&
        t.description === firstInstallment.description
      );
      
      console.log(`📋 Encontradas ${otherInstallments.length} outras parcelas do mesmo grupo`);
      
      if (otherInstallments.length > 0) {
        // Usar o ID da primeira parcela como parent para todas
        const parentId = firstInstallment._id.toString();
        
        // Atualizar a primeira parcela para ter installmentParentId
        await Transaction.updateOne(
          { _id: firstInstallment._id },
          { installmentParentId: parentId }
        );
        console.log(`✅ Primeira parcela atualizada com parentId: ${parentId}`);
        
        // Atualizar todas as outras parcelas para usar o mesmo parentId
        for (const installment of otherInstallments) {
          await Transaction.updateOne(
            { _id: installment._id },
            { installmentParentId: parentId }
          );
          console.log(`✅ Parcela ${installment.installmentNumber}/12 atualizada`);
        }
      }
    }
    
    console.log('');
    console.log('🔍 Verificando resultado final...');
    
    // Verificar o resultado
    const updatedInstallments = await Transaction.find({ isInstallment: true }).sort({ installmentNumber: 1 });
    
    const groupedByParent = {};
    updatedInstallments.forEach(t => {
      const parentId = t.installmentParentId || 'sem-parent';
      if (!groupedByParent[parentId]) {
        groupedByParent[parentId] = [];
      }
      groupedByParent[parentId].push(t);
    });
    
    Object.keys(groupedByParent).forEach(parentId => {
      const group = groupedByParent[parentId];
      console.log(`\n   📦 Grupo ${parentId}:`);
      group.forEach(t => {
        console.log(`      - Parcela ${t.installmentNumber}/${t.totalInstallments} | R$ ${t.amount} | ${new Date(t.date).toLocaleDateString()}`);
      });
    });
    
    console.log('');
    console.log('✅ Correção concluída!');
    console.log('⚠️  NOTA: Os valores ainda estão divididos (R$ 12.5). Isso será corrigido na próxima transação parcelada que você criar.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
    process.exit(1);
  }
}

fixInstallmentProblems();
