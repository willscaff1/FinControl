import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import './styles.css';
import './modern-styles.css';

// Configuração da API
const API_URL = 'http://localhost:3001/api';

// Configurar interceptador do Axios
axios.defaults.baseURL = API_URL;
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptador de resposta para lidar com tokens expirados
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Context de autenticação
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

// Provider de autenticação
const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      setUser(user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro no login' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verificar se o token é válido fazendo uma requisição ao backend
          const response = await axios.get('/user/me');
          setIsAuthenticated(true);
          setUser(response.data.user);
        } catch (error) {
          // Token inválido, remover do localStorage
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Carregando...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Sidebar Component
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '🏠', path: '/dashboard', description: 'Visão geral' },
    { key: 'all-transactions', label: 'Todas Transações', icon: '📊', path: '/all-transactions', description: 'Gerenciar tudo' },
    { key: 'transactions', label: 'Cartões', icon: '💳', path: '/transactions', description: 'Cartão de crédito' },
    { key: 'banks', label: 'Bancos', icon: '🏦', path: '/banks', description: 'Débito e PIX' },
    { key: 'settings', label: 'Configurações', icon: '⚙️', path: '/settings', description: 'Preferências' }
  ];

  return (
    <div className="modern-sidebar">
      {/* Header Modernizado */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <div className="icon-container">💎</div>
        </div>
        <div className="brand-text">
          <h1 className="brand-title">FinControl</h1>
          <p className="brand-subtitle">Gestão Financeira</p>
        </div>
      </div>
      
      {/* Menu de Navegação Modernizado */}
      <nav className="modern-nav">
        <div className="nav-section">
          <h3 className="nav-section-title">Menu Principal</h3>
          <ul className="modern-nav-menu">
            {menuItems.map((item) => (
              <li key={item.key} className="modern-nav-item">
                <Link
                  to={item.path}
                  className={`modern-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <div className="nav-link-content">
                    <div className={`nav-icon-wrapper ${location.pathname === item.path ? 'active' : ''}`}>
                      <span className="nav-icon-modern">{item.icon}</span>
                    </div>
                    <div className="nav-text-content">
                      <span className="nav-label-modern">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  </div>
                  {location.pathname === item.path && <div className="active-indicator"></div>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Perfil do Usuário Modernizado */}
      <div className="modern-user-section">
        <div className="user-profile-card">
          <div className="user-avatar-modern">
            <span className="avatar-text-modern">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
            <div className="avatar-status"></div>
          </div>
          <div className="user-info-modern">
            <h4 className="user-name-modern">{user?.name || 'Usuário'}</h4>
            <p className="user-email-modern">{user?.email || 'usuario@email.com'}</p>
          </div>
        </div>
        <button className="modern-logout-btn" onClick={logout}>
          <span className="logout-icon">🚪</span>
          <span className="logout-text">Sair</span>
        </button>
      </div>
    </div>
  );
};

// Página de Login Modernizada
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="modern-login-container">
      <div className="login-background">
        <div className="background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
      
      <div className="modern-login-card">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">💎</div>
          </div>
          <h1 className="login-title">FinControl</h1>
          <p className="login-subtitle">Faça login para continuar</p>
        </div>
        
        {error && (
          <div className="modern-error-message">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="modern-login-form">
          <div className="modern-form-group">
            <label className="modern-label">
              <span className="label-icon">📧</span>
              <span className="label-text">Email</span>
            </label>
            <div className="modern-input-wrapper">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="modern-input"
                placeholder="Digite seu email"
                required
              />
            </div>
          </div>
          
          <div className="modern-form-group">
            <label className="modern-label">
              <span className="label-icon">🔒</span>
              <span className="label-text">Senha</span>
            </label>
            <div className="modern-input-wrapper password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="modern-input"
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`modern-login-button ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <span className="button-content">
                <span className="loading-spinner"></span>
                <span>Entrando...</span>
              </span>
            ) : (
              <span className="button-content">
                <span className="button-icon">🚀</span>
                <span>Entrar</span>
              </span>
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <p className="footer-text">Sistema de Controle Financeiro Pessoal</p>
          <div className="footer-version">v1.0.0</div>
        </div>
      </div>
    </div>
  );
};

// Modal de Nova Transação
const AddTransactionModal = ({ onSave, onCancel }) => {
  const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    date: today,
    paymentMethod: 'pix',
    isRecurring: false,
    isInstallment: false,
    installmentNumber: 1,
    totalInstallments: 2
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Converte o valor formatado de volta para número
    const numericAmount = parseFloat(formData.amount.replace(/\./g, '').replace(',', '.'));

    onSave({
      ...formData,
      amount: numericAmount
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCurrency = (value) => {
    // Remove tudo que não é número
    let numbers = value.replace(/\D/g, '');
    
    // Se não tem números, retorna vazio
    if (!numbers) return '';
    
    // Converte para número para remover zeros à esquerda
    const numericValue = parseInt(numbers, 10);
    
    // Se é zero, retorna 0,00
    if (numericValue === 0) return '0,00';
    
    // Converte de volta para string para processar
    numbers = numericValue.toString();
    
    // Se tem apenas 1 dígito: 5 -> 0,05
    if (numbers.length === 1) {
      return `0,0${numbers}`;
    }
    
    // Se tem apenas 2 dígitos: 56 -> 0,56
    if (numbers.length === 2) {
      return `0,${numbers}`;
    }
    
    // Se tem 3 ou mais dígitos: 123 -> 1,23 | 1234 -> 12,34 | 12345 -> 123,45
    const reais = numbers.slice(0, -2);
    const centavos = numbers.slice(-2);
    
    // Adiciona separador de milhares nos reais se necessário
    const reaisFormatted = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${reaisFormatted},${centavos}`;
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    const formatted = formatCurrency(value);
    
    setFormData(prev => ({
      ...prev,
      amount: formatted
    }));
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Nova Transação</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* 1. TIPO - Botões Receita/Despesa */}
            <div className="form-group">
              <label>Tipo *</label>
              <div className="type-buttons">
                <button
                  type="button"
                  className={`type-button income ${formData.type === 'income' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                >
                  💰 Receita
                </button>
                <button
                  type="button"
                  className={`type-button expense ${formData.type === 'expense' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                >
                  💸 Despesa
                </button>
              </div>
            </div>

            {/* 2. DATA */}
            <div className="form-group">
              <label>Data *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            {/* 3. TIPO DE PAGAMENTO */}
            <div className="form-group">
              <label>Tipo de Pagamento *</label>
              <div className="payment-buttons">
                <button
                  type="button"
                  className={`payment-button debito ${formData.paymentMethod === 'debito' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'debito' }))}
                >
                  💳 Débito
                </button>
                <button
                  type="button"
                  className={`payment-button credito ${formData.paymentMethod === 'credito' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'credito' }))}
                >
                  🏦 Crédito
                </button>
                <button
                  type="button"
                  className={`payment-button pix ${formData.paymentMethod === 'pix' ? 'active' : ''} ${formData.isInstallment ? 'disabled' : ''}`}
                  disabled={formData.isInstallment}
                  onClick={() => {
                    if (!formData.isInstallment) {
                      setFormData(prev => ({ 
                        ...prev, 
                        paymentMethod: 'pix',
                        // Se selecionar PIX, desativar parcelamento
                        isInstallment: false
                      }));
                    }
                  }}
                >
                  📱 PIX
                </button>
              </div>
            </div>

            <div className="form-row">
              {/* 4. DESCRIÇÃO */}
              <div className="form-group">
                <label>Descrição *</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Ex: Almoço, Salário, etc."
                  required
                />
              </div>
              
              {/* 4.5. VALOR */}
              <div className="form-group">
                <label>Valor *</label>
                <div className="currency-input">
                  <span className="currency-symbol">R$</span>
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* 5. CATEGORIA */}
            <div className="form-group">
              <label>Categoria</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Selecione uma categoria</option>
                {formData.type === 'income' ? (
                  <>
                    <option value="Salário">Salário</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Investimentos">Investimentos</option>
                    <option value="Outros">Outros</option>
                  </>
                ) : (
                  <>
                    <option value="Alimentação">Alimentação</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Moradia">Moradia</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Educação">Educação</option>
                    <option value="Lazer">Lazer</option>
                    <option value="Outros">Outros</option>
                  </>
                )}
              </select>
            </div>
            
            {/* 6. TRANSAÇÃO FIXA */}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    isRecurring: e.target.checked,
                    // Se ativar recorrente, desativar parcelamento
                    isInstallment: e.target.checked ? false : prev.isInstallment
                  }))}
                />
                <span className="checkbox-text">Transação Fixa (repete todos os meses)</span>
              </label>
            </div>

            {/* 7. PARCELAMENTO */}
            <div className="form-group">
              <label className={`checkbox-label ${formData.isRecurring || formData.paymentMethod === 'pix' ? 'disabled' : ''}`}>
                <input
                  type="checkbox"
                  name="isInstallment"
                  checked={formData.isInstallment}
                  disabled={formData.isRecurring || formData.paymentMethod === 'pix'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    isInstallment: e.target.checked,
                    // Se ativar parcelamento e estiver no PIX, mudar para débito
                    paymentMethod: (e.target.checked && prev.paymentMethod === 'pix') ? 'debito' : prev.paymentMethod
                  }))}
                />
                <span className="checkbox-text">Parcelado (crédito/débito apenas)</span>
              </label>
            </div>

            {/* Campo de número de parcelas */}
            {formData.isInstallment && (
              <div className="form-group">
                <label htmlFor="totalInstallments">Número de Parcelas:</label>
                <input
                  type="number"
                  id="totalInstallments"
                  name="totalInstallments"
                  min="2"
                  max="60"
                  value={formData.totalInstallments}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    totalInstallments: parseInt(e.target.value) || 2
                  }))}
                  required
                />
                <small className="helper-text">De 2 a 60 parcelas</small>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={onCancel}>
              <span>❌</span>
              Cancelar
            </button>
            <button type="submit" className="btn btn-success">
              <span>💾</span>
              Adicionar Transação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Página Dashboard
const DashboardPage = () => {
  const [data, setData] = useState({
    stats: {
      balance: 0,
      income: 0,
      expense: 0
    },
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadData = async (month = selectedMonth, year = selectedYear) => {
    try {
      const response = await axios.get(`/dashboard?month=${month}&year=${year}`);
      setData(response.data || {
        stats: { balance: 0, income: 0, expense: 0 },
        recentTransactions: []
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setData({
        stats: { balance: 0, income: 0, expense: 0 },
        recentTransactions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (transactionData) => {
    try {
      const response = await axios.post('/transactions', transactionData);
      
      setShowAddModal(false);
      alert('Transação adicionada com sucesso!');
      
      // Recarregar dados do dashboard
      loadData();
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      alert('Erro ao adicionar transação');
    }
  };

  const changeMonth = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    loadData(newMonth, newYear);
  };

  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div className="page loading">Carregando dashboard...</div>;
  }

  return (
    <div className="page">
      <div className="month-selector">
        <button 
          className="month-nav-btn"
          onClick={() => changeMonth(-1)}
        >
          ←
        </button>
        <div className="month-display">
          <h2>{getMonthName(selectedMonth)} {selectedYear}</h2>
        </div>
        <button 
          className="month-nav-btn"
          onClick={() => changeMonth(1)}
        >
          →
        </button>
      </div>

      <div className="stats-grid">
        <div className="stats-row">
          <div className="stat-card balance">
            <div className="stat-header">
              <div className="stat-title">Saldo Atual</div>
              <div className="stat-icon">💰</div>
            </div>
            <div className={`stat-value ${(data.stats?.balance ?? 0) >= 0 ? 'positive' : 'negative'}`}>
              R$ {(data.stats?.balance ?? 0).toFixed(2)}
            </div>
          </div>
          
          <div className="stat-card transactions">
            <div className="stat-header">
              <div className="stat-title">💳 Cartão Crédito</div>
              <div className="stat-icon">💳</div>
            </div>
            <div className="stat-value primary">R$ {(data.creditCardTotal ?? 0).toFixed(2)}</div>
          </div>
        </div>
        
        <div className="stats-row">
          <div className="stat-card income">
            <div className="stat-header">
              <div className="stat-title">Receitas</div>
              <div className="stat-icon">📈</div>
            </div>
            <div className="stat-value positive">R$ {(data.stats?.income ?? 0).toFixed(2)}</div>
          </div>
          
          <div className="stat-card expense">
            <div className="stat-header">
              <div className="stat-title">Despesas</div>
              <div className="stat-icon">📉</div>
            </div>
            <div className="stat-value negative">R$ {(data.stats?.expense ?? 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="recent-transactions">
        <div className="transactions-container">
          <div className="transactions-header">
            <h3>Transações Recentes</h3>
          </div>
          <div className="transactions-list">
            {data.recentTransactions && data.recentTransactions.length > 0 ? (
              data.recentTransactions.slice(0, 5).map((transaction) => (
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
                    {transaction.type === 'income' ? '+' : '-'}R$ {(transaction.amount || 0).toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-transactions">
                <p>Nenhuma transação encontrada</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Nova Transação */}
      {showAddModal && (
        <AddTransactionModal
          onSave={handleAddTransaction}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {/* FAB - Floating Action Button */}
      <button 
        className="fab"
        onClick={() => setShowAddModal(true)}
        title="Adicionar Nova Transação"
      >
        +
      </button>
    </div>
  );
};

// Página Todas Transações
const AllTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfirmDeleteAllModal, setShowConfirmDeleteAllModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadTransactions = async (month = selectedMonth, year = selectedYear) => {
    try {
      const response = await axios.get(`/transactions?month=${month}&year=${year}`);
      const allTransactions = response.data || [];
      
      // TODAS as transações, sem filtro
      setTransactions(allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
      
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (transactionData) => {
    try {
      await axios.post('/transactions', transactionData);
      setShowAddModal(false);
      alert('Transação adicionada com sucesso!');
      loadTransactions();
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      alert('Erro ao adicionar transação');
    }
  };

  const handleDeleteTransaction = async (deleteAll = false) => {
    try {
      if (deleteAll && (transactionToDelete.recurringParentId || transactionToDelete.isRecurring)) {
        await axios.delete(`/transactions/${transactionToDelete._id}/recurring`);
        alert('Todas as transações da série foram deletadas!');
      } else if (deleteAll && (transactionToDelete.installmentParentId || transactionToDelete.isInstallment)) {
        await axios.delete(`/transactions/${transactionToDelete._id}/installments`);
        alert('Todas as parcelas foram deletadas!');
      } else {
        await axios.delete(`/transactions/${transactionToDelete._id}`);
        alert('Transação deletada com sucesso!');
      }
      
      setShowDeleteModal(false);
      setShowConfirmDeleteAllModal(false);
      setTransactionToDelete(null);
      
      loadTransactions();
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      alert('Erro ao deletar transação');
    }
  };

  const changeMonth = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    loadTransactions(newMonth, newYear);
  };

  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  if (loading) {
    return <div className="page loading">Carregando transações...</div>;
  }

  return (
    <div className="page">
      <div className="month-selector">
        <button 
          className="month-nav-btn"
          onClick={() => changeMonth(-1)}
        >
          ←
        </button>
        <div className="month-display">
          <h2>📊 Todas as Transações - {getMonthName(selectedMonth)} {selectedYear}</h2>
        </div>
        <button 
          className="month-nav-btn"
          onClick={() => changeMonth(1)}
        >
          →
        </button>
      </div>

      <div className="transactions-container">
        <div className="transactions-list">
        {transactions.length === 0 ? (
            <div className="no-transactions">
              <div className="empty-state-icon">📊</div>
              <h3>Nenhuma transação encontrada</h3>
              <p>Comece adicionando sua primeira transação do mês</p>
              <button 
                className="btn-add-simple"
                onClick={() => setShowAddModal(true)}
              >
                ➕ Adicionar Transação
              </button>
            </div>
        ) : (
          transactions.map(transaction => {
            // Ícones bonitos baseados na categoria
            const getIconForCategory = (category, type) => {
              const categoryIcons = {
                'alimentacao': '🍕', 'alimentação': '🍕', 'comida': '🍕', 'restaurante': '🍽️',
                'transporte': '🚗', 'combustivel': '⛽', 'combustível': '⛽', 'uber': '🚕',
                'saude': '🏥', 'saúde': '🏥', 'farmacia': '💊', 'farmácia': '💊',
                'educacao': '📚', 'educação': '📚', 'curso': '📚', 'livros': '📖',
                'lazer': '🎮', 'entretenimento': '🎬', 'cinema': '🎬', 'netflix': '📺',
                'casa': '🏠', 'moradia': '🏠', 'aluguel': '🏠', 'condominio': '🏠',
                'trabalho': '💼', 'salario': '💰', 'salário': '💰', 'freelance': '💻',
                'investimento': '📈', 'venda': '💵', 'compras': '🛍️', 'shopping': '🛍️',
                'outros': '💳', 'diversos': '💳'
              };
              return categoryIcons[category?.toLowerCase()] || (type === 'income' ? '💰' : '💳');
            };

            return (
              <div key={transaction._id} className="transaction-item">
                <div className="transaction-info">
                  <div className={`transaction-icon ${transaction.type}`}>
                    {getIconForCategory(transaction.category, transaction.type)}
                  </div>
                  <div className="transaction-details">
                    <h4>{transaction.description}</h4>
                    <small>{transaction.category} • {new Date(transaction.date).toLocaleDateString('pt-BR')}</small>
                  </div>
                </div>
                <div className="transaction-right">
                  <div className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}R$ {(transaction.amount || 0).toFixed(2)}
                  </div>
                  <div className="transaction-actions">
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => {
                        setEditingTransaction(transaction);
                        setShowEditModal(true);
                      }}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => {
                        setTransactionToDelete(transaction);
                        setShowDeleteModal(true);
                      }}
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>

      {/* Modais */}
      {showAddModal && (
        <AddTransactionModal 
          onSave={handleAddTransaction}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && transactionToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar Exclusão</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja deletar esta transação?</p>
              <div className="transaction-preview">
                <strong>{transactionToDelete.description}</strong>
                <span className={`amount ${transactionToDelete.type}`}>
                  {transactionToDelete.type === 'income' ? '+' : '-'}R$ {(transactionToDelete.amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-danger"
                onClick={() => handleDeleteTransaction(false)}
              >
                🗑️ Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB - Floating Action Button */}
      <button 
        className="fab"
        onClick={() => setShowAddModal(true)}
        title="Adicionar Nova Transação"
      >
        +
      </button>
    </div>
  );
};

// Página Cartões
const CreditCardPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [creditTransactions, setCreditTransactions] = useState([]);
  const [totalCreditAmount, setTotalCreditAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadTransactions = async (month = selectedMonth, year = selectedYear) => {
    try {
      const response = await axios.get(`/transactions?month=${month}&year=${year}`);
      const allTransactions = response.data || [];
      setTransactions(allTransactions);
      
      // Filtrar apenas transações de crédito
      const creditOnly = allTransactions.filter(t => 
        t && t.type === 'expense' && t.paymentMethod === 'credito'
      );
      setCreditTransactions(creditOnly);
      
      // Calcular total do cartão de crédito
      const total = creditOnly.reduce((sum, t) => sum + (t.amount || 0), 0);
      setTotalCreditAmount(total);
      
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setTransactions([]);
      setCreditTransactions([]);
      setTotalCreditAmount(0);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    loadTransactions(newMonth, newYear);
  };

  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  if (loading) {
    return <div className="page loading">Carregando gastos do cartão...</div>;
  }

  return (
    <div className="page">
      <div className="month-selector">
        <button 
          className="month-nav-btn"
          onClick={() => changeMonth(-1)}
        >
          ←
        </button>
        <div className="month-display">
          <h2>💳 Cartões - {getMonthName(selectedMonth)} {selectedYear}</h2>
          <div className="credit-total">
            Total: R$ {totalCreditAmount.toFixed(2)}
          </div>
        </div>
        <button 
          className="month-nav-btn"
          onClick={() => changeMonth(1)}
        >
          →
        </button>
      </div>

      <div className="transactions-container">
        <div className="transactions-list">
          {creditTransactions && creditTransactions.length > 0 ? (
            creditTransactions.map((transaction) => {
              // Ícones baseados na categoria
              const getIconForCategory = (category) => {
                const categoryIcons = {
                  'alimentacao': '🍕', 'alimentação': '🍕', 'comida': '🍕', 'restaurante': '🍽️',
                  'transporte': '🚗', 'combustivel': '⛽', 'combustível': '⛽', 'uber': '🚕',
                  'saude': '🏥', 'saúde': '🏥', 'farmacia': '💊', 'farmácia': '💊',
                  'casa': '🏠', 'mercado': '🛒', 'supermercado': '🛒',
                  'educacao': '📚', 'educação': '📚', 'curso': '🎓',
                  'lazer': '🎮', 'cinema': '🎬', 'streaming': '📺', 'netflix': '📺',
                  'roupas': '👕', 'roupa': '👕', 'shopping': '🛍️',
                  'servicos': '🔧', 'serviços': '🔧', 'manutencao': '🔧', 'manutenção': '🔧',
                  'assinatura': '📱', 'software': '💻', 'app': '📱',
                  'viagem': '✈️', 'hotel': '🏨', 'passagem': '🎫',
                  'presente': '🎁', 'gift': '🎁',
                  'outros': '📦'
                };
                return categoryIcons[category?.toLowerCase()] || '💳';
              };

              return (
                <div key={transaction._id} className="transaction-item">
                  <div className="transaction-info">
                    <div className="transaction-icon-modern">
                      {getIconForCategory(transaction.category)}
                    </div>
                    <div className="transaction-details">
                      <h4>{transaction.description}</h4>
                      <small>
                        {transaction.category} • Cartão de Crédito • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </small>
                    </div>
                  </div>
                  <div className="transaction-right">
                    <div className={`transaction-amount ${transaction.type}`}>
                      -R$ {(transaction.amount || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-transactions">
              <p>💳 Nenhum gasto no cartão este mês</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Página Bancos
const BanksPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [bankTransactions, setBankTransactions] = useState([]);
  const [totalBankAmount, setTotalBankAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadTransactions = async (month = selectedMonth, year = selectedYear) => {
    try {
      const response = await axios.get(`/transactions?month=${month}&year=${year}`);
      const allTransactions = response.data || [];
      setTransactions(allTransactions);
      
      // Filtrar apenas transações de débito e PIX
      const bankOnly = allTransactions.filter(t => 
        t && t.type === 'expense' && (t.paymentMethod === 'debito' || t.paymentMethod === 'pix')
      );
      setBankTransactions(bankOnly);
      
      // Calcular total dos bancos (débito + PIX)
      const total = bankOnly.reduce((sum, t) => sum + (t.amount || 0), 0);
      setTotalBankAmount(total);
      
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setTransactions([]);
      setBankTransactions([]);
      setTotalBankAmount(0);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    loadTransactions(newMonth, newYear);
  };

  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  if (loading) {
    return <div className="page loading">Carregando movimentações bancárias...</div>;
  }

  return (
    <div className="page">
      <div className="month-selector">
        <button 
          className="month-nav-btn"
          onClick={() => changeMonth(-1)}
        >
          ←
        </button>
        <div className="month-display">
          <h2>🏦 Bancos - {getMonthName(selectedMonth)} {selectedYear}</h2>
          <div className="credit-total">
            Total: R$ {totalBankAmount.toFixed(2)}
          </div>
        </div>
        <button 
          className="month-nav-btn"
          onClick={() => changeMonth(1)}
        >
          →
        </button>
      </div>

      <div className="transactions-container">
        <div className="transactions-list">
          {bankTransactions && bankTransactions.length > 0 ? (
            bankTransactions.map((transaction) => {
              // Ícones baseados na categoria
              const getIconForCategory = (category, paymentMethod) => {
                if (paymentMethod === 'pix') return '📱';
                if (paymentMethod === 'debito') return '💳';
                
                const categoryIcons = {
                  'alimentacao': '🍕', 'alimentação': '🍕', 'comida': '🍕',
                  'transporte': '🚗', 'combustivel': '⛽', 'combustível': '⛽',
                  'saude': '🏥', 'saúde': '🏥', 'farmacia': '💊',
                  'casa': '🏠', 'mercado': '🛒', 'supermercado': '🛒',
                  'educacao': '📚', 'educação': '📚',
                  'lazer': '🎮', 'cinema': '🎬', 'streaming': '📺',
                  'roupas': '👕', 'roupa': '👕',
                  'servicos': '🔧', 'serviços': '🔧',
                  'outros': '📦'
                };
                return categoryIcons[category?.toLowerCase()] || '💰';
              };

              return (
                <div key={transaction._id} className="transaction-item">
                  <div className="transaction-info">
                    <div className="transaction-icon-modern">
                      {getIconForCategory(transaction.category, transaction.paymentMethod)}
                    </div>
                    <div className="transaction-details">
                      <h4>{transaction.description}</h4>
                      <small>
                        {transaction.category} • {transaction.paymentMethod === 'pix' ? 'PIX' : 'Débito'} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </small>
                    </div>
                  </div>
                  <div className="transaction-right">
                    <div className={`transaction-amount ${transaction.type}`}>
                      -R$ {(transaction.amount || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-transactions">
              <p>🏦 Nenhuma movimentação bancária este mês</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Página Configurações - SIMPLES
const SettingsPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="page">
      <h1 className="page-title">⚙️ Configurações</h1>
      <p className="page-subtitle">Perfil e preferências</p>

      <div className="settings-container">
        {/* Perfil do Usuário */}
        <div className="settings-section">
          <h2>👤 Perfil do Usuário</h2>
          <div className="user-info">
            <p><strong>Email:</strong> {user?.email || 'Não informado'}</p>
            <p><strong>Nome:</strong> {user?.name || 'Não informado'}</p>
          </div>
        </div>

        {/* Preferências */}
        <div className="settings-section">
          <h2>🎨 Preferências</h2>
          <div className="coming-soon">
            <p>Configurações de tema e personalização em breve!</p>
          </div>
        </div>

        {/* Sobre o Sistema */}
        <div className="settings-section">
          <h2>ℹ️ Sobre</h2>
          <div className="about-info">
            <p><strong>Versão:</strong> 1.0.0</p>
            <p><strong>Sistema:</strong> Controle Financeiro Pessoal</p>
          </div>
        </div>

        {/* Ações da Conta */}
        <div className="settings-section">
          <h2>🚪 Sessão</h2>
          <button className="btn-danger" onClick={logout}>
            Fazer Logout
          </button>
        </div>
      </div>
    </div>
  );
};

// Layout principal com sidebar
const MainLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

// Componente principal do App
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DashboardPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/all-transactions"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AllTransactionsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CreditCardPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cards"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CreditCardPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/banks"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <BanksPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SettingsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
