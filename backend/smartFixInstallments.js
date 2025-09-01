const mongoose = require('mongoose');

async function smartFixInstallments() {
  try {
    await mongoose.connect('mongodb://localhost:27017/financial-control');
    console.log('🔌 Conectado ao MongoDB');
    
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    
    // Encontrar todas as transações parceladas
    const installmentTransactions = await Transaction.find({ isInstallment: true }).sort({ installmentNumber: 1 });
    console.log(`💳 Encontradas ${installmentTransactions.length} transações parceladas`);
    
    // Mostrar detalhes das transações
    installmentTransactions.forEach((t, i) => {
      console.log(`${i+1}. ${t.description} | Parcela ${t.installmentNumber}/${t.totalInstallments} | R$ ${t.amount} | ${t.type} ${t.paymentMethod} | Parent: ${t.installmentParentId || 'NONE'}`);
    });
    
    // Identificar parcelas órfãs (sem parent) que fazem parte de um grupo
    const orphanInstallments = installmentTransactions.filter(t => !t.installmentParentId);
    console.log(`\n🔍 Parcelas órfãs encontradas: ${orphanInstallments.length}`);
    
    for (const orphan of orphanInstallments) {
      console.log(`\n🔧 Processando órfã: ${orphan.description} (${orphan.installmentNumber}/${orphan.totalInstallments})`);
      
      // Procurar outras parcelas que podem fazer parte do mesmo grupo
      // Critérios: mesmo total de parcelas, mesmo tipo, mesmo método de pagamento, mesmo valor
      const potentialSiblings = installmentTransactions.filter(t => 
        t._id.toString() !== orphan._id.toString() &&
        t.totalInstallments === orphan.totalInstallments &&
        t.type === orphan.type &&
        t.paymentMethod === orphan.paymentMethod &&
        Math.abs(t.amount - orphan.amount) < 0.01 // Mesmo valor (com tolerância para decimais)
      );
      
      console.log(`   📋 Possíveis irmãs encontradas: ${potentialSiblings.length}`);
      
      if (potentialSiblings.length > 0) {
        // Se a órfã é a parcela 1, use seu ID como parent
        if (orphan.installmentNumber === 1) {
          const parentId = orphan._id.toString();
          
          // Atualizar a própria órfã
          await Transaction.updateOne(
            { _id: orphan._id },
            { installmentParentId: parentId }
          );
          console.log(`   ✅ Órfã (parcela 1) agora tem parentId: ${parentId}`);
          
          // Atualizar todas as irmãs para usar o mesmo parent
          for (const sibling of potentialSiblings) {
            await Transaction.updateOne(
              { _id: sibling._id },
              { installmentParentId: parentId }
            );
            console.log(`   ✅ Irmã (parcela ${sibling.installmentNumber}) atualizada`);
          }
          
        } else {
          // Se não é parcela 1, procurar se há uma parcela 1 entre as irmãs
          const firstSibling = potentialSiblings.find(t => t.installmentNumber === 1);
          if (firstSibling && firstSibling.installmentParentId) {
            // Usar o parent da parcela 1
            await Transaction.updateOne(
              { _id: orphan._id },
              { installmentParentId: firstSibling.installmentParentId }
            );
            console.log(`   ✅ Órfã adotada pelo parent: ${firstSibling.installmentParentId}`);
          }
        }
      }
    }
    
    console.log('\n🔍 Verificando resultado final...');
    
    // Verificar resultado final
    const finalInstallments = await Transaction.find({ isInstallment: true }).sort({ installmentParentId: 1, installmentNumber: 1 });
    
    const finalGroups = {};
    finalInstallments.forEach(t => {
      const parentId = t.installmentParentId || 'sem-parent';
      if (!finalGroups[parentId]) {
        finalGroups[parentId] = [];
      }
      finalGroups[parentId].push(t);
    });
    
    Object.keys(finalGroups).forEach(parentId => {
      const group = finalGroups[parentId];
      console.log(`\n   📦 Grupo ${parentId}: ${group.length} parcelas`);
      group.forEach(t => {
        console.log(`      - ${t.description} | Parcela ${t.installmentNumber}/${t.totalInstallments} | R$ ${t.amount}`);
      });
    });
    
    console.log('\n✅ Correção inteligente concluída!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
    process.exit(1);
  }
}

smartFixInstallments();
