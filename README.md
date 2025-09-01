📱 Financial Control - Mobile App
Aplicativo móvel nativo para iOS e Android do sistema de controle financeiro.

🚀 Setup Rápido
1. Criar projeto React Native:
bash
npx react-native@latest init FinancialAppMobile
cd FinancialAppMobile
2. Instalar dependências:
bash
npm install @react-native-async-storage/async-storage axios
3. Substituir arquivos:
✅ App.js → Copiar do artefato mobile_app_js
✅ package.json → Copiar do artefato mobile_package_json
✅ Scripts → Criar os .bat do artefato mobile_scripts
4. Configurar Android:
bash
# Limpar cache
cd android && ./gradlew clean && cd ..

# Para dispositivo físico, editar IP em App.js:
# const API_URL = 'http://SEU_IP_LOCAL:3001/api'
5. Configurar iOS: (apenas macOS)
bash
cd ios && pod install && cd ..
🎯 Executar
Pré-requisito: Backend rodando
bash
# Terminal 1 - Backend
cd ../backend
npm start
Android:
bash
# Opção 1 - Script
run-android.bat

# Opção 2 - Manual
npx react-native run-android
iOS: (macOS apenas)
bash
# Opção 1 - Script
run-ios.bat

# Opção 2 - Manual
npx react-native run-ios
📱 Funcionalidades Mobile
✅ Interface nativa iOS/Android
✅ Login/Registro com AsyncStorage
✅ Dashboard com cards estatísticas
✅ Modal nativo para transações
✅ Pull-to-refresh na lista
✅ FAB (botão flutuante)
✅ Teclado numérico para valores
✅ Scroll horizontal para categorias
✅ StatusBar personalizada
✅ Loading states nativos
✅ Alerts nativos para erros

🔧 Configurações Importantes
URLs da API:
Android Emulator: http://10.0.2.2:3001/api
iOS Simulator: http://localhost:3001/api
Dispositivo físico: http://SEU_IP:3001/api
Para dispositivo físico:
Descubra seu IP: ipconfig (Windows) ou ifconfig (macOS/Linux)
Edite API_URL no App.js
Certifique-se que dispositivo e PC estão na mesma rede
🐛 Solução de Problemas
Metro bundler error:
bash
npx react-native start --reset-cache
Android build error:
bash
cd android && ./gradlew clean && cd ..
npx react-native run-android
iOS build error:
bash
cd ios && rm -rf build && pod install && cd ..
npx react-native run-ios
Conexão com backend:
bash
# Teste se backend está rodando
curl http://localhost:3001/health

# Para dispositivo físico, teste:
curl http://SEU_IP:3001/health
Android: Erro de permissão USB:
Habilite "Opções do desenvolvedor" no dispositivo
Ative "Depuração USB"
Conecte e aceite autorização
iOS: Simulador não abre:
bash
sudo xcode-select --install
npx react-native run-ios --simulator="iPhone 14"
📁 Estrutura do Projeto
FinancialAppMobile/
├── App.js                 # App principal
├── package.json           # Dependências
├── android/               # Projeto Android
├── ios/                   # Projeto iOS
├── run-android.bat        # Script Android
├── run-ios.bat           # Script iOS
└── README.md             # Esta documentação
🎨 Interface Mobile
Tema: Azul (
#2563eb) principal
Cards: Sombras nativas e bordas coloridas
Botões: Estados ativos/inativos
Modal: Slide up animation
Loading: Spinners nativos
Navegação: Touch-friendly (44px+ targets)
🔄 Sincronização
Dados locais: AsyncStorage
API: Sync automático
Offline: Funciona sem conexão
Online: Sincroniza automaticamente
🚀 Agora você tem o sistema completo funcionando em Web, iOS e Android!

