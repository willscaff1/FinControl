# 💎 FinControl - Sistema de Controle Financeiro

<div align="center">

![FinControl Logo](https://img.shields.io/badge/FinControl-💎-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge)

**Sistema completo de controle financeiro pessoal com interface moderna**

[🚀 Demo](#-demo) • [📥 Instalação](#-instalação) • [💻 Tecnologias](#-tecnologias) • [📱 Funcionalidades](#-funcionalidades)

</div>

---

## 🌟 **Visão Geral**

O **FinControl** é um sistema completo de gestão financeira pessoal que oferece controle total sobre suas finanças através de uma interface moderna e intuitiva. Com suporte a múltiplas plataformas (Web, Mobile) e funcionalidades avançadas como transações recorrentes, parcelamento e categorização automática.

### ✨ **Novidades v2.0.0 - Setembro 2025**

🎨 **Interface Completamente Redesenhada**
- Cards de banco com layout moderno e maior legibilidade
- Toda área do card clicável para melhor experiência
- Padronização entre modais de bancos e cartões

🧭 **Navegação Aprimorada**
- Botão "Nova Transação" movido para sidebar (sempre acessível)
- Remoção do botão "Limpar Mês" para interface mais limpa
- Comunicação inteligente entre componentes

🗑️ **Sistema de Exclusão Inteligente**
- Detecção automática de transações recorrentes/parceladas
- Opções contextuais de exclusão (só este mês, todas as parcelas, etc.)
- Interface melhorada para confirmação de ações

### 🎯 **Principais Diferenciais**

- 🎨 **Design Moderno** - Interface com glassmorphism e gradientes
- 🔄 **Sincronização Real-time** - Dados sincronizados entre todas as plataformas
- 💳 **Gestão Inteligente** - Separação automática por tipos de pagamento
- 📊 **Analytics Avançado** - Dashboard com estatísticas detalhadas
- 🔐 **Segurança Total** - Autenticação JWT e criptografia

---

## 🚀 **Demo**

### 🌐 **Web Application**
```bash
# Inicie o sistema completo
.\start.ps1

# Acesse: http://localhost:3000
```

### 📱 **Mobile App**
```bash
# Expo App
cd FinancialAppExpo
npm start

# React Native App
cd FinancialAppMobile
npx react-native run-android
```

---

## 📥 **Instalação**

### ⚡ **Instalação Rápida**

```bash
# Clone o repositório
git clone https://github.com/willscaff1/FinControl.git
cd FinControl

# Execute o script de inicialização automática
.\start.ps1
```

### 🔧 **Instalação Manual**

<details>
<summary>📋 Clique para ver os passos detalhados</summary>

#### 1️⃣ **Backend Setup**
```bash
cd backend
npm install
npm start
```

#### 2️⃣ **Frontend Web Setup**
```bash
cd frontend-web
npm install
npm start
```

#### 3️⃣ **Mobile App Setup (Expo)**
```bash
cd FinancialAppExpo
npm install
npm start
```

#### 4️⃣ **Mobile App Setup (React Native)**
```bash
cd FinancialAppMobile
npm install
npx react-native run-android  # Android
npx react-native run-ios       # iOS
```

</details>

---

## 💻 **Tecnologias**

### 🌐 **Frontend Web**
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript)
![CSS3](https://img.shields.io/badge/CSS3-Modern-1572B6?style=flat-square&logo=css3)
![Axios](https://img.shields.io/badge/Axios-HTTP-5A29E4?style=flat-square)

### 📱 **Mobile**
![React Native](https://img.shields.io/badge/React%20Native-0.72-61DAFB?style=flat-square&logo=react)
![Expo](https://img.shields.io/badge/Expo-49.x-000020?style=flat-square&logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)

### ⚙️ **Backend**
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=flat-square&logo=mongodb)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens)

---

## 📱 **Funcionalidades**

### 💰 **Gestão Financeira**
- ✅ **Transações Completas** - Receitas, despesas e transferências
- ✅ **Categorização Inteligente** - Organização automática por categorias
- ✅ **Múltiplos Métodos** - PIX, Débito, Crédito
- ✅ **Transações Recorrentes** - Gastos fixos mensais
- ✅ **Parcelamento** - Controle de parcelas automático

### 📊 **Dashboard & Analytics**
- 📈 **Estatísticas em Tempo Real** - Saldo, receitas e despesas
- 📅 **Navegação por Período** - Visualização mensal/anual
- 🎯 **Metas Financeiras** - Acompanhamento de objetivos
- 📋 **Relatórios Detalhados** - Análises completas

### 🎨 **Interface & UX**
- 🌟 **Design Moderno** - Glassmorphism e gradientes
- 📱 **Responsivo** - Funciona em todas as telas
- 🌙 **Modo Escuro** - Interface adaptável
- ⚡ **Performance** - Carregamento rápido

### 🔐 **Segurança**
- 🛡️ **Autenticação JWT** - Login seguro
- 🔒 **Criptografia** - Dados protegidos
- 👤 **Controle de Sessão** - Logout automático
- 🔑 **Validação Robusta** - Proteção total

---

## 📸 **Screenshots**

<div align="center">

### 🖥️ **Web Application**

| Dashboard | Transações | Mobile |
|-----------|------------|--------|
| ![Dashboard](https://via.placeholder.com/300x200/4338ca/white?text=Dashboard) | ![Transactions](https://via.placeholder.com/300x200/059669/white?text=Transactions) | ![Mobile](https://via.placeholder.com/300x200/dc2626/white?text=Mobile) |

</div>

---

## 🗂️ **Estrutura do Projeto**

```
FinControl/
├── 📁 backend/              # API Node.js + Express
│   ├── server.js           # Servidor principal  
│   ├── package.json        # Dependências backend
│   └── ...
├── 📁 frontend-web/         # Aplicação Web React
│   ├── src/
│   │   ├── App.js          # Componente principal
│   │   ├── modern-styles.css # Estilos modernos
│   │   └── ...
│   └── package.json        # Dependências frontend
├── 📁 FinancialAppExpo/     # App Mobile Expo
│   ├── App.js              # App principal
│   └── package.json        # Dependências Expo
├── 📁 FinancialAppMobile/   # App Native React Native
│   ├── App.tsx             # App principal
│   ├── android/            # Configurações Android
│   ├── ios/                # Configurações iOS
│   └── package.json        # Dependências RN
├── start.ps1               # Script inicialização
└── README.md               # Este arquivo
```

---

## 🚀 **Scripts Disponíveis**

### 🔧 **Desenvolvimento**
```bash
# Iniciar tudo automaticamente
.\start.ps1

# Apenas backend
cd backend && npm start

# Apenas frontend web  
cd frontend-web && npm start

# Apenas mobile (Expo)
cd FinancialAppExpo && npm start
```

### 🛠️ **Build & Deploy**
```bash
# Build frontend para produção
cd frontend-web && npm run build

# Build mobile para produção
cd FinancialAppMobile && npx react-native build-android
```

---

## 📋 **Roadmap**

### 🎯 **Próximas Versões**

#### v1.1.0 - **Analytics Avançado**
- [ ] 📊 Gráficos interativos
- [ ] 📈 Projeções financeiras
- [ ] 🎯 Sistema de metas
- [ ] 📱 Notificações push

#### v1.2.0 - **Integração Bancária**
- [ ] 🏦 Open Banking
- [ ] 🔄 Sincronização automática
- [ ] 📧 Importação de extratos
- [ ] 🤖 IA para categorização

#### v2.0.0 - **Recursos Premium**
- [ ] 👥 Controle familiar
- [ ] 💼 Gestão empresarial
- [ ] 📊 Relatórios PDF
- [ ] ☁️ Backup na nuvem

---

## 🤝 **Contribuindo**

Contribuições são sempre bem-vindas! 

### 🔄 **Como Contribuir**

1. **Fork** o projeto
2. **Crie** sua branch (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add: MinhaFeature'`)  
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. **Abra** um Pull Request

### 📝 **Diretrizes**
- Use commits semânticos (feat:, fix:, docs:, etc.)
- Teste todas as funcionalidades antes do PR
- Documente mudanças significativas

---

## 📄 **Licença**

Este projeto está licenciado sob a **Licença MIT**. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👨‍💻 **Autor**

<div align="center">

**Desenvolvido com 💎 e ☕**

[![GitHub](https://img.shields.io/badge/GitHub-willscaff1-181717?style=for-the-badge&logo=github)](https://github.com/willscaff1)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com)

</div>

---

## 🙏 **Agradecimentos**

- 🎨 **Design inspirado** nas melhores práticas de UX/UI
- 📱 **Comunidade React** pela excelente documentação
- 🌟 **Contribuidores** que tornaram este projeto possível

---

<div align="center">

**⭐ Se este projeto te ajudou, deixe uma estrela!**

![Made with Love](https://img.shields.io/badge/Made%20with-💖-red?style=for-the-badge)

</div>
