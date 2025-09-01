// Teste de conversão de datas
const testDate = new Date();
console.log('Data atual:', testDate);
console.log('Dia atual:', testDate.getDate());
console.log('toISOString():', testDate.toISOString());
console.log('split T[0]:', testDate.toISOString().split('T')[0]);

// Teste com uma data específica para dia 4
const specificDate = new Date(2025, 7, 4); // Agosto 4, 2025 (mês é 0-indexed)
console.log('\n=== Teste com 4 de agosto ===');
console.log('Data específica:', specificDate);
console.log('Dia:', specificDate.getDate());
console.log('toISOString():', specificDate.toISOString());
console.log('split T[0]:', specificDate.toISOString().split('T')[0]);

// Quando criamos uma date a partir de um string de input de data
const dateString = '2025-08-04';
const parsedDate = new Date(dateString);
console.log('\n=== Teste com string de input ===');
console.log('String original:', dateString);
console.log('Date parsada:', parsedDate);
console.log('Dia:', parsedDate.getDate());
console.log('toISOString():', parsedDate.toISOString());

// Solução correta - usar UTC
const correctDate = new Date(dateString + 'T12:00:00');
console.log('\n=== Solução com horário definido ===');
console.log('Data corrigida:', correctDate);
console.log('Dia:', correctDate.getDate());
console.log('toISOString():', correctDate.toISOString());
