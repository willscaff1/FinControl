// Teste das funcionalidades de delete de transações recorrentes

const axios = require('axios');

// Configurar axios
const API_URL = 'http://localhost:3001/api';
axios.defaults.baseURL = API_URL;

const testLogin = async () => {
  try {
    console.log('🔐 Fazendo login...');
    const response = await axios.post('/auth/login', {
      email: 'willian.scaff@gmail.com',
      password: 'teste123'
    });
    
    const token = response.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('✅ Login realizado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    return false;
  }
};

const createRecurringTransaction = async () => {
  try {
    console.log('\n📝 Criando transação recorrente...');
    const response = await axios.post('/transactions', {
      description: 'Teste Transação Recorrente DELETE',
      amount: 100.00,
      type: 'expense',
      category: 'Outros',
      date: '2025-08-15',
      isRecurring: true
    });
    
    console.log('✅ Transação recorrente criada:', response.data._id);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao criar transação:', error.response?.data || error.message);
    return null;
  }
};

const listTransactions = async (month = 8, year = 2025) => {
  try {
    console.log(`\n📋 Listando transações de ${month}/${year}...`);
    const response = await axios.get(`/transactions?month=${month}&year=${year}`);
    const transactions = response.data.filter(t => t.description.includes('Teste Transação Recorrente DELETE'));
    
    console.log(`✅ Encontradas ${transactions.length} transações de teste`);
    transactions.forEach(t => {
      console.log(`   - ${t.description} | ${new Date(t.date).toLocaleDateString()} | ${t.isRecurring ? 'TEMPLATE' : 'INSTÂNCIA'} | ID: ${t._id}`);
    });
    
    return transactions;
  } catch (error) {
    console.error('❌ Erro ao listar transações:', error.response?.data || error.message);
    return [];
  }
};

const testDeleteSingle = async (transactionId) => {
  try {
    console.log('\n🗑️ Testando delete único...');
    await axios.delete(`/transactions/${transactionId}`);
    console.log('✅ Delete único realizado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro no delete único:', error.response?.data || error.message);
    return false;
  }
};

const testDeleteAll = async (transactionId) => {
  try {
    console.log('\n🗑️ Testando delete de toda série recorrente...');
    const response = await axios.delete(`/transactions/${transactionId}/recurring`);
    console.log('✅ Delete de série realizado:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Erro no delete de série:', error.response?.data || error.message);
    return false;
  }
};

const runTests = async () => {
  console.log('🧪 Iniciando testes de delete de transações recorrentes\n');
  
  // 1. Login
  const loggedIn = await testLogin();
  if (!loggedIn) return;
  
  // 2. Criar transação recorrente
  const transaction = await createRecurringTransaction();
  if (!transaction) return;
  
  // 3. Listar transações (deve mostrar 2: template + instância atual)
  let transactions = await listTransactions(8, 2025);
  if (transactions.length === 0) {
    console.log('❌ Nenhuma transação encontrada');
    return;
  }
  
  // 4. Testar delete único (deletar apenas uma instância)
  const instanceTransaction = transactions.find(t => !t.isRecurring);
  if (instanceTransaction) {
    await testDeleteSingle(instanceTransaction._id);
    
    // Verificar se ainda tem o template
    transactions = await listTransactions(8, 2025);
    console.log(`   Transações restantes: ${transactions.length}`);
  }
  
  // 5. Testar delete de toda série (deve deletar template + todas instâncias)
  const templateTransaction = transactions.find(t => t.isRecurring);
  if (templateTransaction) {
    await testDeleteAll(templateTransaction._id);
    
    // Verificar se deletou tudo
    transactions = await listTransactions(8, 2025);
    console.log(`   Transações restantes: ${transactions.length}`);
    
    if (transactions.length === 0) {
      console.log('✅ Todos os testes passaram! Funcionalidade implementada corretamente.');
    } else {
      console.log('❌ Ainda restam transações após delete completo');
    }
  }
  
  console.log('\n🏁 Testes finalizados');
};

runTests().catch(console.error);
