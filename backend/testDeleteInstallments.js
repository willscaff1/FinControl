const mongoose = require('mongoose');
const axios = require('axios');

async function testDeleteInstallments() {
  try {
    // Conectar ao MongoDB para buscar uma transação parcelada
    await mongoose.connect('mongodb://localhost:27017/financial-control');
    console.log('🔌 Conectado ao MongoDB');
    
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    
    // Buscar uma transação parcelada
    const installment = await Transaction.findOne({ isInstallment: true });
    
    if (!installment) {
      console.log('❌ Nenhuma transação parcelada encontrada para testar');
      return;
    }
    
    console.log(`🧪 Testando delete da parcela: ${installment.description} (${installment.installmentNumber}/${installment.totalInstallments})`);
    console.log(`📋 ID da transação: ${installment._id}`);
    console.log(`🔗 Parent ID: ${installment.installmentParentId}`);
    
    // Testar a rota de delete diretamente
    console.log('\n🌐 Testando rota do backend...');
    
    const response = await axios.delete(`http://localhost:3001/api/transactions/${installment._id}/installments`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'token_de_teste'}`
      }
    });
    
    console.log('✅ Resposta:', response.data);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ URL tentada:', error.config?.url);
  } finally {
    process.exit(0);
  }
}

testDeleteInstallments();
