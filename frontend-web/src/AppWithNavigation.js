/**
 * 🌐 FINANCIAL CONTROL - WEB APP COM NAVEGAÇÃO
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './styles.css';

// Configuração da API
const API_URL = 'http://localhost:3001/api';

// Context para autenticação
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

// Configurar axios
const api = axios.create({ 
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para incluir token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🧭 SIDEBAR NAVIGATION
function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '💳', label: 'Transações', path: '/transactions' },
    { icon: '💳', label: 'Cartões', path: '/cards' },
    { icon: '🏦', label: 'Bancos', path: '/banks' },
    { icon: '⚙️', label: 'Configurações', path: '/settings' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">💰</div>
        <h2>Financial Control</h2>
      </div>
      
      <div className="sidebar-user">
        <div className="user-avatar">👤</div>
        <div className="user-info">
          <p className="user-name">{user?.name || 'Usuário'}</p>
          <p className="user-email">{user?.email}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
        
        <button className="nav-item logout" onClick={logout}>
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Sair</span>
        </button>
      </nav>
    </div>
  );
}

// 🏠 DASHBOARD PAGE
function DashboardPage() {
  const [data, setData] = useState({
    transactions: [],
    stats: { balance: 0, income: 0, expense: 0, count: 0 }
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [transactionsRes, statsRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/transactions/stats')
      ]);
      
      setData({
        transactions: transactionsRes.data,
        stats: statsRes.data
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>🏠 Dashboard</h1>
        <p>Visão geral das suas finanças</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card balance">
          <h3>💰 SALDO ATUAL</h3>
          <p className={data.stats.balance >= 0 ? 'positive' : 'negative'}>
            R$ {data.stats.balance.toFixed(2)}
          </p>
        </div>

        <div className="stat-card income">
          <h3>📈 RECEITAS</h3>
          <p>R$ {data.stats.income.toFixed(2)}</p>
        </div>

        <div className="stat-card expense">
          <h3>📉 DESPESAS</h3>
          <p>R$ {data.stats.expense.toFixed(2)}</p>
        </div>

        <div className="stat-card count">
          <h3>📊 TRANSAÇÕES</h3>
          <p>{data.stats.count}</p>
        </div>
      </div>

      <div className="transactions-section">
        <h2>📋 Últimas Transações</h2>
        {data.transactions.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma transação encontrada</p>
            <small>Adicione sua primeira transação para começar</small>
          </div>
        ) : (
          <div className="transactions-list">
            {data.transactions.slice(0, 10).map((transaction) => (
              <div key={transaction._id} className="transaction-item">
                <div className="transaction-info">
                  <div className={`transaction-icon ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}
                  </div>
                  <div className="transaction-details">
                    <h4>{transaction.description}</h4>
                    <small>{transaction.category} • {new Date(transaction.date).toLocaleDateString('pt-BR')}</small>
                  </div>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 💳 TRANSAÇÕES PAGE
function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Carregando transações...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>💳 Transações</h1>
        <p>Histórico completo de todas as transações</p>
      </div>

      <div className="transactions-section">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma transação encontrada</p>
            <small>Suas transações aparecerão aqui quando forem criadas</small>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div key={transaction._id} className="transaction-item">
                <div className="transaction-info">
                  <div className={`transaction-icon ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}
                  </div>
                  <div className="transaction-details">
                    <h4>{transaction.description}</h4>
                    <small>{transaction.category} • {new Date(transaction.date).toLocaleDateString('pt-BR')}</small>
                  </div>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 💳 CARTÕES PAGE
function CardsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>💳 Cartões</h1>
        <p>Gerencie seus cartões de crédito e débito</p>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">💳</div>
        <h2>Em breve!</h2>
        <p>Funcionalidade de gerenciamento de cartões em desenvolvimento.</p>
        <small>Você poderá adicionar, editar e gerenciar seus cartões aqui.</small>
      </div>
    </div>
  );
}

// 🏦 BANCOS PAGE
function BanksPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>🏦 Bancos</h1>
        <p>Conecte suas contas bancárias</p>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">🏦</div>
        <h2>Em breve!</h2>
        <p>Integração com bancos e sincronização automática de transações.</p>
        <small>Open Banking e APIs bancárias em desenvolvimento.</small>
      </div>
    </div>
  );
}

// ⚙️ CONFIGURAÇÕES PAGE
function SettingsPage() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Função para alternar tema escuro
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    alert(darkMode ? 'Tema claro ativado!' : 'Tema escuro ativado!');
  };

  // Função para alternar notificações
  const toggleNotifications = () => {
    setNotifications(!notifications);
    alert(notifications ? 'Notificações desativadas!' : 'Notificações ativadas!');
  };

  // Função para mostrar ajuda
  const showHelp = () => {
    setShowHelpModal(true);
  };

  // Função para mostrar sobre
  const showAbout = () => {
    setShowAboutModal(true);
  };

  // Função para confirmar logout
  const confirmLogout = () => {
    setShowLogoutModal(true);
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>⚙️ Configurações</h1>
        <p>Perfil e preferências</p>
      </div>

      <div className="settings-content">
        {/* Seção do Perfil Modernizada */}
        <div className="modern-profile-section">
          <div className="profile-card">
            <div className="profile-avatar">
              <span className="avatar-text">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="profile-info">
              <h3>{user?.name || 'Usuário'}</h3>
              <p>{user?.email || 'email@exemplo.com'}</p>
              <span className="profile-role">Controle Financeiro Pessoal</span>
            </div>
          </div>
        </div>

        {/* Seção de Preferências */}
        <div className="settings-section">
          <h3>🔧 Preferências</h3>
          <div className="settings-list">
            <div className="modern-settings-item" onClick={toggleNotifications}>
              <div className="settings-left">
                <div className={`settings-item-icon ${notifications ? 'active' : ''}`}>
                  {notifications ? '🔔' : '🔕'}
                </div>
                <div className="settings-item-content">
                  <h4>Notificações</h4>
                  <p>{notifications ? 'Receber alertas de transações' : 'Notificações desativadas'}</p>
                </div>
              </div>
              <div className={`toggle ${notifications ? 'active' : ''}`}>
                <div className="toggle-dot"></div>
              </div>
            </div>

            <div className="modern-settings-item" onClick={toggleDarkMode}>
              <div className="settings-left">
                <div className={`settings-item-icon ${darkMode ? 'active' : ''}`}>
                  {darkMode ? '🌙' : '☀️'}
                </div>
                <div className="settings-item-content">
                  <h4>Tema Escuro</h4>
                  <p>{darkMode ? 'Modo escuro ativo' : 'Modo claro ativo'}</p>
                </div>
              </div>
              <div className={`toggle ${darkMode ? 'active' : ''}`}>
                <div className="toggle-dot"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Suporte */}
        <div className="settings-section">
          <h3>💡 Suporte</h3>
          <div className="settings-list">
            <button className="modern-settings-item" onClick={showHelp}>
              <div className="settings-left">
                <div className="settings-item-icon">🆘</div>
                <div className="settings-item-content">
                  <h4>Ajuda e Suporte</h4>
                  <p>Dicas e tutoriais</p>
                </div>
              </div>
              <div className="settings-item-arrow">→</div>
            </button>

            <button className="modern-settings-item" onClick={showAbout}>
              <div className="settings-left">
                <div className="settings-item-icon">ℹ️</div>
                <div className="settings-item-content">
                  <h4>Sobre o App</h4>
                  <p>Versão 1.0.0</p>
                </div>
              </div>
              <div className="settings-item-arrow">→</div>
            </button>
          </div>
        </div>

        {/* Seção da Conta */}
        <div className="settings-section">
          <h3>👤 Conta</h3>
          <div className="settings-list">
            <button className="modern-settings-item logout-item" onClick={confirmLogout}>
              <div className="settings-left">
                <div className="settings-item-icon">🚪</div>
                <div className="settings-item-content">
                  <h4>Sair da conta</h4>
                  <p>Desconectar do aplicativo</p>
                </div>
              </div>
              <div className="settings-item-arrow">→</div>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Ajuda */}
      {showHelpModal && (
        <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💡 Ajuda e Suporte</h2>
              <button className="close-button" onClick={() => setShowHelpModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="help-section">
                <h3>🚀 Como começar</h3>
                <p>
                  • Use o botão "+" para adicionar suas primeiras transações<br/>
                  • Organize por categorias: alimentação, transporte, etc.<br/>
                  • Escolha o método: PIX, débito ou crédito
                </p>
              </div>
              
              <div className="help-section">
                <h3>💳 Cartões e Bancos</h3>
                <p>
                  • Cartões: visualize apenas gastos no crédito<br/>
                  • Bancos: visualize débito e PIX<br/>
                  • Use a busca para encontrar transações específicas
                </p>
              </div>
              
              <div className="help-section">
                <h3>📊 Dashboard</h3>
                <p>
                  • Veja o resumo do mês atual<br/>
                  • Gráficos de receitas vs despesas<br/>
                  • Acesso rápido às principais funções
                </p>
              </div>
            </div>
            <button className="modal-button" onClick={() => setShowHelpModal(false)}>
              Entendi!
            </button>
          </div>
        </div>
      )}

      {/* Modal Sobre */}
      {showAboutModal && (
        <div className="modal-overlay" onClick={() => setShowAboutModal(false)}>
          <div className="about-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💰 Controle Financeiro</h2>
              <button className="close-button" onClick={() => setShowAboutModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="app-info">
                <div className="app-icon">💰</div>
                <h3>Financial Control</h3>
                <p className="app-version">Versão 1.0.0</p>
                <p className="app-description">
                  Aplicativo completo para controle de finanças pessoais. 
                  Gerencie suas receitas, despesas e tenha o controle total do seu dinheiro.
                </p>
                <div className="features">
                  <h4>✨ Recursos:</h4>
                  <ul>
                    <li>Dashboard interativo</li>
                    <li>Gestão de transações</li>
                    <li>Controle por categorias</li>
                    <li>Visualização por período</li>
                    <li>Interface moderna</li>
                  </ul>
                </div>
              </div>
            </div>
            <button className="modal-button" onClick={() => setShowAboutModal(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Logout */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚪 Sair da conta</h2>
            </div>
            <div className="modal-content">
              <p>Tem certeza que deseja sair? Você precisará fazer login novamente.</p>
            </div>
            <div className="modal-buttons">
              <button className="cancel-button" onClick={() => setShowLogoutModal(false)}>
                Cancelar
              </button>
              <button className="confirm-button" onClick={handleLogout}>
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🔐 LOGIN PAGE
function LoginPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      alert('Preencha todos os campos!');
      return;
    }

    if (formData.password.length < 6) {
      alert('Senha deve ter pelo menos 6 caracteres!');
      return;
    }

    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await api.post(endpoint, formData);
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      login(user);
      
    } catch (error) {
      console.error('Erro na autenticação:', error);
      alert(error.response?.data?.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo">💰</div>
        <h1>Financial Control</h1>
        <p>
          {isLogin 
            ? 'Acesse seu controle financeiro' 
            : 'Crie sua conta gratuita'
          }
        </p>
        
        <form className="login-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Nome completo"
              value={formData.name || ''}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Seu e-mail"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          
          <input
            type="password"
            placeholder="Sua senha (min. 6 caracteres)"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            minLength={6}
          />
          
          <button type="submit" disabled={loading}>
            {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>

        <div className="login-toggle">
          <p>
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              className="toggle-btn"
            >
              {isLogin ? 'Criar conta' : 'Fazer login'}
            </button>
          </p>
        </div>

        <div className="api-info">
          <small>🔗 Conectando em: {API_URL}</small>
        </div>
      </div>
    </div>
  );
}

// 🛡️ LAYOUT PROTEGIDO
function ProtectedLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

// 🎯 ROTA PROTEGIDA
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <ProtectedLayout>{children}</ProtectedLayout>;
}

// 🔐 PROVIDER DE AUTENTICAÇÃO
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Inicializando aplicação...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 📱 COMPONENTE PRINCIPAL
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute>
              <TransactionsPage />
            </ProtectedRoute>
          } />
          <Route path="/cards" element={
            <ProtectedRoute>
              <CardsPage />
            </ProtectedRoute>
          } />
          <Route path="/banks" element={
            <ProtectedRoute>
              <BanksPage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
