const mongoose = require('mongoose');

// Testar a nova lógica de geração de datas
function testInstallmentDates() {
  console.log('🧪 Testando geração de datas para parcelas...');
  
  // Simular diferentes datas base
  const testDates = [
    { date: '2025-08-31', desc: 'Último dia do mês (31)' },
    { date: '2025-08-30', desc: 'Dia 30' },
    { date: '2025-08-15', desc: 'Meio do mês' },
    { date: '2025-01-31', desc: 'Janeiro 31 (para testar fevereiro)' }
  ];
  
  testDates.forEach(test => {
    console.log(`\n📅 Teste: ${test.desc} - Base: ${test.date}`);
    
    const baseDate = new Date(test.date + 'T12:00:00');
    console.log(`   Data base: ${baseDate.toLocaleDateString()}`);
    
    // Gerar 6 parcelas para teste
    for (let i = 0; i < 6; i++) {
      const installmentDate = new Date(baseDate);
      
      // Nova lógica corrigida
      const targetYear = baseDate.getFullYear();
      const targetMonth = baseDate.getMonth() + i;
      const targetDay = baseDate.getDate();
      
      const finalYear = targetYear + Math.floor(targetMonth / 12);
      const finalMonth = targetMonth % 12;
      
      installmentDate.setFullYear(finalYear, finalMonth, targetDay);
      
      if (installmentDate.getMonth() !== finalMonth) {
        installmentDate.setDate(0);
      }
      
      console.log(`   Parcela ${i + 1}: ${installmentDate.toLocaleDateString()} (${installmentDate.getFullYear()}/${String(installmentDate.getMonth() + 1).padStart(2, '0')})`);
    }
  });
  
  console.log('\n✅ Teste de datas concluído!');
}

testInstallmentDates();
