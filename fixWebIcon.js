const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend-web', 'src', 'App.js');

try {
  // Ler o arquivo
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Substituir o ícone diretamente
  const oldIcon = '<div className="stat-icon">�</div>';
  const newIcon = '<div className="stat-icon">💳</div>';
  
  if (content.includes(oldIcon)) {
    // Só substituir a primeira ocorrência (que é do cartão de crédito)
    content = content.replace(oldIcon, newIcon);
    
    // Salvar o arquivo
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Ícone do cartão de crédito corrigido no frontend web!');
  } else {
    console.log('❌ Ícone não encontrado para substituição');
  }
} catch (error) {
  console.error('Erro:', error.message);
}
