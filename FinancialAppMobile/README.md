<!-- 
📍 Caminho: C:\financial-control-system\FinancialAppMobile\README-MOBILE.md
INSTRUÇÕES: Crie um NOVO arquivo com este nome e cole este conteúdo
-->

# 📱 Financial Control - Mobile App

Aplicativo móvel nativo para iOS e Android do sistema de controle financeiro.

## 🎯 **ARQUIVOS QUE VOCÊ PRECISA SUBSTITUIR/CRIAR:**

### ✅ **Substituir arquivos existentes:**
- `App.js` → Cole código do artefato `mobile_app_commented`
- `package.json` → Cole código do artefato `mobile_package_commented`

### ✅ **Criar novos arquivos:**
- `run-android.bat` → Cole do artefato `mobile_scripts_commented`
- `run-ios.bat` → Cole do artefato `mobile_scripts_commented`
- `install-deps.bat` → Cole do artefato `mobile_scripts_commented`
- `start-all.bat` → Cole do artefato `mobile_scripts_commented`

## 🚀 **Setup Passo a Passo:**

### **1. Instalar dependências:**
```bash
cd C:\financial-control-system\FinancialAppMobile
npm install
```

### **2. Configurar Android:**
- ✅ **Android Studio** instalado
- ✅ **SDK Android** configurado  
- ✅ **Emulador** criado ou **dispositivo** conectado
- ✅ **Depuração USB** habilitada (dispositivo físico)

### **3. Iniciar backend:**
```bash
# Terminal separado
cd C:\financial-control-system\backend
npm start
```

### **4. Executar mobile:**
```bash
# Opção 1 - Script automático
run-android.bat

# Opção 2 - Manual
npx react-native run-android

# Opção 3 - Tudo junto
start-all.bat
```

## 📱 **Funcionalidades Mobile:**

✅ **Login/Registro** com AsyncStorage local  
✅ **Dashboard** com cards de estatísticas  
✅ **Modal nativo** para adicionar transações  
✅ **Lista de transações** com pull-to-refresh  
✅ **Botão flutuante (FAB)** para nova transação  
✅ **Teclado numérico** para valores  
✅ **Categorias** com scroll horizontal  
✅ **Tema nativo** otimizado iOS/Android  
✅ **Alerts nativos** para confirmações  
✅ **Loading states** com spinners  

## 🔗 **Configuração da API:**

### **URLs automáticas:**
- **Android Emulator:** `http://10.0.2.2:3001/api`
- **iOS Simulator:** `http://localhost:3001/api`

### **Para dispositivo físico:**
1. Descubra seu IP: `ipconfig` (cmd)
2. Edite a linha no `App.js`:
   ```javascript
   const API_URL = 'http://SEU_IP_AQUI:3001/api'
   ```

## 🐛 **Solução de Problemas:**

### **"Metro bundler error":**
```bash
npx react-native start --reset-cache
```

### **"Build failed Android":**
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### **"No devices found":**
- Conecte dispositivo Android via USB
- Ou inicie emulador no Android Studio
- Habilite "Depuração USB" no dispositivo

### **"Backend connection failed":**
- Verifique se backend está em http://localhost:3001
- Para dispositivo físico, use IP da máquina
- Teste: `curl http://localhost:3001/health`

### **"AsyncStorage error":**
```bash
npm install @react-native-async-storage/async-storage
# Para iOS
cd ios && pod install
```

## 📁 **Estrutura dos Arquivos:**

```
C:\financial-control-system\FinancialAppMobile\
├── App.js                 ← SUBSTITUIR com código mobile
├── package.json           ← SUBSTITUIR com dependências 
├── run-android.bat        ← CRIAR novo arquivo
├── run-ios.bat           ← CRIAR novo arquivo
├── install-deps.bat      ← CRIAR novo arquivo
├── start-all.bat         ← CRIAR novo arquivo
├── android/              ← React Native cuida
├── ios/                  ← React Native cuida
└── node_modules/         ← npm install cria
```

## 🎨 **Design Mobile:**

- **Cores:** Azul #2563eb (principal), Verde #10b981 (receitas), Vermelho #ef4444 (despesas)
- **Tipografia:** Sistema nativo (San Francisco iOS, Roboto Android)
- **Espaçamento:** 20px padding padrão, 16px gaps
- **Botões:** 44px altura mínima (Apple Guidelines)
- **Cards:** Sombras nativas com elevation (Android) e shadow (iOS)
- **Modal:** Slide up animation nativa
- **Loading:** ActivityIndicator nativo

## 🔄 **Fluxo de Dados:**

1. **Login** → AsyncStorage salva token
2. **Dashboard** → API busca estatísticas + transações  
3. **Nova transação** → Modal → API POST → Recarrega dados
4. **Logout** → Limpa AsyncStorage → Volta login

## 💾 **Armazenamento:**

- **Token JWT:** AsyncStorage (persiste login)
- **Dados do usuário:** AsyncStorage (nome, email)
- **Transações:** API (sempre atualizadas)
- **Cache:** Não implementado (sempre busca API)

---

🚀 **Agora você tem o sistema completo: Web + Mobile + Backend!**

## 📞 **Suporte:**

Se der erro, verifique:
1. ✅ Backend rodando (porta 3001)
2. ✅ Dependências instaladas (`npm install`)
3. ✅ Dispositivo conectado ou emulador aberto  
4. ✅ Arquivos App.js e package.json substituídos
5. ✅ IP correto (se dispositivo físico)