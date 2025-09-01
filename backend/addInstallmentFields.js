const mongoose = require('mongoose');

async function addInstallmentFields() {
  try {
    await mongoose.connect('mongodb://localhost:27017/financial-control');
    console.log('🔌 Conectado ao MongoDB');
    
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    
    // Adicionar campos de parcelamento a todas as transações
    const updateResult = await Transaction.updateMany(
      { 
        isInstallment: { $exists: false }
      },
      {
        $set: {
          isInstallment: false,
          installmentNumber: null,
          totalInstallments: null,
          installmentParentId: null
        }
      }
    );
    
    console.log(`✅ ${updateResult.matchedCount} transações atualizadas com campos de parcelamento`);
    
    // Verificar quantas transações existem agora
    const totalTransactions = await Transaction.countDocuments();
    console.log(`📊 Total de transações: ${totalTransactions}`);
    
    console.log('✅ Migração concluída!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

addInstallmentFields();
