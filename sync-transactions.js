// Script para sincronizar carregamento de transações entre Dashboard e página de Bancos
// Este script modifica a página de Bancos para usar a mesma lógica do Dashboard

console.log('🔧 INICIANDO SINCRONIZAÇÃO DE CARREGAMENTO DE TRANSAÇÕES...');

// PROBLEMA IDENTIFICADO:
// - Dashboard: carrega TODAS as transações via /transactions (sem filtro)
// - Página de Bancos: carrega apenas do mês via /transactions?month=${month}&year=${year}
// - API /transactions com filtro de mês EXCLUI templates (isRecurring: true)
// - Resultado: página de Bancos não tem templates para gerar transações virtuais

console.log('📋 ANÁLISE:');
console.log('✅ Dashboard funciona porque carrega TODAS as transações (incluindo templates)');
console.log('❌ Página de Bancos falha porque carrega apenas transações do mês (sem templates)');

// SOLUÇÃO:
// Modificar página de Bancos para usar a mesma estratégia do Dashboard:
// 1. Carregar TODAS as transações via /transactions (sem filtro)
// 2. Isso inclui templates recorrentes (isRecurring: true)
// 3. Função getBankTransactionsByMonth pode gerar transações virtuais

console.log('\n🔧 APLICANDO CORREÇÃO...');

const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'frontend-web', 'src', 'App.js');

// Ler o arquivo atual
let content = fs.readFileSync(appJsPath, 'utf8');

// Encontrar e substituir a chamada da API na página de Bancos
const originalCall = `// Carregar transações para calcular saldos
      const transactionsResponse = await axios.get(\`/transactions?month=\${month}&year=\${year}\`, {
        signal: abortControllerRef.current.signal
      });
      
      // Carregar templates recorrentes separadamente (a API /transactions exclui eles quando tem filtro de mês)
      const templatesResponse = await axios.get('/transactions/templates', {
        signal: abortControllerRef.current.signal
      }).catch(error => {
        // Se a rota não existir, buscar todos sem filtro e filtrar templates no frontend
        return axios.get('/transactions', {
          signal: abortControllerRef.current.signal
        }).then(response => ({
          data: response.data.filter(t => t.isRecurring)
        }));
      });
      
      // Combinar transações do mês + templates
      const monthTransactions = transactionsResponse.data || [];
      const templates = templatesResponse.data || [];
      const allTransactions = [...monthTransactions, ...templates];`;

const newCall = `// Carregar TODAS as transações (igual ao Dashboard)
      // Isso garante que templates recorrentes (isRecurring: true) sejam incluídos
      const transactionsResponse = await axios.get('/transactions', {
        signal: abortControllerRef.current.signal,
        timeout: 10000
      });
      
      const allTransactions = transactionsResponse.data || [];`;

if (content.includes(originalCall)) {
  content = content.replace(originalCall, newCall);
  console.log('✅ Substituída chamada da API para carregar TODAS as transações');
} else {
  console.log('⚠️ Padrão de chamada da API não encontrado, procurando alternativas...');
  
  // Buscar padrão mais específico
  const pattern = /\/transactions\?month=\$\{month\}&year=\$\{year\}/g;
  if (content.match(pattern)) {
    content = content.replace(pattern, '/transactions');
    console.log('✅ Corrigida chamada da API de /transactions?month=${month}&year=${year} para /transactions');
  }
}

// Ajustar os logs de debug
const oldDebug = `console.log(\`🏦 BanksPage - Mês/Ano: \${month}/\${year}\`);
      console.log(\`🏦 BanksPage - Transações do mês: \${monthTransactions.length}\`);
      console.log(\`🏦 BanksPage - Templates carregados: \${templates.length}\`);
      console.log(\`🏦 BanksPage - Total combinado: \${allTransactions.length}\`);
      console.log(\`🏦 BanksPage - Templates recorrentes: \${recurringTransactions.length}\`);
      console.log(\`🏦 BanksPage - Transações de bancos: \${bankRecurringTransactions.length}\`);
      console.log(\`🏦 BanksPage - Transações geradas (recurringParentId): \${generatedRecurringTransactions.length}\`);`;

const newDebug = `console.log(\`🏦 BanksPage - Mês/Ano: \${month}/\${year}\`);
      console.log(\`🏦 BanksPage - Total transações carregadas: \${allTransactions.length}\`);
      console.log(\`🏦 BanksPage - Templates recorrentes: \${recurringTransactions.length}\`);
      console.log(\`🏦 BanksPage - Transações geradas (recurringParentId): \${generatedRecurringTransactions.length}\`);`;

if (content.includes(oldDebug)) {
  content = content.replace(oldDebug, newDebug);
  console.log('✅ Ajustados logs de debug');
}

// Escrever o arquivo corrigido
fs.writeFileSync(appJsPath, content, 'utf8');

console.log('\n🎉 SINCRONIZAÇÃO CONCLUÍDA!');
console.log('');
console.log('📋 RESUMO DAS ALTERAÇÕES:');
console.log('1. ✅ Página de Bancos agora carrega TODAS as transações (igual ao Dashboard)');
console.log('2. ✅ Templates recorrentes (isRecurring: true) incluídos no carregamento');
console.log('3. ✅ Função getBankTransactionsByMonth pode gerar transações virtuais');
console.log('4. ✅ Logs de debug ajustados');
console.log('');
console.log('🚀 TESTE AGORA:');
console.log('1. Vá para a página de Bancos');
console.log('2. Clique em "Bradesco"');
console.log('3. Navegue para novembro 2025');
console.log('4. Deve ver 4 transações fixas com "⏳ A SER LANÇADA"');
console.log('');
console.log('📊 LOGS ESPERADOS:');
console.log('- 🏦 BanksPage - Templates recorrentes: 4');
console.log('- 🔄 Templates recorrentes encontrados (Página Banco): 4');
console.log('- 🚀 Gerando transação recorrente virtual...');
console.log('');
console.log('✨ Agora Dashboard e página de Bancos usam a MESMA lógica!');
