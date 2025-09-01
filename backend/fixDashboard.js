console.log("Localizando linha com TRANSAÇÕES...");

const fs = require('fs');
const filePath = 'c:\\financial-control-system\\FinancialAppExpo\\App.js';

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Procurar pela linha que contém "TRANSAÇÕES" e "statLabel"
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('statLabel') && lines[i].includes('TRANSAÇÕES')) {
            console.log(`Linha ${i + 1}: ${lines[i]}`);
            console.log(`Caracteres da linha: ${JSON.stringify(lines[i])}`);
            
            // Substituir a linha
            lines[i] = '              <Text style={styles.statLabel}>💳 CARTÃO CRÉDITO</Text>';
            console.log(`Nova linha: ${lines[i]}`);
        }
        
        // Também procurar pela linha que tem o valor das transações
        if (lines[i].includes('data.stats?.count ?? 0')) {
            console.log(`Linha do valor ${i + 1}: ${lines[i]}`);
            lines[i] = '                R$ {(data.creditCardTotal ?? 0).toFixed(2)}';
            console.log(`Nova linha do valor: ${lines[i]}`);
        }
    }
    
    // Salvar o arquivo
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log('✅ Arquivo atualizado com sucesso!');
    
} catch (error) {
    console.error('❌ Erro:', error);
}
