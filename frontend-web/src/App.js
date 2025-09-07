import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
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

// Context para Modal de Nova Transação e Refresh Global
const NewTransactionContext = createContext();
const useNewTransaction = () => useContext(NewTransactionContext);

// Provider para Modal de Nova Transação e Refresh Global
const NewTransactionProvider = ({ children }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const openModal = () => setShowAddModal(true);
  const closeModal = () => setShowAddModal(false);
  
  // Função para disparar refresh em todas as páginas
  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);
  
  return (
    <NewTransactionContext.Provider value={{ 
      showAddModal, 
      openModal, 
      closeModal, 
      refreshTrigger, 
      triggerRefresh 
    }}>
      {children}
    </NewTransactionContext.Provider>
  );
};

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
  const location = useLocation();
  const { user, logout } = useAuth();
  const { openModal } = useNewTransaction();

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
          
          {/* Botão Nova Transação */}
          <div className="nav-action-button">
            <button 
              className="btn-new-transaction"
              onClick={openModal}
            >
              <span className="btn-icon">➕</span>
              <span className="btn-text">Nova Transação</span>
            </button>
          </div>
          
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

// Componente Header Padrão com Seletor de Mês
const PageHeaderWithMonthSelector = ({ 
  title, 
  icon, 
  subtitle, 
  selectedMonth, 
  selectedYear, 
  onMonthChange 
}) => {
  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const changeMonth = (delta) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    onMonthChange(newMonth, newYear);
  };

  return (
    <div className="month-selector-enhanced">
      <button 
        className="month-nav-btn prev"
        onClick={() => changeMonth(-1)}
        title="Mês anterior"
      >
        ‹
      </button>
      <div className="month-display-enhanced">
        <div className="current-month">
          <h2>{icon} {title} - {getMonthName(selectedMonth)} {selectedYear}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <button 
        className="month-nav-btn next"
        onClick={() => changeMonth(1)}
        title="Próximo mês"
      >
        ›
      </button>
    </div>
  );
};

// Página Dashboard
const DashboardPage = () => {
  const navigate = useNavigate();
  const { openModal, refreshTrigger } = useContext(NewTransactionContext);
  const [data, setData] = useState({
    stats: {
      balance: 0,
      income: 0,
      expense: 0
    },
    recentTransactions: []
  });
  const [creditCards, setCreditCards] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [currentModalMonth, setCurrentModalMonth] = useState(new Date().getMonth());
  const [currentModalYear, setCurrentModalYear] = useState(new Date().getFullYear());

  // Estados para o modal de extrato de bancos
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBankForModal, setSelectedBankForModal] = useState(null);
  const [currentBankModalMonth, setCurrentBankModalMonth] = useState(new Date().getMonth());
  const [currentBankModalYear, setCurrentBankModalYear] = useState(new Date().getFullYear());

  // Estados para controle de loading otimizado
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const loadingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const lastLoadParamsRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const loadData = useCallback(async (month = selectedMonth, year = selectedYear, forceReload = false) => {
    // Evita múltiplas chamadas simultâneas
    if (loadingRef.current && !forceReload) {
      console.log('🔄 Carregamento já em andamento, ignorando...');
      return;
    }
    
    // Verificar cache (só se não for reload forçado)
    const currentParams = `${month}-${year}`;
    if (!forceReload && lastLoadParamsRef.current === currentParams) {
      console.log('📋 Dados já carregados para este período, usando cache');
      return;
    }
    
    // Marcar como carregando
    loadingRef.current = true;
    setIsLoadingData(true);
    setLoadingError(null);
    
    // Cancelar requisição anterior apenas se houver uma pendente há mais de 2 segundos
    if (abortControllerRef.current) {
      console.log('⏹️ Cancelando requisição anterior');
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    // Timeout de segurança (15 segundos para dar tempo das requisições)
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        console.log('⏰ Timeout: Cancelando requisições por demora excessiva');
        abortControllerRef.current.abort();
      }
    }, 15000);
    
    try {
      console.log(`📊 Carregando dashboard para ${month}/${year}...`);
      
      // Requisição principal do dashboard
      const response = await axios.get(`/dashboard?month=${month}&year=${year}`, {
        signal: abortControllerRef.current.signal,
        timeout: 10000 // 10 segundos por requisição
      });
      
      setData(response.data || {
        stats: { balance: 0, income: 0, expense: 0 },
        recentTransactions: []
      });
      
      // Carregar dados complementares em paralelo (mas com o mesmo controller)
      const [cardsResponse, banksResponse, transactionsResponse] = await Promise.all([
        axios.get('/credit-cards', { 
          signal: abortControllerRef.current.signal,
          timeout: 8000 
        }),
        axios.get('/banks', { 
          signal: abortControllerRef.current.signal,
          timeout: 8000 
        }),
        // Carregar TODAS as transações para permitir geração de virtuais em qualquer mês
        axios.get('/transactions', { 
          signal: abortControllerRef.current.signal,
          timeout: 10000 
        })
      ]);
      
      setCreditCards(cardsResponse.data || []);
      setBanks(banksResponse.data || []);
      setTransactions(transactionsResponse.data || []);
      
      console.log('🔍 DEBUG DASHBOARD CARREGADO:', {
        cartões: cardsResponse.data?.length || 0,
        bancos: banksResponse.data?.length || 0,
        transações: transactionsResponse.data?.length || 0,
        mês: month,
        ano: year,
        transaçõesCompletas: transactionsResponse.data
      });
      
      console.log('✅ Dashboard carregado com sucesso');
      
    } catch (error) {
      // Só logar erros que não sejam cancelamento intencional
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('🚫 Requisição cancelada (comportamento normal)');
      } else {
        console.error('❌ Erro ao carregar dashboard:', error);
        setLoadingError(error.message || 'Erro desconhecido');
        setData({
          stats: { balance: 0, income: 0, expense: 0 },
          recentTransactions: []
        });
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoadingData(false);
      loadingRef.current = false;
      
      // Só atualizar cache se não houve erro
      if (!loadingError) {
        lastLoadParamsRef.current = currentParams;
      }
    }
  }, [selectedMonth, selectedYear, loadingError]);

  const handleMonthChange = useCallback((month, year) => {
    console.log(`📅 Mudança de mês solicitada: ${month}/${year}`);
    
    // Cancelar timer anterior se existir
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Atualizar estados imediatamente
    setSelectedMonth(month);
    setSelectedYear(year);
    
    // Debounce na chamada da API para evitar múltiplas requisições
    debounceTimerRef.current = setTimeout(() => {
      loadData(month, year, true); // forceReload = true para mudança de mês
    }, 300); // 300ms de debounce
  }, [loadData]);

  // Função para obter a bandeira do cartão baseada no nome
  const getCardFlag = (cardName) => {
    if (!cardName) return 'CARTÃO';
    const name = cardName.toLowerCase();
    if (name.includes('visa')) return 'VISA';
    if (name.includes('mastercard') || name.includes('master')) return 'MASTERCARD';
    if (name.includes('amex') || name.includes('american express')) return 'AMEX';
    if (name.includes('elo')) return 'ELO';
    if (name.includes('hipercard') || name.includes('hiper')) return 'HIPERCARD';
    return 'CARTÃO';
  };

  // Determinar a classe baseada na bandeira do cartão
  const getBrandClass = (brand) => {
    if (!brand) return 'default';
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return 'visa';
    if (brandLower.includes('master')) return 'mastercard';
    if (brandLower.includes('amex') || brandLower.includes('american')) return 'amex';
    if (brandLower.includes('elo')) return 'elo';
    if (brandLower.includes('hiper')) return 'hipercard';
    return 'default';
  };

  const openCardModal = async (card) => {
    console.log('🔍 Abrindo modal do cartão:', card.name);
    
    // Recarregar transações atuais
    try {
      const transactionsResponse = await axios.get(`/transactions`);
      console.log('📊 Transações carregadas:', transactionsResponse.data.length);
      setTransactions(transactionsResponse.data || []);
    } catch (error) {
      console.error('Erro ao recarregar transações:', error);
    }
    
    setSelectedCardForModal(card);
    setCurrentModalMonth(new Date().getMonth());
    setCurrentModalYear(new Date().getFullYear());
    setShowCardModal(true);
    console.log('🖼️ Modal aberto:', true);
  };

  // Funções de navegação de mês no modal
  const goToPreviousMonth = () => {
    if (currentModalMonth === 0) {
      setCurrentModalMonth(11);
      setCurrentModalYear(currentModalYear - 1);
    } else {
      setCurrentModalMonth(currentModalMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentModalMonth === 11) {
      setCurrentModalMonth(0);
      setCurrentModalYear(currentModalYear + 1);
    } else {
      setCurrentModalMonth(currentModalMonth + 1);
    }
  };

  // Funções específicas do modal do Dashboard
  const getDashboardMonthName = (month) => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[month];
  };

  // Função auxiliar para renderizar badges de transações
  const renderTransactionBadges = (transaction) => {
    const badges = [];
    
    // Badge de parcela
    if (transaction.isInstallment) {
      badges.push(
        <span key="installment" className="installment-badge">
          {transaction.installmentNumber}/{transaction.totalInstallments}
        </span>
      );
    }
    
    // Badge de transação fixa/recorrente
    if (transaction.isFixed || transaction.isRecurring || transaction.recurringParentId) {
      const isVirtual = transaction.isVirtual;
      badges.push(
        <span key="fixed" className={isVirtual ? "virtual-fixed-badge" : "fixed-badge"}>
          {isVirtual ? "FIXA (AUTO)" : "FIXA"}
        </span>
      );
    }
    
    return badges;
  };

  // Função para renderizar badges de transações do banco
  const renderBankTransactionBadges = (transaction) => {
    const badges = [];
    
    if (transaction.isInstallment) {
      badges.push(
        <span key="installment" className="installment-badge">
          {transaction.installmentNumber}/{transaction.totalInstallments}
        </span>
      );
    }
    
    if (transaction.isFixed || transaction.isRecurring || transaction.recurringParentId) {
      const isVirtual = transaction.isVirtualFixed || transaction.isVirtual;
      badges.push(
        <span key="fixed" className={isVirtual ? "virtual-fixed-badge" : "fixed-badge"}>
          FIXA{isVirtual ? " (AUTO)" : ""}
        </span>
      );
    }
    
    return badges;
  };

  const getDashboardCardTransactionsByMonth = (cardName, month, year) => {
    console.log('🔍 FILTRANDO TRANSAÇÕES CARTÃO:', { cardName, month, year, totalTransactions: transactions?.length || 0 });
    
    if (!transactions || !Array.isArray(transactions)) {
      console.log('❌ SEM TRANSAÇÕES DISPONÍVEIS');
      return [];
    }

    // Filtrar apenas transações reais do mês e cartão
    const monthTransactions = transactions.filter(transaction => {
      if (!transaction.date) return false;
      
      const transactionDate = new Date(transaction.date);
      const transactionMonth = transactionDate.getMonth(); // Manter em formato 0-11
      const transactionYear = transactionDate.getFullYear();
      
      const isCorrectMonth = transactionMonth === month && transactionYear === year;
      const isCorrectCard = transaction.creditCard === cardName;
      const isCorrectType = transaction.paymentMethod === 'credito';
      
      return isCorrectMonth && isCorrectCard && isCorrectType;
    });

    console.log('� Transações encontradas para', cardName, ':', monthTransactions.length);
    return monthTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const calculateDashboardCardExpensesByMonth = (cardName, month, year) => {
    console.log('📊 CALCULANDO GASTOS:', { cardName, month, year });
    const monthTransactions = getDashboardCardTransactionsByMonth(cardName, month, year);
    console.log('📋 TRANSAÇÕES ENCONTRADAS:', monthTransactions.length, monthTransactions);
    const total = monthTransactions.reduce((sum, transaction) => {
      console.log('💳 TRANSAÇÃO:', { description: transaction.description, amount: transaction.amount });
      return sum + (transaction.amount || 0);
    }, 0);
    console.log('💰 TOTAL CALCULADO:', total);
    return total;
  };

  const calculateDashboardCardExpenses = (cardName) => {
    // Usar a função que calcula apenas saldo atual (já lançado)
    return calculateCurrentBalance(cardName);
  };

  const calculateDashboardCommittedBalance = (cardName) => {
    if (!transactions || !Array.isArray(transactions)) return 0;
    
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia atual
    
    // APENAS parcelamentos futuros do MÊS ATUAL (não transações fixas)
    const futureInstallments = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0); // Início do dia da transação
      const transactionMonth = transactionDate.getMonth() + 1;
      const transactionYear = transactionDate.getFullYear();
      
      return t.creditCard === cardName && 
             t.paymentMethod === 'credito' &&
             t.isInstallment && // APENAS PARCELAMENTOS
             transactionMonth === selectedMonth && // APENAS MÊS ATUAL
             transactionYear === selectedYear &&
             transactionDate > today; // Data futura dentro do mês
    });
    
    console.log(`💳 Saldo comprometido ${cardName} (${selectedMonth}/${selectedYear}):`, futureInstallments.length, 'parcelamentos futuros');
    return futureInstallments.reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  // Calcular valor total "A ser lançado" no Dashboard
  const calculateDashboardPendingAmount = (cardName) => {
    if (!transactions || !Array.isArray(transactions)) return 0;
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const pendingTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0);
      const transactionMonth = transactionDate.getMonth() + 1;
      const transactionYear = transactionDate.getFullYear();
      
      return t.creditCard === cardName && 
             t.paymentMethod === 'credito' &&
             t.type === 'expense' &&
             transactionMonth === selectedMonth &&
             transactionYear === selectedYear &&
             transactionDate > today; // Data futura
    });
    
    return pendingTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  // Calcular saldo atual (já lançado) do cartão no mês selecionado
  const calculateCurrentBalance = (cardName) => {
    if (!transactions || !Array.isArray(transactions)) return 0;
    
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia atual
    
    // Transações já lançadas do MÊS SELECIONADO
    const currentTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0); // Início do dia da transação
      const transactionMonth = transactionDate.getMonth() + 1;
      const transactionYear = transactionDate.getFullYear();
      
      return t.creditCard === cardName && 
             t.paymentMethod === 'credito' &&
             transactionMonth === selectedMonth && // APENAS MÊS SELECIONADO
             transactionYear === selectedYear &&
             transactionDate <= today; // Data atual ou passada = já lançada
    });
    
    console.log(`💳 Saldo atual ${cardName} (${selectedMonth}/${selectedYear}):`, currentTransactions.length, 'transações lançadas');
    return currentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  // Funções para o modal de extrato de bancos (importadas da página de bancos)
  const getBankTransactionsByMonth = (bankName, month, year) => {
    console.log('🔍 FILTRANDO TRANSAÇÕES BANCO (Dashboard):', { bankName, month, year, totalTransactions: transactions?.length || 0 });
    
    if (!transactions || !Array.isArray(transactions)) {
      console.log('❌ SEM TRANSAÇÕES DISPONÍVEIS');
      return [];
    }

    // Filtrar apenas transações reais do mês e banco
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const transactionMonth = transactionDate.getMonth();
      const transactionYear = transactionDate.getFullYear();
      
      // Verificar se é do banco correto e período correto
      const isBankMatch = t.bank === bankName;
      const isDateMatch = transactionMonth === month && transactionYear === year;
      
      // Verificar se é método de pagamento válido para banco (débito, PIX)
      const isValidPayment = (t.paymentMethod === 'debito' || t.paymentMethod === 'pix');
      
      return isBankMatch && isDateMatch && isValidPayment;
    });

    console.log('🏦 Transações encontradas para', bankName, ':', monthTransactions.length);
    return monthTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Calcular saldo do banco para o mês selecionado
  const calculateBankBalance = (bankName) => {
    const bankTransactions = getBankTransactionsByMonth(bankName, selectedMonth - 1, selectedYear);
    
    return bankTransactions.reduce((sum, t) => {
      if (t.type === 'income') {
        return sum + (t.amount || 0);
      } else {
        return sum - (t.amount || 0);
      }
    }, 0);
  };

  // Calcular receitas do banco para o mês selecionado
  const calculateBankIncome = (bankName) => {
    const bankTransactions = getBankTransactionsByMonth(bankName, selectedMonth - 1, selectedYear);
    return bankTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  // Calcular despesas do banco para o mês selecionado
  const calculateBankExpenses = (bankName) => {
    const bankTransactions = getBankTransactionsByMonth(bankName, selectedMonth - 1, selectedYear);
    return bankTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  // Abrir modal de extrato do banco
  const openBankModal = (bank) => {
    setSelectedBankForModal(bank);
    setCurrentBankModalMonth(new Date().getMonth());
    setCurrentBankModalYear(new Date().getFullYear());
    setShowBankModal(true);
  };

  // Funções de navegação de mês no modal de banco
  const goToPreviousBankMonth = () => {
    if (currentBankModalMonth === 0) {
      setCurrentBankModalMonth(11);
      setCurrentBankModalYear(currentBankModalYear - 1);
    } else {
      setCurrentBankModalMonth(currentBankModalMonth - 1);
    }
  };

  const goToNextBankMonth = () => {
    if (currentBankModalMonth === 11) {
      setCurrentBankModalMonth(0);
      setCurrentBankModalYear(currentBankModalYear + 1);
    } else {
      setCurrentBankModalMonth(currentBankModalMonth + 1);
    }
  };

  const getBankMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
  };

  // useEffect para carregamento inicial (apenas uma vez)
  useEffect(() => {
    console.log('🚀 Iniciando carregamento inicial do dashboard');
    loadData(selectedMonth, selectedYear, true);
  }, []); // Sem dependências para carregar apenas uma vez

  // useEffect separado para mudanças de mês/ano (com debounce)
  useEffect(() => {
    // Só reagir se não for o carregamento inicial
    if (lastLoadParamsRef.current) {
      console.log('📅 Reagindo à mudança de período selecionado');
      
      // Cancelar timer anterior
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Debounce para evitar múltiplas chamadas
      debounceTimerRef.current = setTimeout(() => {
        loadData(selectedMonth, selectedYear, true);
      }, 500);
    }
  }, [selectedMonth, selectedYear]); // Sem loadData nas dependências para evitar loop

  // useEffect para refreshTrigger (recarregamento forçado)
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 DashboardPage: Refresh trigger acionado:', refreshTrigger);
      console.log('📊 DashboardPage: Atualizando dados após nova transação');
      loadData(selectedMonth, selectedYear, true); // forceReload = true
    }
  }, [refreshTrigger]); // Sem outras dependências para evitar loop

  // Cleanup: cancelar requisições e timers quando o componente desmontar
  useEffect(() => {
    return () => {
      console.log('🧹 Limpeza do dashboard: cancelando requisições e timers');
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      loadingRef.current = false;
    };
  }, []);

  // Estado de loading inteligente
  if (isLoadingData && !lastLoadParamsRef.current) {
    return (
      <div className="page loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Carregando dashboard...</p>
          {loadingError && (
            <small className="error">
              Erro: {loadingError}
            </small>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Indicador de loading discreto para recarregamentos */}
      {isLoadingData && (
        <div className="loading-overlay">
          <div className="loading-bar"></div>
        </div>
      )}
      
      <PageHeaderWithMonthSelector 
        title="Dashboard"
        icon="📊"
        subtitle="Resumo financeiro do período"
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={handleMonthChange}
      />

      <div className="dashboard-stats">
        <div className="stats-row">
          <div className="stat-card-modern balance-card">
            <div className="stat-card-background">
              <div className="stat-card-content">
                <div className="stat-icon-modern">💰</div>
                <div className="stat-info">
                  <div className="stat-label-modern">Saldo Atual</div>
                  <div className={`stat-value-modern ${(data.stats?.balance ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                    R$ {(data.stats?.balance ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="stat-card-modern credit-card">
            <div className="stat-card-background">
              <div className="stat-card-content">
                <div className="stat-icon-modern">💳</div>
                <div className="stat-info">
                  <div className="stat-label-modern">Cartão de Crédito</div>
                  <div className="stat-value-modern credit">
                    R$ {(data.creditCardTotal ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="stats-row">
          <div className="stat-card-modern income-card">
            <div className="stat-card-background">
              <div className="stat-card-content">
                <div className="stat-icon-modern">📈</div>
                <div className="stat-info">
                  <div className="stat-label-modern">Receitas</div>
                  <div className="stat-value-modern income">
                    R$ {(data.stats?.income ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="stat-card-modern expense-card">
            <div className="stat-card-background">
              <div className="stat-card-content">
                <div className="stat-icon-modern">📉</div>
                <div className="stat-info">
                  <div className="stat-label-modern">Despesas</div>
                  <div className="stat-value-modern expense">
                    R$ {(data.stats?.expense ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cartões - Visualização ACIMA das transações */}
      <div className="dashboard-cards-section">
        <div className="transactions-container-enhanced">
          <div className="transactions-header">
            <h3>Meus Cartões</h3>
          </div>
          <div className="cards-grid-dashboard">
            {creditCards.length > 0 ? (
              creditCards.map((card) => {
                console.log('🔍 DEBUG CARTÃO:', {
                  cardName: card.name,
                  selectedMonth,
                  selectedYear,
                  totalTransactions: transactions.length,
                  creditTransactions: transactions.filter(t => t.paymentMethod === 'credito').length
                });
                
                const expenses = calculateDashboardCardExpensesByMonth(card.name, selectedMonth, selectedYear);
                const committed = calculateDashboardCommittedBalance(card.name);
                const currentBalance = calculateCurrentBalance(card.name); // Saldo já lançado
                const pendingAmount = calculateDashboardPendingAmount(card.name); // A ser lançado
                
                console.log('💰 VALORES CALCULADOS:', {
                  cardName: card.name,
                  currentBalance: currentBalance, // Já lançado
                  committed: committed, // Futuro
                  totalUsed: currentBalance + committed, // Total comprometido
                  limit: card.limit
                });
                
                const currentPercentage = card.limit > 0 ? ((currentBalance || 0) / card.limit) * 100 : 0;
                const committedPercentage = card.limit > 0 ? ((committed || 0) / card.limit) * 100 : 0;
                const totalPercentage = Math.min(currentPercentage + committedPercentage, 100);
                const availableLimit = Math.max(0, card.limit - currentBalance - committed);

                return (
                  <div key={card._id} className="credit-card-simple">
                    <div 
                      className={`card-content-simple ${getBrandClass(card.flag)}`}
                      onClick={() => openCardModal(card)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-header-simple">
                        <div className="card-name-header">
                          <h3 className="card-name-top">{card.name}</h3>
                          {pendingAmount > 0 && (
                            <div className="pending-indicator-dashboard">
                              <span className="pending-label">A ser lançado</span>
                              <span className="pending-value">R$ {pendingAmount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="card-financial-data">
                        <div className="financial-row">
                          <div className="financial-item">
                            <span className="financial-label">Limite Total</span>
                            <span className="financial-value">R$ {(card.limit || 0).toFixed(2)}</span>
                          </div>
                          <div className="financial-item">
                            <span className="financial-label">💳 Gasto do Mês</span>
                            <span className="financial-value expense">R$ {currentBalance.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="financial-row">
                          <div className="financial-item">
                            <span className="financial-label">⏳ Parcelas Futuras</span>
                            <span className="financial-value committed">R$ {committed.toFixed(2)}</span>
                          </div>
                          <div className="financial-item">
                            <span className="financial-label">✅ Disponível</span>
                            <span className="financial-value available">R$ {availableLimit.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                        
                      {card.limit > 0 && (
                        <div className="usage-bar-simple">
                          <div className="usage-info-simple">
                            <span>💳 Gasto: {currentPercentage.toFixed(1)}% • ⏳ Parcelas: {committedPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="progress-bar-simple">
                            <div 
                              className={`progress-fill-simple current ${currentPercentage > 80 ? 'danger' : currentPercentage > 60 ? 'warning' : 'normal'}`}
                              style={{ width: `${currentPercentage}%` }}
                            />
                            <div 
                              className="progress-fill-simple committed"
                              style={{ 
                                width: `${committedPercentage}%`,
                                marginLeft: `${currentPercentage}%`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="card-footer-simple">
                        <div className="card-holder-info">
                          <div className="card-number-simple">**** **** **** {card.lastDigits || '0000'}</div>
                          <div className="card-holder-name">{card.holderName || 'PORTADOR'}</div>
                        </div>
                        <div className="card-brand-info">
                          <span className="brand-name">{getCardFlag(card.flag)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-transactions-enhanced">
                <div className="empty-state-icon">💳</div>
                <h3>Nenhum cartão cadastrado</h3>
                <p>Você ainda não possui cartões de crédito cadastrados</p>
                <button 
                  className="btn-add-enhanced"
                  onClick={() => navigate('/cartoes')}
                >
                  ➕ Cadastrar Primeiro Cartão
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meus Bancos */}
      <div className="recent-transactions">
        <div className="transactions-container-enhanced">
          <div className="transactions-header">
            <h3>Meus Bancos</h3>
            <span className="section-count">{banks.length}</span>
          </div>
          
          {banks.length > 0 ? (
            <div className="cards-grid">
              {banks.map((bank) => {
                // Calcular saldo baseado nas transações do mês selecionado (usar função corrigida)
                const balance = calculateBankBalance(bank.name);
                
                // Calcular receitas e despesas do mês selecionado (usar funções corrigidas)
                const income = calculateBankIncome(bank.name);
                const expenses = calculateBankExpenses(bank.name);
                
                const monthTransactions = getBankTransactionsByMonth(bank.name, selectedMonth - 1, selectedYear);
                const transactionCount = monthTransactions.length;
                
                return (
                  <div key={bank._id} className="credit-card-simple" onClick={() => openBankModal(bank)} style={{ cursor: 'pointer' }}>
                    <div className="card-content-simple bank-card">
                      <div className="card-header-simple">
                        <div className="card-name-header">
                          <h3 className="card-name-top">🏦 {bank.name}</h3>
                          <small style={{ color: '#666', fontSize: '0.8em' }}>Clique para ver extrato</small>
                        </div>
                      </div>

                      <div className="card-financial-data">
                        <div className="financial-row">
                          <div className="financial-item">
                            <span className="financial-label">Saldo Período</span>
                            <span className={`financial-value ${balance >= 0 ? 'income' : 'expense'}`}>
                              R$ {balance.toFixed(2)}
                            </span>
                          </div>
                          <div className="financial-item">
                            <span className="financial-label">Transações</span>
                            <span className="financial-value">{transactionCount}</span>
                          </div>
                        </div>
                        <div className="financial-row">
                          <div className="financial-item">
                            <span className="financial-label">Receitas</span>
                            <span className="financial-value income">R$ {income.toFixed(2)}</span>
                          </div>
                          <div className="financial-item">
                            <span className="financial-label">Despesas</span>
                            <span className="financial-value expense">R$ {expenses.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="card-footer-simple">
                        <div className="card-holder-info">
                          <div className="card-number-simple">Conta {bank.accountType || 'Corrente'}</div>
                          <div className="card-holder-name">{bank.holderName || 'TITULAR'}</div>
                        </div>
                        <div className="card-brand-info">
                          <span className="brand-name">BANCO</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-transactions-enhanced">
              <div className="empty-state-icon">🏦</div>
              <h3>Nenhum banco cadastrado</h3>
              <p>Vá para a página "Bancos" para adicionar suas contas bancárias</p>
            </div>
          )}
        </div>
      </div>

      {/* Transações Recentes */}
      <div className="recent-transactions">
        <div className="transactions-container-enhanced">
          <div className="transactions-header">
            <h3>Transações Recentes</h3>
          </div>
          <div className="transactions-list-enhanced">
            {data.recentTransactions && data.recentTransactions.length > 0 ? (
              data.recentTransactions.slice(0, 6).map((transaction) => {
                // Função para obter ícone da categoria
                const getCategoryIcon = (category, type) => {
                  const categoryIcons = {
                    'alimentacao': '🍽️', 'comida': '🍽️', 'restaurante': '🍽️', 'lanche': '🍿',
                    'transporte': '🚗', 'combustivel': '⛽', 'uber': '🚕', 'onibus': '🚌',
                    'saude': '🏥', 'medicina': '💊', 'dentista': '🦷', 'farmacia': '💊',
                    'educacao': '📚', 'curso': '🎓', 'livro': '📖', 'escola': '🏫',
                    'lazer': '🎬', 'cinema': '🎬', 'viagem': '✈️', 'festa': '🎉',
                    'casa': '🏠', 'moradia': '🏠', 'aluguel': '🏠', 'condominio': '🏢',
                    'trabalho': '💼', 'salario': '💰', 'salário': '💰', 'freelance': '💻',
                    'investimento': '📈', 'venda': '💵', 'compras': '🛍️', 'shopping': '🛍️',
                    'outros': '💳', 'diversos': '💳'
                  };
                  return categoryIcons[category?.toLowerCase()] || (type === 'income' ? '💰' : '💳');
                };

                return (
                  <div key={transaction._id} className="transaction-item-extract">
                    <div className="extract-date">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="extract-main">
                      <div className="extract-description">
                        <div className="description-line">
                          <strong>{transaction.description}</strong>
                          {transaction.isInstallment && (
                            <span className="installment-badge">
                              {transaction.installmentNumber}/{transaction.totalInstallments}
                            </span>
                          )}
                          {(transaction.isFixed || transaction.isRecurring || transaction.recurringParentId) && (
                            <span className="fixed-badge" style={{
                              backgroundColor: '#28a745',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              marginLeft: '8px'
                            }}>FIXA</span>
                          )}
                          {transaction.isVirtualFixed && (
                            <span className="virtual-fixed">FIXA (AUTO)</span>
                          )}
                        </div>
                        <div className="category-line">
                          {getCategoryIcon(transaction.category, transaction.type)} {transaction.category}
                          {transaction.paymentMethod === 'credito' && transaction.creditCard && 
                            ` • 💳 ${transaction.creditCard}`
                          }
                          {transaction.paymentMethod === 'debito' && transaction.bank && 
                            ` • 🏦 ${transaction.bank}`
                          }
                          {transaction.paymentMethod === 'pix' && 
                            ' • 📱 PIX'
                          }
                          {transaction.paymentMethod === 'dinheiro' && 
                            ' • 💵 Dinheiro'
                          }
                        </div>
                        {transaction.notes && (
                          <div className="notes-line">
                            📝 {transaction.notes}
                          </div>
                        )}
                      </div>
                      <div className={`extract-amount ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '-'}R$ {(transaction.amount || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-transactions-enhanced">
                <div className="empty-state-icon">📊</div>
                <h3>Nenhuma transação encontrada</h3>
                <p>Este mês ainda não possui movimentações financeiras</p>
                <button 
                  className="btn-add-enhanced"
                  onClick={openModal}
                >
                  ➕ Adicionar Primeira Transação
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Transações do Cartão */}
      {showCardModal && selectedCardForModal && (
        <div className="modal-overlay card-modal-overlay" onClick={() => setShowCardModal(false)}>
          <div className="modal-content card-transactions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💳 {selectedCardForModal.name}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCardModal(false)}
              >
                ×
              </button>
            </div>

            {/* Navegação de Mês */}
            <div className="month-navigation">
              <button 
                className="month-nav-btn prev"
                onClick={goToPreviousMonth}
                title="Mês anterior"
              >
                ‹
              </button>
              <div className="current-month-display">
                <h4>{getDashboardMonthName(currentModalMonth)} {currentModalYear}</h4>
              </div>
              <button 
                className="month-nav-btn next"
                onClick={goToNextMonth}
                title="Próximo mês"
              >
                ›
              </button>
            </div>
            
            <div className="modal-body">
              {/* Estatísticas do Cartão */}
              <div className="card-modal-stats">
                <div className="modal-stat-grid">
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">💳 Gasto do Mês</div>
                    <div className="modal-stat-value expense">
                      R$ {calculateCurrentBalance(selectedCardForModal.name).toFixed(2)}
                    </div>
                  </div>
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">⏳ Parcelas Futuras do Mês</div>
                    <div className="modal-stat-value committed">
                      R$ {calculateDashboardCommittedBalance(selectedCardForModal.name).toFixed(2)}
                    </div>
                  </div>
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">✅ Disponível no Limite</div>
                    <div className="modal-stat-value available">
                      R$ {Math.max(0, (selectedCardForModal.limit || 0) - 
                          calculateCurrentBalance(selectedCardForModal.name) - 
                          calculateDashboardCommittedBalance(selectedCardForModal.name)).toFixed(2)}
                    </div>
                  </div>
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">Transações neste mês</div>
                    <div className="modal-stat-value">
                      {getDashboardCardTransactionsByMonth(selectedCardForModal.name, currentModalMonth, currentModalYear).length}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-transactions-list">
                <h4>📋 Extrato de {getDashboardMonthName(currentModalMonth)} {currentModalYear}</h4>
                {getDashboardCardTransactionsByMonth(selectedCardForModal.name, currentModalMonth, currentModalYear).length === 0 ? (
                  <div className="no-transactions-modal">
                    <p>📋 Nenhuma transação encontrada para este mês</p>
                    <p className="hint-text">Use os botões ‹ › para navegar entre os meses</p>
                  </div>
                ) : (
                  <div className="transactions-list-modal">
                    {getDashboardCardTransactionsByMonth(selectedCardForModal.name, currentModalMonth, currentModalYear).map((transaction, index) => {
                      // Função para obter ícone da categoria
                      const getCategoryIcon = (category, type) => {
                        const categoryIcons = {
                          'alimentacao': '🍽️', 'comida': '🍽️', 'restaurante': '🍽️', 'lanche': '🍿',
                          'transporte': '🚗', 'combustivel': '⛽', 'uber': '🚕', 'onibus': '🚌',
                          'saude': '🏥', 'medicina': '💊', 'dentista': '🦷', 'farmacia': '💊',
                          'educacao': '📚', 'curso': '🎓', 'livro': '📖', 'escola': '🏫',
                          'lazer': '🎬', 'cinema': '🎬', 'viagem': '✈️', 'festa': '🎉',
                          'casa': '🏠', 'moradia': '🏠', 'aluguel': '🏠', 'condominio': '🏢',
                          'trabalho': '💼', 'salario': '💰', 'salário': '💰', 'freelance': '💻',
                          'investimento': '📈', 'venda': '💵', 'compras': '🛍️', 'shopping': '🛍️',
                          'outros': '💳', 'diversos': '💳'
                        };
                        return categoryIcons[category?.toLowerCase()] || (type === 'income' ? '💰' : '💳');
                      };

                      // Verificar se a transação já foi lançada
                      const today = new Date();
                      today.setHours(23, 59, 59, 999); // Fim do dia atual
                      const transactionDate = new Date(transaction.date);
                      transactionDate.setHours(0, 0, 0, 0); // Início do dia da transação
                      const isLaunched = transactionDate <= today;

                      return (
                        <div key={transaction._id || index} className={`transaction-item-extract ${!isLaunched ? 'future-transaction' : 'launched-transaction'}`}>
                          <div className="extract-date">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                            {!isLaunched && <span className="status-badge future">⏳ A SER LANÇADA</span>}
                            {isLaunched && <span className="status-badge launched">✅ LANÇADA</span>}
                          </div>
                          <div className="extract-main">
                            <div className="extract-description">
                              <div className="description-line">
                                <strong>{transaction.description}</strong>
                                {transaction.isInstallment && (
                                  <span className="installment-badge">
                                    {transaction.installmentNumber}/{transaction.totalInstallments}
                                  </span>
                                )}
                                {(transaction.isFixed || transaction.isRecurring || transaction.recurringParentId) && (
                                  <span className="fixed-badge">FIXA</span>
                                )}
                                {transaction.isVirtualFixed && (
                                  <span className="virtual-fixed">FIXA (AUTO)</span>
                                )}
                              </div>
                              <div className="category-line">
                                {getCategoryIcon(transaction.category, transaction.type)} {transaction.category}
                                {transaction.paymentMethod === 'credito' && transaction.creditCard && 
                                  ` • 💳 ${transaction.creditCard}`
                                }
                                {transaction.paymentMethod === 'debito' && transaction.bank && 
                                  ` • 🏦 ${transaction.bank}`
                                }
                              </div>
                              {transaction.notes && (
                                <div className="notes-line">
                                  📝 {transaction.notes}
                                </div>
                              )}
                            </div>
                            <div className="extract-amount">
                              -R$ {transaction.amount?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Extrato de Banco */}
      {showBankModal && selectedBankForModal && (
        <div className="modal-overlay card-modal-overlay" onClick={() => setShowBankModal(false)}>
          <div className="modal-content card-transactions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏦 {selectedBankForModal.name}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowBankModal(false)}
              >
                ×
              </button>
            </div>

            <div className="month-navigation">
              <button 
                className="month-nav-btn prev"
                onClick={goToPreviousBankMonth}
                title="Mês anterior"
              >
                ‹
              </button>
              <div className="current-month-display">
                <h4>{getBankMonthName(currentBankModalMonth)} {currentBankModalYear}</h4>
              </div>
              <button 
                className="month-nav-btn next"
                onClick={goToNextBankMonth}
                title="Próximo mês"
              >
                ›
              </button>
            </div>

            <div className="modal-body">
              <div className="card-modal-stats">
                <div className="modal-stat-grid">
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">Entradas neste mês</div>
                    <div className="modal-stat-value income">
                      R$ {getBankTransactionsByMonth(selectedBankForModal.name, currentBankModalMonth, currentBankModalYear)
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">Saídas neste mês</div>
                    <div className="modal-stat-value expense">
                      R$ {getBankTransactionsByMonth(selectedBankForModal.name, currentBankModalMonth, currentBankModalYear)
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">Número de transações</div>
                    <div className="modal-stat-value">
                      {getBankTransactionsByMonth(selectedBankForModal.name, currentBankModalMonth, currentBankModalYear).length}
                    </div>
                  </div>
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">Saldo do mês</div>
                    <div className="modal-stat-value">
                      R$ {(getBankTransactionsByMonth(selectedBankForModal.name, currentBankModalMonth, currentBankModalYear)
                        .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-transactions-list">
                <h4>📋 Extrato de {getBankMonthName(currentBankModalMonth)} {currentBankModalYear}</h4>
                {getBankTransactionsByMonth(selectedBankForModal.name, currentBankModalMonth, currentBankModalYear).length === 0 ? (
                  <div className="no-transactions-modal">
                    <p>📋 Nenhuma transação encontrada para este mês</p>
                    <p className="hint-text">Use os botões ‹ › para navegar entre os meses</p>
                  </div>
                ) : (
                  <div className="transactions-list-modal">
                    {getBankTransactionsByMonth(selectedBankForModal.name, currentBankModalMonth, currentBankModalYear).map((transaction, index) => {
                      const getCategoryIcon = (category, type) => {
                        const categoryIcons = {
                          'alimentacao': '🍽️', 'comida': '🍽️', 'restaurante': '🍽️', 'lanche': '🍿',
                          'transporte': '🚗', 'combustivel': '⛽', 'uber': '🚕', 'onibus': '🚌',
                          'saude': '🏥', 'medicina': '💊', 'dentista': '🦷', 'farmacia': '💊',
                          'educacao': '📚', 'curso': '🎓', 'livro': '📖', 'escola': '🏫',
                          'lazer': '🎬', 'cinema': '🎬', 'viagem': '✈️', 'festa': '🎉',
                          'casa': '🏠', 'moradia': '🏠', 'aluguel': '🏠', 'condominio': '🏢',
                          'trabalho': '💼', 'salario': '💰', 'salário': '💰', 'freelance': '💻',
                          'investimento': '📈', 'venda': '💵', 'compras': '🛍️', 'shopping': '🛍️',
                          'outros': '💳', 'diversos': '💳'
                        };
                        return categoryIcons[category?.toLowerCase()] || (type === 'income' ? '💰' : '💳');
                      };

                      return (
                        <div key={transaction._id || index} className="transaction-item-extract">
                          <div className="extract-date">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="extract-main">
                            <div className="extract-description">
                              <div className="description-line">
                                <strong>{transaction.description}</strong>
                                {renderTransactionBadges(transaction)}
                              </div>
                              <div className="category-line">
                                {getCategoryIcon(transaction.category, transaction.type)} {transaction.category}
                                {transaction.paymentMethod === 'credito' && transaction.creditCard && 
                                  ` • 💳 ${transaction.creditCard}`
                                }
                                {transaction.paymentMethod === 'debito' && transaction.bank && 
                                  ` • 🏦 ${transaction.bank}`
                                }
                              </div>
                              {transaction.notes && (
                                <div className="notes-line">
                                  📝 {transaction.notes}
                                </div>
                              )}
                            </div>
                            <div className="extract-amount">
                              {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal de Nova Transação
const AddTransactionModal = ({ onSave, onCancel, creditCards = [] }) => {
  const today = new Date().toISOString().split('T')[0];
  const [banks, setBanks] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    date: today,
    paymentMethod: 'pix',
    isRecurring: false,
    isInstallment: false,
    installmentNumber: 0,
    totalInstallments: 2,
    bank: '',
    creditCard: ''
  });

  // Carregar bancos ao abrir o modal
  useEffect(() => {
    const loadBanks = async () => {
      try {
        const response = await axios.get('/banks');
        setBanks(response.data || []);
      } catch (error) {
        // Não logar cancelamento como erro
        if (error.name === 'CanceledError' || 
            error.code === 'ERR_CANCELED' || 
            error.name === 'AbortError' ||
            error.message === 'canceled') {
          return;
        }
        console.error('Erro ao carregar bancos:', error);
        setBanks([]);
      }
    };
    
    loadBanks();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validar banco para débito/PIX
    if ((formData.paymentMethod === 'debito' || formData.paymentMethod === 'pix') && !formData.bank) {
      alert('Por favor, selecione um banco para débito/PIX');
      return;
    }

    // Validar cartão para crédito
    if (formData.paymentMethod === 'credito' && !formData.creditCard) {
      alert('Por favor, selecione um cartão de crédito');
      return;
    }

    // Converte o valor formatado de volta para número
    const numericAmount = parseFloat(formData.amount.replace(/\./g, '').replace(',', '.'));

    const transactionData = {
      ...formData,
      amount: numericAmount
    };

    onSave(transactionData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCurrency = (value) => {
    let numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const numericValue = parseInt(numbers, 10);
    if (numericValue === 0) return '0,00';
    numbers = numericValue.toString();
    if (numbers.length === 1) {
      return `0,0${numbers}`;
    }
    if (numbers.length === 2) {
      return `0,${numbers}`;
    }
    const reais = numbers.slice(0, -2);
    const centavos = numbers.slice(-2);
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
    <div className="modal-overlay-focused" onClick={onCancel}>
      <div className="modal-content edit-transaction-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>➕ Nova Transação</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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
                        isInstallment: false
                      }));
                    }
                  }}
                >
                  📱 PIX
                </button>
              </div>
            </div>

            {(formData.paymentMethod === 'debito' || formData.paymentMethod === 'pix') && (
              <div className="form-group">
                <label>Banco *</label>
                <select
                  name="bank"
                  value={formData.bank}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione o banco</option>
                  {banks.map((bank) => (
                    <option key={bank._id} value={bank.name}>
                      🏦 {bank.name}
                    </option>
                  ))}
                  {banks.length === 0 && (
                    <option value="" disabled>Nenhum banco cadastrado</option>
                  )}
                </select>
                {banks.length === 0 && (
                  <small className="hint-text">
                    � Vá para a página "Bancos" para cadastrar suas contas bancárias
                  </small>
                )}
              </div>
            )}

            {formData.paymentMethod === 'credito' && (
              <div className="form-group">
                <label>Cartão de Crédito *</label>
                <select
                  name="creditCard"
                  value={formData.creditCard}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione o cartão</option>
                  <option value="BB Visa">BB Visa (Banco do Brasil)</option>
                  <option value="BB Mastercard">BB Mastercard (Banco do Brasil)</option>
                  <option value="BB Elo">BB Elo (Banco do Brasil)</option>
                  <option value="Bradesco Visa">Bradesco Visa</option>
                  <option value="Bradesco Mastercard">Bradesco Mastercard</option>
                  <option value="Bradesco Elo">Bradesco Elo</option>
                  <option value="Caixa Visa">Caixa Visa</option>
                  <option value="Caixa Mastercard">Caixa Mastercard</option>
                  <option value="Caixa Elo">Caixa Elo</option>
                  <option value="Itaú Visa">Itaú Visa</option>
                  <option value="Itaú Mastercard">Itaú Mastercard</option>
                  <option value="Itaú Elo">Itaú Elo</option>
                  <option value="Santander Visa">Santander Visa</option>
                  <option value="Santander Mastercard">Santander Mastercard</option>
                  <option value="Nubank Mastercard">Nubank Mastercard</option>
                  <option value="Inter Mastercard">Inter Mastercard</option>
                  <option value="Inter Visa">Inter Visa</option>
                  <option value="C6 Mastercard">C6 Mastercard</option>
                  <option value="BTG Black">BTG Black</option>
                  <option value="BTG Mastercard">BTG Mastercard</option>
                  <option value="Next Mastercard">Next Mastercard</option>
                  <option value="PagBank Visa">PagBank Visa</option>
                  <option value="PicPay Visa">PicPay Visa</option>
                  <option value="Mercado Pago Mastercard">Mercado Pago Mastercard</option>
                  <option value="Mercado Pago Visa">Mercado Pago Visa</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            )}

            <div className="form-row">
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
                    <option value="Vendas">Vendas</option>
                    <option value="Aluguel Recebido">Aluguel Recebido</option>
                    <option value="Dividendos">Dividendos</option>
                    <option value="Cashback">Cashback</option>
                    <option value="Rendimentos">Rendimentos</option>
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
                    <option value="Compras">Compras</option>
                    <option value="Vestuário">Vestuário</option>
                    <option value="Beleza">Beleza</option>
                    <option value="Casa">Casa</option>
                    <option value="Mercado">Mercado</option>
                    <option value="Farmácia">Farmácia</option>
                    <option value="Gasolina">Gasolina</option>
                    <option value="Uber/99">Uber/99</option>
                    <option value="Streaming">Streaming</option>
                    <option value="Academia">Academia</option>
                    <option value="Pets">Pets</option>
                    <option value="Viagem">Viagem</option>
                    <option value="Restaurante">Restaurante</option>
                    <option value="Ifood/Delivery">Ifood/Delivery</option>
                    <option value="Internet">Internet</option>
                    <option value="Celular">Celular</option>
                    <option value="Energia">Energia</option>
                    <option value="Água">Água</option>
                    <option value="Condomínio">Condomínio</option>
                    <option value="Aluguel">Aluguel</option>
                    <option value="Financiamento">Financiamento</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Empréstimo">Empréstimo</option>
                    <option value="Impostos">Impostos</option>
                    <option value="Seguro">Seguro</option>
                    <option value="Investimentos">Investimentos</option>
                    <option value="Poupança">Poupança</option>
                    <option value="Presentes">Presentes</option>
                    <option value="Doações">Doações</option>
                    <option value="Outros">Outros</option>
                  </>
                )}
              </select>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    isRecurring: e.target.checked,
                    isInstallment: e.target.checked ? false : prev.isInstallment
                  }))}
                />
                <span className="checkbox-text">Transação Fixa (repete todos os meses)</span>
              </label>
            </div>

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
                    paymentMethod: (e.target.checked && prev.paymentMethod === 'pix') ? 'debito' : prev.paymentMethod
                  }))}
                />
                <span className="checkbox-text">Parcelado (crédito/débito apenas)</span>
              </label>
            </div>

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

// Página Todas Transações
const AllTransactionsPage = () => {
  const { openModal, refreshTrigger, triggerRefresh } = useContext(NewTransactionContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfirmDeleteAllModal, setShowConfirmDeleteAllModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'debit_pix', 'credit'

  // Estados para controle de loading e cancelamento de requests
  const [isLoadingData, setIsLoadingData] = useState(false);
  const loadingRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastLoadParamsRef = useRef(null);

  const loadTransactions = useCallback(async (month = selectedMonth, year = selectedYear) => {
    // Chave única para a requisição
    const requestKey = `alltransactions-${month}-${year}`;
    const currentParams = `${month}-${year}`;
    
    // Se já está carregando os MESMOS dados, não fazer nada
    if (loadingRef.current === requestKey) {
      return;
    }
    
    // Cancelar apenas se for requisição DIFERENTE
    if (abortControllerRef.current && loadingRef.current && loadingRef.current !== requestKey) {
      console.log('⏹️ Cancelando requisição anterior (nova solicitação)');
      abortControllerRef.current.abort();
    }
    
    loadingRef.current = requestKey;
    abortControllerRef.current = new AbortController();
    setIsLoadingData(true);
    
    try {
      const response = await axios.get(`/transactions?month=${month}&year=${year}`, {
        signal: abortControllerRef.current.signal
      });
      
      // Processar apenas se ainda é a requisição ativa
      if (loadingRef.current === requestKey) {
        const monthTransactions = response.data || [];
        setTransactions(monthTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
        lastLoadParamsRef.current = currentParams;
      }
      
    } catch (error) {
      // CORREÇÃO PRINCIPAL: Não logar cancelamento como erro
      if (error.name === 'CanceledError' || 
          error.code === 'ERR_CANCELED' || 
          error.name === 'AbortError' ||
          error.message === 'canceled') {
        console.log('🚫 Requisição cancelada - operação normal');
        return; // Sair silenciosamente
      }
      
      // Só logar erros reais
      console.error('❌ Erro real ao carregar transações:', error);
      if (loadingRef.current === requestKey) {
        setTransactions([]);
      }
    } finally {
      if (loadingRef.current === requestKey) {
        setIsLoadingData(false);
        setLoading(false);
        loadingRef.current = null;
      }
    }
  }, [selectedMonth, selectedYear]); // REMOVIDO isLoadingData das dependências

  const handleMonthChange = useCallback((month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    loadTransactions(month, year);
  }, [loadTransactions]);

  const handleEditTransaction = useCallback(async (transactionData) => {
    try {
      await axios.put(`/transactions/${editingTransaction._id}`, transactionData);
      
      setShowEditModal(false);
      setEditingTransaction(null);
      alert('Transação editada com sucesso!');
      
      // Recarregar transações para garantir sincronização
      loadTransactions();
    } catch (error) {
      console.error('Erro ao editar transação:', error);
      alert('Erro ao editar transação');
    }
  }, [editingTransaction, loadTransactions]);

  const handleDeleteTransaction = useCallback(async (deleteAll = false) => {
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
  }, [transactionToDelete, loadTransactions]);

  // useEffect para carregamento inicial (apenas uma vez)
  useEffect(() => {
    console.log('🚀 AllTransactionsPage: Carregamento inicial');
    const debounceTimer = setTimeout(() => {
      loadTransactions();
    }, 100); // Pequeno delay para estabilizar

    return () => clearTimeout(debounceTimer);
  }, []); // Sem dependências para carregar apenas uma vez

  // useEffect para mudanças de período (com debounce)
  useEffect(() => {
    // Só reagir se não for o carregamento inicial
    if (lastLoadParamsRef.current) {
      console.log('📅 AllTransactionsPage: Mudança de período detectada');
      const debounceTimer = setTimeout(() => {
        loadTransactions();
      }, 300); // 300ms debounce

      return () => clearTimeout(debounceTimer);
    }
  }, [selectedMonth, selectedYear]); // Sem loadTransactions para evitar loop

  // useEffect para refreshTrigger (recarregamento forçado)
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 AllTransactionsPage: Refresh trigger acionado:', refreshTrigger);
      console.log('📋 AllTransactionsPage: Atualizando lista após nova transação');
      const debounceTimer = setTimeout(() => {
        loadTransactions();
      }, 100);

      return () => clearTimeout(debounceTimer);
    }
  }, [refreshTrigger]); // Sem outras dependências

  // Cleanup: cancelar requisições pendentes quando o componente desmontar
  useEffect(() => {
    return () => {
      console.log('🧹 AllTransactionsPage: Limpeza do componente');
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (loadingRef.current) {
        loadingRef.current = null;
      }
    };
  }, []);

  // Função para filtrar transações por tipo de pagamento
  const getFilteredTransactions = () => {
    if (paymentFilter === 'all') {
      return transactions;
    } else if (paymentFilter === 'debit_pix') {
      return transactions.filter(t => t.paymentMethod === 'debito' || t.paymentMethod === 'pix');
    } else if (paymentFilter === 'credit') {
      return transactions.filter(t => t.paymentMethod === 'credito');
    }
    return transactions;
  };

  if (loading) {
    return <div className="page loading">Carregando transações...</div>;
  }

  return (
    <div className="page">
      <PageHeaderWithMonthSelector 
        title="Todas Transações"
        icon="📊"
        subtitle="Gerenciar todas as transações do período"
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={handleMonthChange}
      />

      {/* Filtro de tipo de pagamento */}
      <div className="payment-filter-container">
        <div className="filter-group">
          <label>Filtrar por tipo:</label>
          <select 
            value={paymentFilter} 
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos</option>
            <option value="debit_pix">Débito/PIX</option>
            <option value="credit">Crédito</option>
          </select>
        </div>
      </div>

      {/* Lista de transações */}
      <div className="transactions-container-enhanced">
        {transactions.length === 0 ? (
          <div className="no-transactions-enhanced">
            <div className="empty-state-icon">📊</div>
            <h3>Nenhuma transação encontrada</h3>
            <p>Este mês ainda não possui movimentações financeiras</p>
            <button 
              className="btn-add-enhanced"
              onClick={openModal}
            >
              ➕ Adicionar Primeira Transação
            </button>
          </div>
        ) : (
          <div className="transactions-list-enhanced">
            {getFilteredTransactions().map(transaction => {
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
                <div key={transaction._id} className="transaction-item-extract">
                  <div className="extract-date">
                    {new Date(transaction.date).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="extract-main">
                    <div className="extract-description">
                      <div className="description-line">
                        <strong>{transaction.description}</strong>
                        {transaction.isInstallment && (
                          <span className="installment-badge">
                            {transaction.installmentNumber}/{transaction.totalInstallments}
                          </span>
                        )}
                        {(transaction.isFixed || transaction.isRecurring || transaction.recurringParentId) && (
                          <span className="fixed-badge">FIXA</span>
                        )}
                        {transaction.isVirtualFixed && (
                          <span className="virtual-fixed">FIXA (AUTO)</span>
                        )}
                      </div>
                      <div className="category-line">
                        {getIconForCategory(transaction.category, transaction.type)} {transaction.category}
                        {transaction.paymentMethod === 'credito' && transaction.creditCard && 
                          ` • 💳 ${transaction.creditCard}`
                        }
                        {transaction.paymentMethod === 'debito' && transaction.bank && 
                          ` • 🏦 ${transaction.bank}`
                        }
                        {transaction.paymentMethod === 'pix' && 
                          ' • 📱 PIX'
                        }
                        {transaction.paymentMethod === 'dinheiro' && 
                          ' • 💵 Dinheiro'
                        }
                      </div>
                      {transaction.notes && (
                        <div className="notes-line">
                          📝 {transaction.notes}
                        </div>
                      )}
                    </div>
                    <div className={`extract-amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}R$ {(transaction.amount || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="transaction-actions-enhanced">
                    <button
                      className="action-btn-enhanced edit"
                      onClick={() => {
                        setEditingTransaction(transaction);
                        setShowEditModal(true);
                      }}
                      title="Editar transação"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn-enhanced delete"
                      onClick={() => {
                        setTransactionToDelete(transaction);
                        setShowDeleteModal(true);
                      }}
                      title="Excluir transação"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && transactionToDelete && (
        <div className="modal-overlay-focused" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content edit-card-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Confirmar Exclusão</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-confirmation-content">
                <div className="warning-icon">⚠️</div>
                
                {/* Transação Recorrente */}
                {(transactionToDelete.recurringParentId || transactionToDelete.isRecurring) && (
                  <>
                    <p className="delete-message">Esta transação se repete mensalmente. O que deseja fazer?</p>
                    <div className="transaction-preview-delete">
                      <div className="transaction-info-delete">
                        <span className="transaction-icon-delete">🔄</span>
                        <div className="transaction-details-delete">
                          <strong className="transaction-name-delete">{transactionToDelete.description}</strong>
                          <span className={`transaction-amount-delete ${transactionToDelete.type}`}>
                            {transactionToDelete.type === 'income' ? '+' : '-'}R$ {(transactionToDelete.amount || 0).toFixed(2)}
                          </span>
                          <span className="transaction-date-delete">
                            {new Date(transactionToDelete.date).toLocaleDateString('pt-BR')} • {transactionToDelete.paymentMethod || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Transação Parcelada */}
                {!(transactionToDelete.recurringParentId || transactionToDelete.isRecurring) && 
                 (transactionToDelete.installmentParentId || transactionToDelete.isInstallment || 
                  (transactionToDelete.installmentNumber > 0 && transactionToDelete.totalInstallments > 1)) && (
                  <>
                    <p className="delete-message">
                      {transactionToDelete.installmentNumber > 0 ? 
                        `Parcela ${transactionToDelete.installmentNumber} de ${transactionToDelete.totalInstallments}. O que deseja fazer?` :
                        'Esta transação está parcelada. O que deseja fazer?'
                      }
                    </p>
                    <div className="transaction-preview-delete">
                      <div className="transaction-info-delete">
                        <span className="transaction-icon-delete">📊</span>
                        <div className="transaction-details-delete">
                          <strong className="transaction-name-delete">{transactionToDelete.description}</strong>
                          <span className={`transaction-amount-delete ${transactionToDelete.type}`}>
                            {transactionToDelete.type === 'income' ? '+' : '-'}R$ {(transactionToDelete.amount || 0).toFixed(2)}
                          </span>
                          <span className="transaction-date-delete">
                            {new Date(transactionToDelete.date).toLocaleDateString('pt-BR')} • {transactionToDelete.paymentMethod || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Transação Comum */}
                {!(transactionToDelete.recurringParentId || transactionToDelete.isRecurring) && 
                 !(transactionToDelete.installmentParentId || transactionToDelete.isInstallment || 
                   (transactionToDelete.installmentNumber > 0 && transactionToDelete.totalInstallments > 1)) && (
                  <>
                    <p className="delete-message">Tem certeza que deseja excluir esta transação?</p>
                    <div className="transaction-preview-delete">
                      <div className="transaction-info-delete">
                        <span className="transaction-icon-delete">{transactionToDelete.type === 'income' ? '�' : '💸'}</span>
                        <div className="transaction-details-delete">
                          <strong className="transaction-name-delete">{transactionToDelete.description}</strong>
                          <span className={`transaction-amount-delete ${transactionToDelete.type}`}>
                            {transactionToDelete.type === 'income' ? '+' : '-'}R$ {(transactionToDelete.amount || 0).toFixed(2)}
                          </span>
                          <span className="transaction-date-delete">
                            {new Date(transactionToDelete.date).toLocaleDateString('pt-BR')} • {transactionToDelete.paymentMethod || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="warning-text">
                  <small>⚠️ Esta ação não pode ser desfeita.</small>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              {/* Botões para transações recorrentes */}
              {(transactionToDelete.recurringParentId || transactionToDelete.isRecurring) && (
                <>
                  <button 
                    className="btn btn-cancel"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => handleDeleteTransaction(false)}
                  >
                    Excluir só este mês
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDeleteTransaction(true)}
                  >
                    🗑️ Excluir todas
                  </button>
                </>
              )}

              {/* Botões para transações parceladas */}
              {!(transactionToDelete.recurringParentId || transactionToDelete.isRecurring) && 
               (transactionToDelete.installmentParentId || transactionToDelete.isInstallment || 
                (transactionToDelete.installmentNumber > 0 && transactionToDelete.totalInstallments > 1)) && (
                <>
                  <button 
                    className="btn btn-cancel"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => handleDeleteTransaction(false)}
                  >
                    Excluir só esta parcela
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDeleteTransaction(true)}
                  >
                    🗑️ Excluir todas as parcelas
                  </button>
                </>
              )}

              {/* Botões para transações comuns */}
              {!(transactionToDelete.recurringParentId || transactionToDelete.isRecurring) && 
               !(transactionToDelete.installmentParentId || transactionToDelete.isInstallment || 
                 (transactionToDelete.installmentNumber > 0 && transactionToDelete.totalInstallments > 1)) && (
                <>
                  <button 
                    className="btn btn-cancel"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDeleteTransaction(false)}
                  >
                    🗑️ Excluir Transação
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onSave={handleEditTransaction}
          onCancel={() => setEditingTransaction(null)}
        />
      )}
    </div>
  );
};

// Página Cartões
const CreditCardPage = () => {
  const { refreshTrigger, triggerRefresh } = useContext(NewTransactionContext);
  const [creditCards, setCreditCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'debit_pix', 'credit'

  // Estados para o modal de transações
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);
  const [currentModalMonth, setCurrentModalMonth] = useState(new Date().getMonth());
  const [currentModalYear, setCurrentModalYear] = useState(new Date().getFullYear());

  // Estados para controle de loading e cancelamento de requests
  const [isLoadingData, setIsLoadingData] = useState(false);
  const loadingRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastLoadParamsRef = useRef(null);

  // Carregar cartões e transações
  const loadData = useCallback(async (month = selectedMonth, year = selectedYear) => {
    // Chave única para a requisição
    const requestKey = `creditcards-${month}-${year}`;
    const currentParams = `${month}-${year}`;
    
    // Se já está carregando os MESMOS dados, não fazer nada
    if (loadingRef.current === requestKey) {
      return;
    }
    
    loadingRef.current = requestKey;
    setIsLoadingData(true);
    
    try {
      // Carregar cartões cadastrados
      const cardsResponse = await axios.get('/credit-cards');
      const sortedCards = (cardsResponse.data || []).sort((a, b) => {
        const dateA = new Date(a.createdAt || a._id);
        const dateB = new Date(b.createdAt || b._id);
        return dateB - dateA;
      });
      
      // Carregar transações para calcular gastos
      const transactionsResponse = await axios.get(`/transactions`);
      
      // Processar apenas se ainda é a requisição ativa
      if (loadingRef.current === requestKey) {
        setCreditCards(sortedCards);
        setTransactions(transactionsResponse.data || []);
        
        if (month !== selectedMonth) setSelectedMonth(month);
        if (year !== selectedYear) setSelectedYear(year);
        
        lastLoadParamsRef.current = currentParams;
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar cartões:', error);
      if (loadingRef.current === requestKey) {
        setCreditCards([]);
        setTransactions([]);
      }
    } finally {
      if (loadingRef.current === requestKey) {
        setIsLoadingData(false);
        setLoading(false);
        loadingRef.current = null;
      }
    }
  }, [selectedMonth, selectedYear]); // REMOVIDO isLoadingData das dependências

  const handleMonthChange = useCallback((month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    loadData(month, year);
  }, [loadData]);

  // Calcular gastos de um cartão baseado nas transações (APENAS LANÇADAS)
  const calculateCardExpenses = useCallback((cardName) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia atual
    
    const cardTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0); // Início do dia da transação
      const transactionMonth = transactionDate.getMonth() + 1;
      const transactionYear = transactionDate.getFullYear();
      
      const isCorrectCard = t.creditCard === cardName;
      const isCorrectType = t.paymentMethod === 'credito';
      const isCorrectMonth = transactionMonth === selectedMonth;
      const isCorrectYear = transactionYear === selectedYear;
      const isLaunched = transactionDate <= today; // APENAS TRANSAÇÕES JÁ LANÇADAS
      
      return isCorrectCard && isCorrectType && isCorrectMonth && isCorrectYear && isLaunched;
    });
    
    return cardTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions, selectedMonth, selectedYear]);

  // Calcular valor total A SER LANÇADO (transações futuras) do cartão no mês
  const calculatePendingCardExpenses = useCallback((cardName) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia atual
    
    const pendingTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0); // Início do dia da transação
      const transactionMonth = transactionDate.getMonth() + 1;
      const transactionYear = transactionDate.getFullYear();
      
      const isCorrectCard = t.creditCard === cardName;
      const isCorrectType = t.paymentMethod === 'credito';
      const isCorrectMonth = transactionMonth === selectedMonth;
      const isCorrectYear = transactionYear === selectedYear;
      const isPending = transactionDate > today; // APENAS TRANSAÇÕES FUTURAS
      
      return isCorrectCard && isCorrectType && isCorrectMonth && isCorrectYear && isPending;
    });
    
    return pendingTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions, selectedMonth, selectedYear]);

  // Calcular saldo atual (já lançado) do cartão no mês selecionado
  const calculateCurrentCardBalance = useCallback((cardName) => {
    if (!transactions || !Array.isArray(transactions)) return 0;
    
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia atual
    
    // Transações já lançadas do MÊS SELECIONADO
    const currentTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0); // Início do dia da transação
      const transactionMonth = transactionDate.getMonth() + 1;
      const transactionYear = transactionDate.getFullYear();
      
      return t.creditCard === cardName && 
             t.paymentMethod === 'credito' &&
             transactionMonth === selectedMonth && // APENAS MÊS SELECIONADO
             transactionYear === selectedYear &&
             transactionDate <= today; // Data atual ou passada = já lançada
    });
    
    return currentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions, selectedMonth, selectedYear]);

  // Calcular saldo comprometido (parcelamentos futuros) do cartão no mês selecionado
  const calculateCommittedCardBalance = useCallback((cardName) => {
    if (!transactions || !Array.isArray(transactions)) return 0;
    
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia atual
    
    // APENAS parcelamentos futuros do MÊS SELECIONADO
    const futureInstallments = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0); // Início do dia da transação
      const transactionMonth = transactionDate.getMonth() + 1;
      const transactionYear = transactionDate.getFullYear();
      
      return t.creditCard === cardName && 
             t.paymentMethod === 'credito' &&
             t.isInstallment && // APENAS PARCELAMENTOS
             transactionMonth === selectedMonth && // APENAS MÊS SELECIONADO
             transactionYear === selectedYear &&
             transactionDate > today; // Data futura dentro do mês
    });
    
    return futureInstallments.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions, selectedMonth, selectedYear]);

  // Calcular saldo comprometido com parcelamentos futuros
  const calculateCommittedBalance = useCallback((cardName) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia atual
    
    const futureInstallments = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0); // Início do dia da transação
      
      return t.creditCard === cardName && 
             t.paymentMethod === 'credito' &&
             t.isInstallment &&
             transactionDate > today; // Data futura = não lançada
    });
    
    return futureInstallments.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  // Função auxiliar para renderizar badges de transações na página de cartões
  const renderCardTransactionBadges = useCallback((transaction) => {
    const badges = [];
    
    // Badge de parcela
    if (transaction.isInstallment) {
      badges.push(
        <span key="installment" className="installment-badge">
          {transaction.installmentNumber}/{transaction.totalInstallments}
        </span>
      );
    }
    
    // Badge de transação fixa/recorrente
    if (transaction.isFixed || transaction.isRecurring || transaction.recurringParentId) {
      const isVirtual = transaction.isVirtual;
      badges.push(
        <span key="fixed" className={isVirtual ? "virtual-fixed-badge" : "fixed-badge"}>
          {isVirtual ? "FIXA (AUTO)" : "FIXA"}
        </span>
      );
    }
    
    return badges;
  }, []);

  // Abrir modal de transações do cartão
  const openCardModal = useCallback((card) => {
    setSelectedCardForModal(card);
    setCurrentModalMonth(new Date().getMonth());
    setCurrentModalYear(new Date().getFullYear());
    setShowCardModal(true);
  }, []);

  // Funções de navegação de mês no modal
  const goToPreviousMonth = useCallback(() => {
    if (currentModalMonth === 0) {
      setCurrentModalMonth(11);
      setCurrentModalYear(currentModalYear - 1);
    } else {
      setCurrentModalMonth(currentModalMonth - 1);
    }
  }, [currentModalMonth, currentModalYear]);

  const goToNextMonth = useCallback(() => {
    if (currentModalMonth === 11) {
      setCurrentModalMonth(0);
      setCurrentModalYear(currentModalYear + 1);
    } else {
      setCurrentModalMonth(currentModalMonth + 1);
    }
  }, [currentModalMonth, currentModalYear]);

  const getMonthName = useCallback((month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
  }, []);

  // Filtrar transações por mês/ano específico com geração de recorrentes
  const getCardTransactionsByMonth = useCallback((cardName, month, year) => {
    if (!cardName) return [];
    
    console.log('🔍 FILTRANDO TRANSAÇÕES CARTÃO (Página):', { cardName, month, year, totalTransactions: transactions?.length || 0 });
    
    // Primeiro, filtrar transações do mês específico
    const monthTransactions = transactions.filter(transaction => {
      if (transaction.paymentMethod === 'credito' && transaction.creditCard === cardName) {
        const transactionDate = new Date(transaction.date);
        const transactionMonth = transactionDate.getMonth();
        const transactionYear = transactionDate.getFullYear();
        return transactionMonth === month && transactionYear === year;
      }
      return false;
    });

    // Buscar templates recorrentes para este cartão
    const recurringTemplates = transactions.filter(transaction => {
      return transaction.isRecurring && 
             transaction.creditCard === cardName && 
             transaction.paymentMethod === 'credito';
    });

    console.log('🔄 Templates recorrentes encontrados:', recurringTemplates.length);

    // Para cada template, verificar se existe transação para o mês solicitado
    recurringTemplates.forEach(template => {
      const existingTransaction = monthTransactions.find(t => 
        t.recurringParentId === template._id
      );

      if (!existingTransaction) {
        console.log('🚀 Gerando transação recorrente virtual para:', template.description);
        
        // Determinar o dia da transação no mês
        const templateDate = new Date(template.date);
        const targetDay = Math.min(template.recurringDay || templateDate.getDate(), new Date(year, month + 1, 0).getDate());
        const virtualDate = new Date(year, month, targetDay, 12, 0, 0);

        // Criar transação virtual
        const virtualTransaction = {
          ...template,
          _id: `virtual-${template._id}-${year}-${month}`,
          date: virtualDate,
          isRecurring: false,
          isFixed: true,
          recurringParentId: template._id,
          isVirtual: true
        };

        monthTransactions.push(virtualTransaction);
        console.log('✅ Transação virtual criada:', virtualTransaction.description, virtualDate.toISOString().split('T')[0]);
      }
    });

    // Buscar transações parceladas (installments) para este cartão
    const installmentTransactions = transactions.filter(t => {
      return t.isInstallment && 
             t.creditCard === cardName && 
             t.paymentMethod === 'credito' &&
             t.parentTransactionId; // Só pegar parcelamentos filhos
    });

    console.log('💳 Parcelamentos encontrados (Página Cartão):', installmentTransactions.length);

    // Para cada parcelamento, verificar se deve aparecer no mês solicitado
    installmentTransactions.forEach(installment => {
      const installmentDate = new Date(installment.date);
      const installmentMonth = installmentDate.getMonth();
      const installmentYear = installmentDate.getFullYear();
      
      // Verificar se esta parcela pertence ao mês solicitado
      if (installmentMonth === month && installmentYear === year) {
        // Verificar se já não foi adicionada
        const existingInstallment = monthTransactions.find(t => t._id === installment._id);
        if (!existingInstallment) {
          monthTransactions.push(installment);
          console.log('✅ Parcelamento adicionado (Página Cartão):', installment.description, 
                     `${installment.installmentNumber}/${installment.totalInstallments}`);
        }
      }
    });

    return monthTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions]);

  // Calcular gastos de um mês específico (APENAS TRANSAÇÕES LANÇADAS)
  const calculateCardExpensesByMonth = useCallback((cardName, month, year) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia atual
    
    const monthTransactions = getCardTransactionsByMonth(cardName, month, year);
    const launchedTransactions = monthTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      transactionDate.setHours(0, 0, 0, 0); // Início do dia da transação
      return transactionDate <= today; // APENAS TRANSAÇÕES JÁ LANÇADAS
    });
    
    return launchedTransactions.reduce((total, transaction) => {
      return total + (transaction.amount || 0);
    }, 0);
  }, [getCardTransactionsByMonth]);

  // Adicionar novo cartão
  const handleAddCard = async (cardData) => {
    try {
      await axios.post('/credit-cards', cardData);
      setShowAddCardModal(false);
      
      // Usar apenas triggerRefresh para evitar duplicação
      // triggerRefresh já vai chamar loadData através do useEffect
      triggerRefresh(); 
      alert('Cartão adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar cartão:', error);
      alert('Erro ao adicionar cartão');
    }
  };

  // Editar cartão
  const handleEditCard = async (cardData) => {
    try {
      await axios.put(`/credit-cards/${selectedCard._id}`, cardData);
      setShowEditCardModal(false);
      setSelectedCard(null);
      
      triggerRefresh();
      alert('Cartão editado com sucesso!');
    } catch (error) {
      console.error('Erro ao editar cartão:', error);
      alert('Erro ao editar cartão');
    }
  };

  // Deletar cartão
  const handleDeleteCard = async () => {
    try {
      const cardTransactions = transactions.filter(t => t.creditCard === cardToDelete.name);
      if (cardTransactions.length > 0) {
        alert(`Não é possível deletar este cartão. Existem ${cardTransactions.length} transação(ões) vinculada(s) a ele.`);
        return;
      }

      await axios.delete(`/credit-cards/${cardToDelete._id}`);
      setShowDeleteModal(false);
      setCardToDelete(null);
      console.log('🔄 Triggering refresh after card deletion');
      triggerRefresh(); // Usar triggerRefresh em vez de loadData direto
      alert('Cartão deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar cartão:', error);
      alert('Erro ao deletar cartão');
    }
  };

  // Calcular percentual usado do limite
  const calculateUsagePercentage = useCallback((expenses, limit) => {
    if (!limit || limit <= 0) return 0;
    return Math.min((expenses / limit) * 100, 100);
  }, []);

  // useEffect para carregamento inicial
  useEffect(() => {
    // Aguardar um pouco para evitar cancelamento duplo do React StrictMode
    const timer = setTimeout(() => {
      loadData();
    }, 100);
    
    return () => {
      clearTimeout(timer);
    };
    
    // CORREÇÃO: Removido event listener customizado - usar apenas triggerRefresh do Context
    
    return () => {
      // Cleanup apenas se necessário
    };
  }, []); // Dependências vazias para executar apenas na montagem

  // Escutar mudanças no refreshTrigger para atualizar automaticamente
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 CreditCardPage: Refresh trigger acionado:', refreshTrigger);
      console.log('💳 CreditCardPage: Atualizando cartões após nova transação');
      const debounceTimer = setTimeout(() => {
        loadData();
      }, 100); // Pequeno debounce para evitar múltiplas chamadas

      return () => clearTimeout(debounceTimer);
    }
  }, [refreshTrigger]); // Removido loadData das dependências para evitar loop

  // Cleanup: cancelar requisições pendentes quando o componente desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (loading) {
    return <div className="page loading">Carregando cartões...</div>;
  }

  return (
    <div className="page">
      <PageHeaderWithMonthSelector 
        title="Meus Cartões"
        icon="💳"
        subtitle="Gestão dos cartões de crédito e gastos do período"
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={handleMonthChange}
      />
      
      <div className="transactions-container-enhanced">
        {creditCards.length > 0 ? (
          <div className="cards-grid">
            {creditCards.map((card, index) => {
              const currentBalance = calculateCurrentCardBalance(card.name); // Saldo já lançado
              const committed = calculateCommittedCardBalance(card.name); // Parcelas futuras
              const pendingAmount = calculatePendingCardExpenses(card.name); // A ser lançado
              
              const currentPercentage = card.limit > 0 ? ((currentBalance || 0) / card.limit) * 100 : 0;
              const committedPercentage = card.limit > 0 ? ((committed || 0) / card.limit) * 100 : 0;
              const totalPercentage = Math.min(currentPercentage + committedPercentage, 100);
              const availableLimit = Math.max(0, card.limit - currentBalance - committed);

              // Função para obter a bandeira do cartão baseada no nome
              const getCardFlag = (cardName) => {
                if (!cardName) return 'CARTÃO';
                const name = cardName.toLowerCase();
                if (name.includes('visa')) return 'VISA';
                if (name.includes('mastercard') || name.includes('master')) return 'MASTERCARD';
                if (name.includes('amex') || name.includes('american express')) return 'AMEX';
                if (name.includes('elo')) return 'ELO';
                if (name.includes('hipercard') || name.includes('hiper')) return 'HIPERCARD';
                return 'CARTÃO';
              };

              // Determinar a classe baseada na bandeira do cartão
              const getBrandClass = (brand) => {
                if (!brand) return 'default';
                const brandLower = brand.toLowerCase();
                if (brandLower.includes('visa')) return 'visa';
                if (brandLower.includes('master')) return 'mastercard';
                if (brandLower.includes('amex') || brandLower.includes('american')) return 'amex';
                if (brandLower.includes('elo')) return 'elo';
                if (brandLower.includes('hiper')) return 'hipercard';
                return 'default';
              };
              
              return (
                <div key={card._id} className="credit-card-simple">
                  <div 
                    className={`card-content-simple ${getBrandClass(card.flag)}`}
                    onClick={() => openCardModal(card)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-header-simple">
                      <div className="card-name-header">
                        <h3 className="card-name-top">{card.name}</h3>
                        {pendingAmount > 0 && (
                          <div className="pending-indicator-dashboard">
                            <span className="pending-label">A ser lançado</span>
                            <span className="pending-value">R$ {pendingAmount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => {
                            setSelectedCard(card);
                            setShowEditCardModal(true);
                          }}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => {
                            setCardToDelete(card);
                            setShowDeleteModal(true);
                          }}
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="card-financial-data">
                      <div className="financial-row">
                        <div className="financial-item">
                          <span className="financial-label">Limite Total</span>
                          <span className="financial-value">R$ {(card.limit || 0).toFixed(2)}</span>
                        </div>
                        <div className="financial-item">
                          <span className="financial-label">💳 Gasto do Mês</span>
                          <span className="financial-value expense">R$ {currentBalance.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="financial-row">
                        <div className="financial-item">
                          <span className="financial-label">⏳ Parcelas Futuras</span>
                          <span className="financial-value committed">R$ {committed.toFixed(2)}</span>
                        </div>
                        <div className="financial-item">
                          <span className="financial-label">✅ Disponível</span>
                          <span className="financial-value available">R$ {availableLimit.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                      
                    {card.limit > 0 && (
                      <div className="usage-bar-simple">
                        <div className="usage-info-simple">
                          <span>💳 Gasto: {currentPercentage.toFixed(1)}% • ⏳ Parcelas: {committedPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="progress-bar-simple">
                          <div 
                            className={`progress-fill-simple current ${currentPercentage > 80 ? 'danger' : currentPercentage > 60 ? 'warning' : 'normal'}`}
                            style={{ width: `${currentPercentage}%` }}
                          />
                          <div 
                            className="progress-fill-simple committed"
                            style={{ 
                              width: `${committedPercentage}%`,
                              marginLeft: `${currentPercentage}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="card-footer-simple">
                      <div className="card-holder-info">
                        <div className="card-number-simple">**** **** **** {card.lastDigits || '0000'}</div>
                        <div className="card-holder-name">{card.holderName || 'PORTADOR'}</div>
                      </div>
                      <div className="card-brand-info">
                        <span className="brand-name">{getCardFlag(card.flag)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="credit-card-simple add-card-button" onClick={() => setShowAddCardModal(true)}>
              <div className="card-content-simple add-card-content">
                <div className="add-card-icon">➕</div>
                <div className="add-card-text">
                  <h3>Adicionar Cartão</h3>
                  <p>Novo cartão de crédito</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-transactions-enhanced">
            <div className="empty-state-icon">💳</div>
            <h3>Nenhum cartão cadastrado</h3>
            <p>Adicione seus cartões para controlar seus gastos do período</p>
            <button 
              className="btn-add-enhanced"
              onClick={() => setShowAddCardModal(true)}
            >
              ➕ Adicionar Primeiro Cartão
            </button>
          </div>
        )}
      </div>

      {/* Modal de Transações do Cartão */}
      {showCardModal && selectedCardForModal && (
        <div className="modal-overlay card-modal-overlay" onClick={() => setShowCardModal(false)}>
          <div className="modal-content card-transactions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💳 {selectedCardForModal.name}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCardModal(false)}
              >
                ×
              </button>
            </div>

            <div className="month-navigation">
              <button 
                className="month-nav-btn prev"
                onClick={goToPreviousMonth}
                title="Mês anterior"
              >
                ‹
              </button>
              <div className="current-month-display">
                <h4>{getMonthName(currentModalMonth)} {currentModalYear}</h4>
              </div>
              <button 
                className="month-nav-btn next"
                onClick={goToNextMonth}
                title="Próximo mês"
              >
                ›
              </button>
            </div>

            <div className="modal-body">
              <div className="card-modal-stats">
                <div className="modal-stat-grid">
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">Gasto neste mês</div>
                    <div className="modal-stat-value expense">
                      R$ {calculateCardExpensesByMonth(selectedCardForModal.name, currentModalMonth, currentModalYear).toFixed(2)}
                    </div>
                  </div>
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">Número de transações</div>
                    <div className="modal-stat-value">
                      {getCardTransactionsByMonth(selectedCardForModal.name, currentModalMonth, currentModalYear).length}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-transactions-list">
                <h4>📋 Extrato de {getMonthName(currentModalMonth)} {currentModalYear}</h4>
                {getCardTransactionsByMonth(selectedCardForModal.name, currentModalMonth, currentModalYear).length === 0 ? (
                  <div className="no-transactions-modal">
                    <p>📋 Nenhuma transação encontrada para este mês</p>
                    <p className="hint-text">Use os botões ‹ › para navegar entre os meses</p>
                  </div>
                ) : (
                  <div className="transactions-list-modal">
                    {getCardTransactionsByMonth(selectedCardForModal.name, currentModalMonth, currentModalYear).map((transaction, index) => {
                      const getCategoryIcon = (category, type) => {
                        const categoryIcons = {
                          'alimentacao': '🍽️', 'comida': '🍽️', 'restaurante': '🍽️', 'lanche': '🍿',
                          'transporte': '🚗', 'combustivel': '⛽', 'uber': '🚕', 'onibus': '🚌',
                          'saude': '🏥', 'medicina': '💊', 'dentista': '🦷', 'farmacia': '💊',
                          'educacao': '📚', 'curso': '🎓', 'livro': '📖', 'escola': '🏫',
                          'lazer': '🎬', 'cinema': '🎬', 'viagem': '✈️', 'festa': '🎉',
                          'casa': '🏠', 'moradia': '🏠', 'aluguel': '🏠', 'condominio': '🏢',
                          'trabalho': '💼', 'salario': '💰', 'salário': '💰', 'freelance': '💻',
                          'investimento': '📈', 'venda': '💵', 'compras': '🛍️', 'shopping': '🛍️',
                          'outros': '💳', 'diversos': '💳'
                        };
                        return categoryIcons[category?.toLowerCase()] || (type === 'income' ? '💰' : '💳');
                      };

                      // Verificar se a transação já foi lançada (CreditCardPage)
                      const today = new Date();
                      today.setHours(23, 59, 59, 999); // Fim do dia atual
                      const transactionDate = new Date(transaction.date);
                      transactionDate.setHours(0, 0, 0, 0); // Início do dia da transação
                      const isLaunched = transactionDate <= today;

                      return (
                        <div key={transaction._id || index} className={`transaction-item-extract ${!isLaunched ? 'future-transaction' : 'launched-transaction'}`}>
                          <div className="extract-date">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                            {!isLaunched && <span className="status-badge future">⏳ A SER LANÇADA</span>}
                            {isLaunched && <span className="status-badge launched">✅ LANÇADA</span>}
                          </div>
                          <div className="extract-main">
                            <div className="extract-description">
                              <div className="description-line">
                                <strong>{transaction.description}</strong>
                                {renderCardTransactionBadges(transaction)}
                              </div>
                              <div className="category-line">
                                {getCategoryIcon(transaction.category, transaction.type)} {transaction.category}
                                {transaction.paymentMethod === 'credito' && transaction.creditCard && 
                                  ` • 💳 ${transaction.creditCard}`
                                }
                                {transaction.paymentMethod === 'debito' && transaction.bank && 
                                  ` • 🏦 ${transaction.bank}`
                                }
                              </div>
                              {transaction.notes && (
                                <div className="notes-line">
                                  📝 {transaction.notes}
                                </div>
                              )}
                            </div>
                            <div className="extract-amount">
                              -R$ {transaction.amount?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Exclusão */}
      {showDeleteModal && cardToDelete && (
        <div className="modal-overlay-focused" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content edit-card-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Confirmar Exclusão</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-confirmation-content">
                <div className="warning-icon">⚠️</div>
                <p className="delete-message">Tem certeza que deseja deletar este cartão?</p>
                <div className="card-preview-delete">
                  <div className="card-info">
                    <strong className="card-name">{cardToDelete.name}</strong>
                    <span className="card-digits">**** **** **** {cardToDelete.lastDigits}</span>
                  </div>
                </div>
                <div className="delete-warning">
                  <small>
                    💡 Só é possível deletar cartões sem transações vinculadas
                  </small>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-primary-enhanced"
                onClick={() => setShowDeleteModal(false)}
              >
                <span className="btn-icon">↩️</span>
                Cancelar
              </button>
              <button 
                className="btn-secondary-enhanced"
                onClick={handleDeleteCard}
              >
                <span className="btn-icon">🗑️</span>
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para adicionar cartão */}
      {showAddCardModal && (
        <AddCreditCardModal 
          onSave={handleAddCard}
          onCancel={() => setShowAddCardModal(false)}
        />
      )}

      {/* Modal para editar cartão */}
      {showEditCardModal && selectedCard && (
        <EditCreditCardModal 
          card={selectedCard}
          onSave={handleEditCard}
          onCancel={() => setShowEditCardModal(false)}
        />
      )}
    </div>
  );
};

// Página Bancos
const BanksPage = () => {
  const { triggerRefresh } = useContext(NewTransactionContext);
  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankToDelete, setBankToDelete] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Função para renderizar badges das transações bancárias
  const renderBankTransactionBadges = (transaction) => {
    const badges = [];
    
    if (transaction.isInstallment) {
      badges.push(
        <span key="installment" className="installment-badge">
          {transaction.installmentNumber}/{transaction.totalInstallments}
        </span>
      );
    }
    
    if (transaction.isFixed || transaction.isRecurring || transaction.recurringParentId) {
      const isVirtual = transaction.isVirtualFixed || transaction.isVirtual;
      badges.push(
        <span key="fixed" className={isVirtual ? "virtual-fixed-badge" : "fixed-badge"}>
          FIXA{isVirtual ? " (AUTO)" : ""}
        </span>
      );
    }
    
    return badges;
  };

  // Função para renderizar badges das transações (igual ao Dashboard)
  const renderTransactionBadges = (transaction) => {
    const badges = [];
    
    // Badge de parcela
    if (transaction.isInstallment) {
      badges.push(
        <span key="installment" className="installment-badge">
          {transaction.installmentNumber}/{transaction.totalInstallments}
        </span>
      );
    }
    
    // Badge de transação fixa/recorrente
    if (transaction.isFixed || transaction.isRecurring || transaction.recurringParentId) {
      const isVirtual = transaction.isVirtual;
      badges.push(
        <span key="fixed" className={isVirtual ? "virtual-fixed-badge" : "fixed-badge"}>
          {isVirtual ? "FIXA (AUTO)" : "FIXA"}
        </span>
      );
    }
    
    return badges;
  };
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'debit_pix', 'credit'
  
  // Estados para o modal de transações do banco
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBankForModal, setSelectedBankForModal] = useState(null);
  const [currentModalMonth, setCurrentModalMonth] = useState(new Date().getMonth());
  const [currentModalYear, setCurrentModalYear] = useState(new Date().getFullYear());

  // Estados para controle de loading e cache
  const [isLoadingData, setIsLoadingData] = useState(false);
  const loadingRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastLoadParamsRef = useRef(null);
  
  // Refs para evitar stale closures no triggerRefresh
  const selectedMonthRef = useRef(selectedMonth);
  const selectedYearRef = useRef(selectedYear);

  // Obter transações de um banco específico por mês 
  const getBankTransactionsByMonth = useCallback((bankName, month, year) => {
    console.log('🔍 FILTRANDO TRANSAÇÕES BANCO (Página):', { bankName, month, year, totalTransactions: transactions?.length || 0 });
    
    if (!transactions || !Array.isArray(transactions)) {
      console.log('❌ SEM TRANSAÇÕES DISPONÍVEIS');
      return [];
    }

    // Filtrar apenas transações reais do mês e banco
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const transactionMonth = transactionDate.getMonth();
      const transactionYear = transactionDate.getFullYear();
      
      // Verificar se é do banco correto e período correto
      const isBankMatch = t.bank === bankName;
      const isDateMatch = transactionMonth === month && transactionYear === year;
      
      // Verificar se é método de pagamento válido para banco (débito, PIX)
      const isValidPayment = (t.paymentMethod === 'debito' || t.paymentMethod === 'pix');
      
      return isBankMatch && isDateMatch && isValidPayment;
    });

    console.log('🏦 Transações encontradas para', bankName, ':', monthTransactions.length);
    return monthTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions]);

  // Abrir modal de transações do banco
  const openBankModal = useCallback((bank) => {
    setSelectedBankForModal(bank);
    setCurrentModalMonth(new Date().getMonth());
    setCurrentModalYear(new Date().getFullYear());
    setShowBankModal(true);
  }, []);

  // Funções de navegação de mês no modal
  const goToPreviousMonth = useCallback(() => {
    if (currentModalMonth === 0) {
      setCurrentModalMonth(11);
      setCurrentModalYear(currentModalYear - 1);
    } else {
      setCurrentModalMonth(currentModalMonth - 1);
    }
  }, [currentModalMonth, currentModalYear]);

  const goToNextMonth = useCallback(() => {
    if (currentModalMonth === 11) {
      setCurrentModalMonth(0);
      setCurrentModalYear(currentModalYear + 1);
    } else {
      setCurrentModalMonth(currentModalMonth + 1);
    }
  }, [currentModalMonth, currentModalYear]);

  const getMonthName = useCallback((month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
  }, []);

  // Carregar bancos e transações com otimização
  const loadData = useCallback(async (month = selectedMonth, year = selectedYear, forceReload = false) => {
    console.log(`🏦 BanksPage loadData called: month=${month}, year=${year}, forceReload=${forceReload}`);
    
    // Chave única para a requisição
    const requestKey = `banks-${month}-${year}`;
    const currentParams = `${month}-${year}`;
    
    // Se já está carregando os MESMOS dados, não fazer nada (exceto se for primeiro carregamento)
    const isFirstLoad = lastLoadParamsRef.current === null;
    if (loadingRef.current === requestKey && !isFirstLoad) {
      return;
    }
    
    // Cache inteligente: só bloquear se realmente já carregou dados com sucesso para os mesmos parâmetros
    const shouldSkipDueToCache = !forceReload && 
                                lastLoadParamsRef.current === currentParams && 
                                banks.length > 0;
    
    if (shouldSkipDueToCache) {
      console.log(`⚠️ Cache hit: Dados já carregados para ${currentParams} (${banks.length} bancos). Use forceReload=true para recarregar`);
      return;
    }
    
    // Log detalhado para debug
    console.log(`🔍 Cache check: forceReload=${forceReload}, lastParams="${lastLoadParamsRef.current}", currentParams="${currentParams}", bancos=${banks.length}`);
    console.log(`📊 Decisão: ${shouldSkipDueToCache ? 'SKIP (cache)' : 'LOAD (novo/force)'}`);
    
    // Cancelar apenas se for requisição DIFERENTE
    if (abortControllerRef.current && loadingRef.current && loadingRef.current !== requestKey) {
      abortControllerRef.current.abort();
    }
    
    loadingRef.current = requestKey;
    abortControllerRef.current = new AbortController();
    setIsLoadingData(true);
    
    try {
      // Carregar bancos cadastrados
      const banksResponse = await axios.get('/banks', {
        signal: abortControllerRef.current.signal
      });
      const sortedBanks = (banksResponse.data || []).sort((a, b) => {
        const dateA = new Date(a.createdAt || a._id);
        const dateB = new Date(b.createdAt || b._id);
        return dateB - dateA;
      });

      // Carregar apenas transações do mês (sem templates separados)
      // O backend já gera as transações recorrentes automaticamente
      const transactionsResponse = await axios.get(`/transactions?month=${month}&year=${year}`, {
        signal: abortControllerRef.current.signal,
        timeout: 10000
      });
      
      const allTransactions = transactionsResponse.data || [];
      
      // DEBUG: Verificar transações carregadas
      const recurringTransactions = allTransactions.filter(t => t.isRecurring);
      const generatedRecurringTransactions = allTransactions.filter(t => t.recurringParentId);
      
      console.log(`🏦 BanksPage - Mês/Ano: ${month}/${year}`);
      console.log(`🏦 BanksPage - Transações do mês: ${allTransactions.length}`);
      console.log(`🏦 BanksPage - Templates recorrentes: ${recurringTransactions.length}`);
      console.log(`🏦 BanksPage - Transações geradas (recurringParentId): ${generatedRecurringTransactions.length}`);
      
      // Processar apenas se ainda é a requisição ativa
      if (loadingRef.current === requestKey) {
        setBanks(sortedBanks);
        setTransactions(allTransactions);
        
        // Atualizar parâmetros apenas se diferentes
        if (month !== selectedMonth) setSelectedMonth(month);
        if (year !== selectedYear) setSelectedYear(year);
        
        // Marcar como carregado com sucesso
        lastLoadParamsRef.current = currentParams;
      } else {
        console.log(`⚠️ Requisição não é mais ativa: ${requestKey} vs ${loadingRef.current}`);
      }
      
    } catch (error) {
      // CORREÇÃO PRINCIPAL: Não logar cancelamento como erro
      if (error.name === 'CanceledError' || 
          error.code === 'ERR_CANCELED' || 
          error.name === 'AbortError' ||
          error.message === 'canceled') {
        console.log('🚫 Requisição cancelada - operação normal');
        return; // Sair silenciosamente
      }
      
      // Só logar erros reais
      console.error('❌ Erro real ao carregar bancos:', error);
      if (loadingRef.current === requestKey) {
        setBanks([]);
        setTransactions([]);
      }
    } finally {
      if (loadingRef.current === requestKey) {
        setIsLoadingData(false);
        setLoading(false);
        loadingRef.current = null;
      }
    }
  }, [selectedMonth, selectedYear]); // REMOVIDO isLoadingData das dependências

  const handleMonthChange = useCallback((month, year) => {
    // Verificar se é diferente dos valores atuais
    if (month !== selectedMonth || year !== selectedYear) {
      setSelectedMonth(month);
      setSelectedYear(year);
      loadData(month, year);
    }
  }, [selectedMonth, selectedYear, loadData]);

  // Calcular saldo de um banco baseado nas transações do mês selecionado
  const calculateBankBalance = useCallback((bankName) => {
    // Usar getBankTransactionsByMonth para pegar apenas transações do mês selecionado
    const bankTransactions = getBankTransactionsByMonth(bankName, selectedMonth - 1, selectedYear);
    
    return bankTransactions.reduce((sum, t) => {
      if (t.type === 'income') {
        return sum + (t.amount || 0);
      } else {
        return sum - (t.amount || 0);
      }
    }, 0);
  }, [transactions, selectedMonth, selectedYear]);

  // Calcular receitas do banco no período selecionado
  const calculateBankIncome = useCallback((bankName) => {
    const bankTransactions = getBankTransactionsByMonth(bankName, selectedMonth - 1, selectedYear);
    return bankTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions, selectedMonth, selectedYear]);

  // Calcular despesas do banco no período selecionado
  const calculateBankExpenses = useCallback((bankName) => {
    const bankTransactions = getBankTransactionsByMonth(bankName, selectedMonth - 1, selectedYear);
    return bankTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions, selectedMonth, selectedYear]);

  // Adicionar novo banco
  const handleAddBank = async (bankData) => {
    try {
      console.log('🏦 Adicionando banco:', bankData);
      const response = await axios.post('/banks', bankData);
      console.log('✅ Banco adicionado com sucesso:', response.data);
      
      setShowAddBankModal(false);
      
      // Forçar refresh dos dados via triggerRefresh
      console.log('🔄 Triggering refresh after bank addition');
      triggerRefresh(); 
      
      alert('Banco adicionado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao adicionar banco:', error);
      alert('Erro ao adicionar banco: ' + (error.response?.data?.message || error.message));
    }
  };

  // Função de debug para verificar estado atual
  const debugCurrentState = () => {
    console.log('🔍 DEBUG - Estado atual da BanksPage:');
    console.log('📊 Bancos:', banks.length, banks);
    console.log('💳 Transações:', transactions.length, transactions);
    console.log('📅 Período:', selectedMonth, selectedYear);
    console.log('� Refs período:', { 
      selectedMonthRef: selectedMonthRef.current, 
      selectedYearRef: selectedYearRef.current 
    });
    console.log('�🔄 Loading states:', { loading, isLoadingData });
    console.log('📋 Refs:', { 
      loadingRef: loadingRef.current, 
      lastLoadParams: lastLoadParamsRef.current 
    });
  };

  // Para debug - adicionar ao window se necessário
  if (typeof window !== 'undefined') {
    window.debugBanksPage = debugCurrentState;
    window.forceLoadBanks = () => {
      console.log('🔧 DEBUG: Forçando carregamento manual de bancos');
      lastLoadParamsRef.current = null;
      loadingRef.current = null;
      loadData(selectedMonth, selectedYear, true);
    };
    
    // CORREÇÃO: Função global para monitorar sistema de auto-refresh
    window.debugAutoRefresh = () => {
      console.log('🔍 DEBUG - Sistema de Auto-Refresh:');
      console.log('📋 Event listeners customizados: REMOVIDOS (usando apenas Context)');
      console.log('🔄 TriggerRefresh implementado em: DashboardPage, AllTransactionsPage, CreditCardPage, BanksPage');
      console.log('💾 GlobalNewTransactionModal: Usa triggerRefresh() do Context');
      console.log('📊 Estado do refreshTrigger atual:', triggerRefresh);
    };
  }

  // Editar banco
  const handleEditBank = async (bankData) => {
    try {
      console.log('✏️ Editando banco:', bankData);
      const response = await axios.put(`/banks/${selectedBank._id}`, bankData);
      console.log('✅ Banco atualizado com sucesso:', response.data);
      
      setShowEditBankModal(false);
      setSelectedBank(null);
      
      // Forçar refresh dos dados via triggerRefresh
      console.log('🔄 Triggering refresh after bank edit');
      triggerRefresh();
      
      alert('Banco atualizado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao editar banco:', error);
      alert('Erro ao editar banco: ' + (error.response?.data?.message || error.message));
    }
  };

  // Deletar banco
  const handleDeleteBank = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const bankTransactions = transactions.filter(t => {
        if (t.bank !== bankToDelete.name) return false;
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() + 1 === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      });
      
      if (bankTransactions.length > 0) {
        alert(`Não é possível deletar este banco. Existem ${bankTransactions.length} transação(ões) vinculada(s) a ele no mês atual.`);
        return;
      }

      console.log('🗑️ Deletando banco:', bankToDelete);
      const response = await axios.delete(`/banks/${bankToDelete._id}`);
      console.log('✅ Banco deletado com sucesso:', response.data);
      
      setShowDeleteModal(false);
      setBankToDelete(null);
      
      // Forçar refresh dos dados via triggerRefresh
      console.log('🔄 Triggering refresh after bank deletion');
      triggerRefresh();
      
      alert('Banco deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar banco:', error);
      alert('Erro ao deletar banco');
    }
  };

  useEffect(() => {
    console.log('🚀 BanksPage: Carregamento inicial');
    
    // CORREÇÃO: Limpar refs que podem estar interferindo
    console.log('🧹 Limpando refs para garantir carregamento inicial');
    console.log('🔍 Estado antes da limpeza:', {
      lastLoadParams: lastLoadParamsRef.current,
      loadingRef: loadingRef.current
    });
    
    lastLoadParamsRef.current = null;
    loadingRef.current = null;
    
    // Pequeno delay para garantir que o componente está totalmente montado
    const timeoutId = setTimeout(() => {
      console.log('⏱️ Timeout executado - iniciando carregamento com delay');
      loadData(selectedMonth, selectedYear, true); // forceReload = true
    }, 50);
    
    // CORREÇÃO: Removido event listener customizado - usar apenas triggerRefresh do Context
    
    return () => {
      clearTimeout(timeoutId);
      // Removido removeEventListener - não há mais listener customizado
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Dependências vazias para executar apenas na montagem

  // useEffect separado para o refresh trigger
  useEffect(() => {
    if (triggerRefresh > 0) {
      console.log(`🔄 BanksPage: Refresh trigger acionado: ${triggerRefresh}`);
      console.log('🏦 BanksPage: Atualizando bancos após nova transação');
      const debounceTimer = setTimeout(() => {
        console.log(`🔄 BanksPage: Executando loadData com forceReload=true`);
        // Usar refs para obter valores atuais sem dependências no useEffect
        const currentMonth = selectedMonthRef.current;
        const currentYear = selectedYearRef.current;
        console.log(`📅 Usando período: ${currentMonth}/${currentYear}`);
        loadData(currentMonth, currentYear, true); // forceReload = true
      }, 100); // Pequeno debounce para evitar múltiplas chamadas

      return () => clearTimeout(debounceTimer);
    }
  }, [triggerRefresh]); // Apenas triggerRefresh como dependência para evitar loops

  // useEffects para manter refs atualizados
  useEffect(() => {
    selectedMonthRef.current = selectedMonth;
    console.log(`📅 BanksPage: selectedMonthRef atualizado para ${selectedMonth}`);
  }, [selectedMonth]);
  
  useEffect(() => {
    selectedYearRef.current = selectedYear;
    console.log(`📅 BanksPage: selectedYearRef atualizado para ${selectedYear}`);
  }, [selectedYear]);

  if (loading) {
    return <div className="page loading">Carregando bancos...</div>;
  }

  return (
    <div className="page">
      <PageHeaderWithMonthSelector 
        title="Meus Bancos"
        icon="🏦"
        subtitle="Gestão de contas bancárias e movimentações do período"
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={handleMonthChange}
      />
      
      <div className="transactions-container-enhanced">
        {banks.length > 0 ? (
          <div className="cards-grid">
            {banks.map((bank) => {
              const balance = calculateBankBalance(bank.name);
              const monthTransactions = getBankTransactionsByMonth(bank.name, selectedMonth - 1, selectedYear);
              const transactionCount = monthTransactions.length;
              const incomeThisMonth = calculateBankIncome(bank.name);
              const expenseThisMonth = calculateBankExpenses(bank.name);
              
              return (
                <div key={bank._id} className="credit-card-simple">
                  <div 
                    className="card-content-simple bank-card"
                    onClick={() => openBankModal(bank)}
                  >
                    <div className="card-header-simple">
                      <div className="card-name-header">
                        <h3 className="card-name-top">🏦 {bank.name}</h3>
                      </div>
                      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => {
                            setSelectedBank(bank);
                            setShowEditBankModal(true);
                          }}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => {
                            setBankToDelete(bank);
                            setShowDeleteModal(true);
                          }}
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="card-financial-data">
                      <div className="financial-row">
                        <div className="financial-item">
                          <span className="financial-label">Saldo Período</span>
                          <span className={`financial-value ${balance >= 0 ? 'income' : 'expense'}`}>
                            R$ {balance.toFixed(2)}
                          </span>
                        </div>
                        <div className="financial-item">
                          <span className="financial-label">Transações</span>
                          <span className="financial-value">{transactionCount}</span>
                        </div>
                      </div>
                      <div className="financial-row">
                        <div className="financial-item">
                          <span className="financial-label">Receitas</span>
                          <span className="financial-value income">R$ {incomeThisMonth.toFixed(2)}</span>
                        </div>
                        <div className="financial-item">
                          <span className="financial-label">Despesas</span>
                          <span className="financial-value expense">R$ {expenseThisMonth.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-footer-simple">
                      <div className="card-holder-info">
                        <div className="card-number-simple">Conta {bank.accountType || 'Corrente'}</div>
                        <div className="card-holder-name">{bank.holderName || 'TITULAR'}</div>
                      </div>
                      <div className="card-brand-info">
                        <span className="brand-name">BANCO</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="credit-card-simple add-card-button" onClick={() => setShowAddBankModal(true)}>
              <div className="card-content-simple add-card-content">
                <div className="add-card-icon">➕</div>
                <div className="add-card-text">
                  <h3>Adicionar Banco</h3>
                  <p>Nova conta bancária</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-transactions-enhanced">
            <div className="empty-state-icon">🏦</div>
            <h3>Nenhum banco cadastrado</h3>
            <p>Adicione seus bancos para organizar movimentações do período</p>
            <button 
              className="btn-add-enhanced"
              onClick={() => setShowAddBankModal(true)}
            >
              ➕ Adicionar Primeiro Banco
            </button>
          </div>
        )}
      </div>

      {/* Modal de Transações do Banco */}
      {showBankModal && selectedBankForModal && (
        <div className="modal-overlay card-modal-overlay" onClick={() => setShowBankModal(false)}>
          <div className="modal-content card-transactions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏦 {selectedBankForModal.name}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowBankModal(false)}
              >
                ×
              </button>
            </div>

            <div className="month-navigation">
              <button 
                className="month-nav-btn prev"
                onClick={goToPreviousMonth}
                title="Mês anterior"
              >
                ‹
              </button>
              <div className="current-month-display">
                <h4>{getMonthName(currentModalMonth)} {currentModalYear}</h4>
              </div>
              <button 
                className="month-nav-btn next"
                onClick={goToNextMonth}
                title="Próximo mês"
              >
                ›
              </button>
            </div>

            <div className="modal-body">
              <div className="card-modal-stats">
                <div className="modal-stat-grid">
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">Entradas neste mês</div>
                    <div className="modal-stat-value income">
                      R$ {getBankTransactionsByMonth(selectedBankForModal.name, currentModalMonth, currentModalYear)
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">Saídas neste mês</div>
                    <div className="modal-stat-value expense">
                      R$ {getBankTransactionsByMonth(selectedBankForModal.name, currentModalMonth, currentModalYear)
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">Número de transações</div>
                    <div className="modal-stat-value">
                      {getBankTransactionsByMonth(selectedBankForModal.name, currentModalMonth, currentModalYear).length}
                    </div>
                  </div>
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">Saldo do mês</div>
                    <div className="modal-stat-value">
                      R$ {(getBankTransactionsByMonth(selectedBankForModal.name, currentModalMonth, currentModalYear)
                        .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-transactions-list">
                <h4>📋 Extrato de {getMonthName(currentModalMonth)} {currentModalYear}</h4>
                {getBankTransactionsByMonth(selectedBankForModal.name, currentModalMonth, currentModalYear).length === 0 ? (
                  <div className="no-transactions-modal">
                    <p>📋 Nenhuma transação encontrada para este mês</p>
                    <p className="hint-text">Use os botões ‹ › para navegar entre os meses</p>
                  </div>
                ) : (
                  <div className="transactions-list-modal">
                    {getBankTransactionsByMonth(selectedBankForModal.name, currentModalMonth, currentModalYear).map((transaction, index) => {
                      const getCategoryIcon = (category, type) => {
                        const categoryIcons = {
                          'alimentacao': '🍽️', 'comida': '🍽️', 'restaurante': '🍽️', 'lanche': '🍿',
                          'transporte': '🚗', 'combustivel': '⛽', 'uber': '🚕', 'onibus': '🚌',
                          'saude': '🏥', 'medicina': '💊', 'dentista': '🦷', 'farmacia': '💊',
                          'educacao': '📚', 'curso': '🎓', 'livro': '📖', 'escola': '🏫',
                          'lazer': '🎬', 'cinema': '🎬', 'viagem': '✈️', 'festa': '🎉',
                          'casa': '🏠', 'moradia': '🏠', 'aluguel': '🏠', 'condominio': '🏢',
                          'trabalho': '💼', 'salario': '💰', 'salário': '💰', 'freelance': '💻',
                          'investimento': '📈', 'venda': '💵', 'compras': '🛍️', 'shopping': '🛍️',
                          'outros': '💳', 'diversos': '💳'
                        };
                        return categoryIcons[category?.toLowerCase()] || (type === 'income' ? '💰' : '💳');
                      };

                      // Verificar se a transação já foi lançada (BanksPage)
                      const today = new Date();
                      today.setHours(23, 59, 59, 999);
                      const transactionDate = new Date(transaction.date);
                      transactionDate.setHours(0, 0, 0, 0);
                      const isLaunched = transactionDate <= today;

                      return (
                        <div key={transaction._id || index} className={`transaction-item-extract ${!isLaunched ? 'future-transaction' : 'launched-transaction'}`}>
                          <div className="extract-date">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                            {!isLaunched && <span className="status-badge future">⏳ A SER LANÇADA</span>}
                            {isLaunched && <span className="status-badge launched">✅ LANÇADA</span>}
                          </div>
                          <div className="extract-main">
                            <div className="extract-description">
                              <div className="description-line">
                                <strong>{transaction.description}</strong>
                                {renderBankTransactionBadges(transaction)}
                              </div>
                              <div className="category-line">
                                {getCategoryIcon(transaction.category, transaction.type)} {transaction.category}
                                {transaction.paymentMethod === 'credito' && transaction.creditCard && 
                                  ` • 💳 ${transaction.creditCard}`
                                }
                                {transaction.paymentMethod === 'debito' && transaction.bank && 
                                  ` • 🏦 ${transaction.bank}`
                                }
                              </div>
                              {transaction.notes && (
                                <div className="notes-line">
                                  📝 {transaction.notes}
                                </div>
                              )}
                            </div>
                            <div className="extract-amount">
                              {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && bankToDelete && (
        <div className="modal-overlay-focused" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content edit-card-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Confirmar Exclusão</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-confirmation-content">
                <div className="warning-icon">⚠️</div>
                <p className="delete-message">
                  Tem certeza que deseja excluir este banco?
                </p>
                <div className="bank-preview-delete">
                  <div className="bank-info-delete">
                    <span className="bank-icon-delete">{bankToDelete.icon || '🏦'}</span>
                    <div className="bank-details-delete">
                      <strong className="bank-name-delete">{bankToDelete.name}</strong>
                      <span className="bank-type-delete">
                        {bankToDelete.accountType === 'corrente' ? 'Conta Corrente' : 
                         bankToDelete.accountType === 'poupanca' ? 'Poupança' : 
                         bankToDelete.accountType === 'salario' ? 'Conta Salário' :
                         bankToDelete.accountType === 'investimento' ? 'Conta Investimento' :
                         bankToDelete.accountType === 'conjunta' ? 'Conta Conjunta' :
                         bankToDelete.accountType === 'empresarial' ? 'Conta Empresarial' :
                         bankToDelete.accountType === 'digital' ? 'Conta Digital' :
                         bankToDelete.accountType === 'universitaria' ? 'Conta Universitária' :
                         'Conta Bancária'}
                      </span>
                      {bankToDelete.holderName && (
                        <span className="holder-name-delete">{bankToDelete.holderName}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="warning-text">
                  <small>
                    ⚠️ Esta ação não pode ser desfeita. Só é possível deletar bancos sem transações vinculadas no mês atual.
                  </small>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDeleteBank}
              >
                🗑️ Excluir Banco
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para adicionar banco */}
      {showAddBankModal && (
        <AddBankModal 
          onSave={handleAddBank}
          onCancel={() => setShowAddBankModal(false)}
        />
      )}

      {/* Modal para editar banco */}
      {showEditBankModal && selectedBank && (
        <EditBankModal 
          bank={selectedBank}
          onSave={handleEditBank}
          onCancel={() => {
            setShowEditBankModal(false);
            setSelectedBank(null);
          }}
        />
      )}
    </div>
  );
};

// Página Configurações (simplificada)
const SettingsPage = () => {
  return (
    <div className="page">
      <div className="month-selector-enhanced">
        <div className="month-display-enhanced">
          <div className="current-month">
            <h2>⚙️ Configurações</h2>
            <p>Preferências e configurações do sistema</p>
          </div>
        </div>
      </div>
      <div className="no-transactions-enhanced">
        <div className="empty-state-icon">⚙️</div>
        <h3>Página em Construção</h3>
        <p>A página de configurações será implementada em breve</p>
      </div>
    </div>
  );
};

// Modal Global de Nova Transação
const GlobalNewTransactionModal = () => {
  const { showAddModal, closeModal, triggerRefresh } = useNewTransaction();
  
  const handleSave = async (transactionData) => {
    try {
      console.log('💾 GlobalNewTransactionModal: Salvando nova transação');
      await axios.post('/transactions', transactionData);
      closeModal();
      
      // CORREÇÃO: Usar apenas triggerRefresh() do Context em vez de event listener
      console.log('🔄 GlobalNewTransactionModal: Triggering refresh para todas as páginas');
      triggerRefresh();
      
      alert('Transação adicionada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao adicionar transação:', error);
      alert('Erro ao adicionar transação: ' + (error.response?.data?.message || error.message));
    }
  };

  if (!showAddModal) return null;

  return <AddTransactionModal onSave={handleSave} onCancel={closeModal} />;
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
      <NewTransactionProvider>
        <GlobalNewTransactionModal />
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
      </NewTransactionProvider>
    </AuthProvider>
  );
};

// Modal para Editar Transação
const EditTransactionModal = ({ transaction, onSave, onCancel }) => {
  const [banks, setBanks] = useState([]);
  
  // Carregar bancos ao abrir o modal
  useEffect(() => {
    const loadBanks = async () => {
      try {
        const response = await axios.get('/banks');
        setBanks(response.data || []);
      } catch (error) {
        // Não logar cancelamento como erro
        if (error.name === 'CanceledError' || 
            error.code === 'ERR_CANCELED' || 
            error.name === 'AbortError' ||
            error.message === 'canceled') {
          return;
        }
        console.error('Erro ao carregar bancos:', error);
        setBanks([]);
      }
    };
    
    loadBanks();
  }, []);

  // Função para formatar valor inicial
  const formatInitialAmount = (amount) => {
    if (!amount) return '';
    
    // Multiplica por 100 para trabalhar com centavos
    const valueInCents = Math.round(amount * 100);
    
    // Se é zero, retorna 0,00
    if (valueInCents === 0) return '0,00';
    
    // Converte para string
    const valueStr = valueInCents.toString();
    
    // Se tem apenas 1 dígito: 5 -> 0,05
    if (valueStr.length === 1) {
      return `0,0${valueStr}`;
    }
    
    // Se tem apenas 2 dígitos: 56 -> 0,56
    if (valueStr.length === 2) {
      return `0,${valueStr}`;
    }
    
    // Se tem 3 ou mais dígitos: 123 -> 1,23
    const reais = valueStr.slice(0, -2);
    const centavos = valueStr.slice(-2);
    
    // Remove zeros à esquerda dos reais
    const reaisNum = parseInt(reais, 10);
    const reaisFormatted = reaisNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${reaisFormatted},${centavos}`;
  };

  const [formData, setFormData] = useState({
    description: transaction.description || '',
    amount: formatInitialAmount(transaction.amount),
    type: transaction.type || 'expense',
    category: transaction.category || '',
    date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    isRecurring: transaction.isRecurring || !!transaction.recurringParentId,
    paymentMethod: transaction.paymentMethod || 'pix',
    isInstallment: transaction.isInstallment || !!transaction.installmentParentId,
    installmentNumber: transaction.installmentNumber || 0,
    totalInstallments: transaction.totalInstallments || 2,
    bank: transaction.bank || '',
    creditCard: transaction.creditCard || ''
  });
  
  const [showUpdateAllModal, setShowUpdateAllModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Converte o valor formatado de volta para número
    const numericAmount = parseFloat(formData.amount.replace(/\./g, '').replace(',', '.'));

    const transactionData = {
      ...formData,
      amount: numericAmount
    };

    // Se for transação recorrente e algo mudou, perguntar se é para todos os meses
    if ((transaction.recurringParentId || transaction.isRecurring) && 
        (formData.amount !== formatInitialAmount(transaction.amount) || 
         formData.description !== transaction.description ||
         formData.category !== transaction.category)) {
      setPendingFormData(transactionData);
      setShowUpdateAllModal(true);
    } else {
      onSave(transactionData);
    }
  };

  const handleUpdateChoice = (updateAll) => {
    onSave({
      ...pendingFormData,
      updateAll
    });
    setShowUpdateAllModal(false);
    setPendingFormData(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <div className="modal-overlay-focused" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content edit-transaction-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>✏️ Editar Transação</h3>
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

              {/* Campo Banco (para débito e PIX) */}
              {(formData.paymentMethod === 'debito' || formData.paymentMethod === 'pix') && (
                <div className="form-group">
                  <label>Banco</label>
                  <select
                    name="bank"
                    value={formData.bank || ''}
                    onChange={handleChange}
                  >
                    <option value="">Selecione o banco</option>
                    {banks.map((bank) => (
                      <option key={bank._id} value={bank.name}>
                        🏦 {bank.name}
                      </option>
                    ))}
                    {banks.length === 0 && (
                      <option value="" disabled>Nenhum banco cadastrado</option>
                    )}
                  </select>
                  {banks.length === 0 && (
                    <small className="hint-text">
                      � Vá para a página "Bancos" para cadastrar suas contas bancárias
                    </small>
                  )}
                </div>
              )}

              {/* Campo Cartão (para crédito) */}
              {formData.paymentMethod === 'credito' && (
                <div className="form-group">
                  <label>Cartão de Crédito</label>
                  <select
                    name="creditCard"
                    value={formData.creditCard || ''}
                    onChange={handleChange}
                  >
                    <option value="">Selecione o cartão</option>
                    <option value="BB Visa">BB Visa (Banco do Brasil)</option>
                    <option value="BB Mastercard">BB Mastercard (Banco do Brasil)</option>
                    <option value="BB Elo">BB Elo (Banco do Brasil)</option>
                    <option value="Bradesco Visa">Bradesco Visa</option>
                    <option value="Bradesco Mastercard">Bradesco Mastercard</option>
                    <option value="Bradesco Elo">Bradesco Elo</option>
                    <option value="Caixa Visa">Caixa Visa</option>
                    <option value="Caixa Mastercard">Caixa Mastercard</option>
                    <option value="Caixa Elo">Caixa Elo</option>
                    <option value="Itaú Visa">Itaú Visa</option>
                    <option value="Itaú Mastercard">Itaú Mastercard</option>
                    <option value="Itaú Elo">Itaú Elo</option>
                    <option value="Santander Visa">Santander Visa</option>
                    <option value="Santander Mastercard">Santander Mastercard</option>
                    <option value="Nubank Mastercard">Nubank Mastercard</option>
                    <option value="Inter Mastercard">Inter Mastercard</option>
                    <option value="Inter Visa">Inter Visa</option>
                    <option value="C6 Mastercard">C6 Mastercard</option>
                    <option value="BTG Black">BTG Black</option>
                    <option value="BTG Mastercard">BTG Mastercard</option>
                    <option value="Next Mastercard">Next Mastercard</option>
                    <option value="PagBank Visa">PagBank Visa</option>
                    <option value="PicPay Visa">PicPay Visa</option>
                    <option value="Mercado Pago Mastercard">Mercado Pago Mastercard</option>
                    <option value="Mercado Pago Visa">Mercado Pago Visa</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              )}

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

                {/* 5. VALOR */}
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
              
              {/* 6. CATEGORIA */}
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
                      <option value="Vendas">Vendas</option>
                      <option value="Aluguel Recebido">Aluguel Recebido</option>
                      <option value="Dividendos">Dividendos</option>
                      <option value="Cashback">Cashback</option>
                      <option value="Rendimentos">Rendimentos</option>
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
                      <option value="Compras">Compras</option>
                      <option value="Vestuário">Vestuário</option>
                      <option value="Beleza">Beleza</option>
                      <option value="Casa">Casa</option>
                      <option value="Mercado">Mercado</option>
                      <option value="Farmácia">Farmácia</option>
                      <option value="Gasolina">Gasolina</option>
                      <option value="Uber/99">Uber/99</option>
                      <option value="Streaming">Streaming</option>
                      <option value="Academia">Academia</option>
                      <option value="Pets">Pets</option>
                      <option value="Viagem">Viagem</option>
                      <option value="Restaurante">Restaurante</option>
                      <option value="Ifood/Delivery">Ifood/Delivery</option>
                      <option value="Internet">Internet</option>
                      <option value="Celular">Celular</option>
                      <option value="Energia">Energia</option>
                      <option value="Água">Água</option>
                      <option value="Condomínio">Condomínio</option>
                      <option value="Aluguel">Aluguel</option>
                      <option value="Financiamento">Financiamento</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Empréstimo">Empréstimo</option>
                      <option value="Impostos">Impostos</option>
                      <option value="Seguro">Seguro</option>
                      <option value="Investimentos">Investimentos</option>
                      <option value="Poupança">Poupança</option>
                      <option value="Presentes">Presentes</option>
                      <option value="Doações">Doações</option>
                      <option value="Outros">Outros</option>
                    </>
                  )}
                </select>
              </div>
              
              {/* 7. RECORRENTE */}
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
                    disabled={transaction.recurringParentId || transaction.isRecurring || (transaction.installmentParentId || (transaction.installmentNumber > 0 && transaction.totalInstallments > 1))}
                    style={{ opacity: (transaction.recurringParentId || transaction.isRecurring || (transaction.installmentParentId || (transaction.installmentNumber > 0 && transaction.totalInstallments > 1))) ? 0.5 : 1 }}
                  />
                  <span className={`checkbox-text ${(transaction.installmentParentId || (transaction.installmentNumber > 0 && transaction.totalInstallments > 1)) ? 'disabled-text' : ''}`}>
                    Transação Fixa (repete todos os meses)
                  </span>
                </label>
              </div>

              {/* 8. PARCELAMENTO */}
              <div className="form-group">
                <label className={`checkbox-label ${formData.isRecurring || (transaction.installmentParentId || (transaction.installmentNumber > 0 && transaction.totalInstallments > 1)) ? 'disabled' : ''}`}>
                  <input
                    type="checkbox"
                    name="isInstallment"
                    checked={formData.isInstallment}
                    disabled={formData.isRecurring || (transaction.installmentParentId || (transaction.installmentNumber > 0 && transaction.totalInstallments > 1))}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isInstallment: e.target.checked,
                      // Se ativar parcelamento e estiver no PIX, mudar para débito
                      paymentMethod: (e.target.checked && prev.paymentMethod === 'pix') ? 'debito' : prev.paymentMethod
                    }))}
                    style={{ opacity: (formData.isRecurring || (transaction.installmentParentId || (transaction.installmentNumber > 0 && transaction.totalInstallments > 1))) ? 0.5 : 1 }}
                  />
                  <span className={`checkbox-text ${(transaction.installmentParentId || (transaction.installmentNumber > 0 && transaction.totalInstallments > 1)) ? 'disabled-text' : ''}`}>
                    Parcelado (crédito/débito apenas)
                    {(transaction.installmentNumber > 0 && transaction.totalInstallments > 1) && (
                      <small style={{ display: 'block', opacity: 0.7, marginTop: '2px' }}>
                        Parcela {transaction.installmentNumber} de {transaction.totalInstallments}
                      </small>
                    )}
                  </span>
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
                    disabled={transaction.installmentParentId || (transaction.installmentNumber > 0 && transaction.totalInstallments > 1)}
                    style={{ opacity: (transaction.installmentParentId || (transaction.installmentNumber > 0 && transaction.totalInstallments > 1)) ? 0.5 : 1 }}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      totalInstallments: parseInt(e.target.value) || 2
                    }))}
                    required
                  />
                  <small className="helper-text">
                    {(transaction.installmentParentId || (transaction.installmentNumber > 0 && transaction.totalInstallments > 1)) 
                      ? `Parcela fixa: ${transaction.totalInstallments} parcelas` 
                      : 'De 2 a 60 parcelas'
                    }
                  </small>
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
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Confirmação para Edição de Transação Recorrente */}
      {showUpdateAllModal && (
        <div className="modal-overlay" onClick={() => setShowUpdateAllModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Atualizar Transação Fixa</h3>
              <button className="modal-close" onClick={() => setShowUpdateAllModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="recurring-info">
                <p><strong>Esta é uma transação fixa.</strong></p>
                <p>Deseja aplicar as alterações:</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowUpdateAllModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={() => handleUpdateChoice(false)}
              >
                Apenas Este Mês
              </button>
              <button 
                className="btn-primary"
                onClick={() => handleUpdateChoice(true)}
              >
                Todos os Meses
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Modal para Adicionar Cartão de Crédito
const AddCreditCardModal = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    holderName: '',
    lastDigits: '',
    limit: '',
    dueDay: '10',
    notes: ''
  });

  const cardOptions = [
    { name: 'Itaú Visa', bank: 'Itaú' },
    { name: 'Itaú Mastercard', bank: 'Itaú' },
    { name: 'Bradesco Visa', bank: 'Bradesco' },
    { name: 'Bradesco Mastercard', bank: 'Bradesco' },
    { name: 'Banco do Brasil Visa', bank: 'Banco do Brasil' },
    { name: 'Banco do Brasil Mastercard', bank: 'Banco do Brasil' },
    { name: 'Caixa Visa', bank: 'Caixa Econômica' },
    { name: 'Caixa Mastercard', bank: 'Caixa Econômica' },
    { name: 'Santander Visa', bank: 'Santander' },
    { name: 'Santander Mastercard', bank: 'Santander' },
    { name: 'Nubank Mastercard', bank: 'Nubank' },
    { name: 'Inter Mastercard', bank: 'Inter' },
    { name: 'Inter Visa', bank: 'Inter' },
    { name: 'C6 Mastercard', bank: 'C6 Bank' },
    { name: 'BTG Black', bank: 'BTG Pactual' },
    { name: 'BTG Mastercard', bank: 'BTG Pactual' },
    { name: 'Next Mastercard', bank: 'Next' },
    { name: 'PagBank Visa', bank: 'PagBank' },
    { name: 'PicPay Visa', bank: 'PicPay' },
    { name: 'Mercado Pago Mastercard', bank: 'Mercado Pago' },
    { name: 'Mercado Pago Visa', bank: 'Mercado Pago' },
    { name: 'Outros', bank: 'Outros' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.lastDigits) {
      alert('Por favor, preencha os campos obrigatórios');
      return;
    }

    const cardData = {
      ...formData,
      limit: parseFloat(formData.limit) || 0,
      dueDay: parseInt(formData.dueDay) || 10
    };

    onSave(cardData);
  };

  return (
    <div className="modal-overlay-focused" onClick={onCancel}>
      <div className="modal-content edit-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>➕ Adicionar Novo Cartão</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Cartão *</label>
              <select
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="form-input"
              >
                <option value="">Selecione o cartão</option>
                {cardOptions.map(card => (
                  <option key={card.name} value={card.name}>
                    {card.name} ({card.bank})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Nome do Portador</label>
              <input
                type="text"
                value={formData.holderName}
                onChange={(e) => setFormData(prev => ({ ...prev, holderName: e.target.value.toUpperCase() }))}
                placeholder="NOME COMO APARECE NO CARTÃO"
                className="form-input"
                maxLength="26"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>4 Últimos Dígitos *</label>
                <input
                  type="text"
                  value={formData.lastDigits}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setFormData(prev => ({ ...prev, lastDigits: value }));
                  }}
                  placeholder="0000"
                  maxLength="4"
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Dia do Vencimento</label>
                <input
                  type="number"
                  value={formData.dueDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDay: e.target.value }))}
                  min="1"
                  max="31"
                  placeholder="10"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Limite (R$)</label>
              <input
                type="number"
                value={formData.limit}
                onChange={(e) => setFormData(prev => ({ ...prev, limit: e.target.value }))}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Observações</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ex: Cartão principal, cartão de emergência, etc."
                rows="3"
                className="form-textarea"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-success">
              💾 Adicionar Cartão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para Editar Cartão de Crédito
const EditCreditCardModal = ({ card, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: card.name || '',
    holderName: card.holderName || '',
    lastDigits: card.lastDigits || '',
    limit: card.limit?.toString() || '',
    dueDay: card.dueDay?.toString() || '10',
    notes: card.notes || ''
  });

  const cardOptions = [
    { name: 'Itaú Visa', bank: 'Itaú' },
    { name: 'Itaú Mastercard', bank: 'Itaú' },
    { name: 'Bradesco Visa', bank: 'Bradesco' },
    { name: 'Bradesco Mastercard', bank: 'Bradesco' },
    { name: 'Banco do Brasil Visa', bank: 'Banco do Brasil' },
    { name: 'Banco do Brasil Mastercard', bank: 'Banco do Brasil' },
    { name: 'Caixa Visa', bank: 'Caixa Econômica' },
    { name: 'Caixa Mastercard', bank: 'Caixa Econômica' },
    { name: 'Santander Visa', bank: 'Santander' },
    { name: 'Santander Mastercard', bank: 'Santander' },
    { name: 'Nubank Mastercard', bank: 'Nubank' },
    { name: 'Inter Mastercard', bank: 'Inter' },
    { name: 'Inter Visa', bank: 'Inter' },
    { name: 'C6 Mastercard', bank: 'C6 Bank' },
    { name: 'BTG Black', bank: 'BTG Pactual' },
    { name: 'BTG Mastercard', bank: 'BTG Pactual' },
    { name: 'Next Mastercard', bank: 'Next' },
    { name: 'PagBank Visa', bank: 'PagBank' },
    { name: 'PicPay Visa', bank: 'PicPay' },
    { name: 'Mercado Pago Mastercard', bank: 'Mercado Pago' },
    { name: 'Mercado Pago Visa', bank: 'Mercado Pago' },
    { name: 'Outros', bank: 'Outros' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.lastDigits) {
      alert('Por favor, preencha os campos obrigatórios');
      return;
    }

    const cardData = {
      ...formData,
      limit: parseFloat(formData.limit) || 0,
      dueDay: parseInt(formData.dueDay) || 10
    };

    onSave(cardData);
  };

  return (
    <div className="modal-overlay-focused" onClick={onCancel}>
      <div className="modal-content edit-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ Editar Cartão</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Cartão *</label>
              <select
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="form-input"
              >
                <option value="">Selecione o cartão</option>
                {cardOptions.map(cardOption => (
                  <option key={cardOption.name} value={cardOption.name}>
                    {cardOption.name} ({cardOption.bank})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Nome do Portador</label>
              <input
                type="text"
                value={formData.holderName}
                onChange={(e) => setFormData(prev => ({ ...prev, holderName: e.target.value.toUpperCase() }))}
                placeholder="NOME COMO APARECE NO CARTÃO"
                className="form-input"
                maxLength="26"
              />
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Últimos 4 Dígitos *</label>
                <input
                  type="text"
                  value={formData.lastDigits}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setFormData(prev => ({ ...prev, lastDigits: value }));
                  }}
                  placeholder="0000"
                  maxLength="4"
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Dia do Vencimento</label>
                <input
                  type="number"
                  value={formData.dueDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDay: e.target.value }))}
                  min="1"
                  max="31"
                  placeholder="10"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Limite (R$)</label>
              <input
                type="number"
                value={formData.limit}
                onChange={(e) => setFormData(prev => ({ ...prev, limit: e.target.value }))}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Observações</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ex: Cartão principal, cartão de emergência, etc."
                rows="3"
                className="form-textarea"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-success">
              💾 Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para Adicionar Banco
// Modal para Editar Banco
const EditBankModal = ({ bank, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: bank.name || '',
    holderName: bank.holderName || '',
    accountType: bank.accountType || 'corrente',
    notes: bank.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Por favor, preencha o nome do banco');
      return;
    }

    if (!formData.holderName) {
      alert('Por favor, preencha o nome do titular da conta');
      return;
    }

    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay-focused" onClick={onCancel}>
      <div className="modal-content edit-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ Editar Banco</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nome do Banco *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Banco do Brasil"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Nome do Titular da Conta *</label>
              <input
                type="text"
                name="holderName"
                value={formData.holderName}
                onChange={(e) => setFormData(prev => ({ ...prev, holderName: e.target.value.toUpperCase() }))}
                placeholder="NOME COMO APARECE NA CONTA"
                required
                className="form-input"
                maxLength="50"
              />
            </div>

            <div className="form-group">
              <label>Tipo de Conta *</label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                required
                className="form-input"
              >
                <option value="corrente">💳 Conta Corrente</option>
                <option value="poupanca">🏦 Conta Poupança</option>
                <option value="salario">💰 Conta Salário</option>
                <option value="investimento">📈 Conta Investimento</option>
                <option value="conjunta">👥 Conta Conjunta</option>
                <option value="empresarial">🏢 Conta Empresarial</option>
                <option value="digital">📱 Conta Digital</option>
                <option value="universitaria">🎓 Conta Universitária</option>
              </select>
            </div>

            <div className="form-group">
              <label>Observações</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Ex: Conta principal, conta salário, conta de investimentos, etc."
                rows="3"
                className="form-textarea"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-success">
              💾 Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddBankModal = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    icon: '🏦',
    holderName: '',
    accountType: 'corrente',
    notes: ''
  });

  const bankOptions = [
    { name: 'Banco do Brasil', icon: '🟨' },
    { name: 'Bradesco', icon: '🔴' },
    { name: 'Caixa Econômica', icon: '🔵' },
    { name: 'Itaú', icon: '🟠' },
    { name: 'Santander', icon: '🔴' },
    { name: 'Nubank', icon: '🟣' },
    { name: 'Inter', icon: '🟠' },
    { name: 'C6 Bank', icon: '⚫' },
    { name: 'XP Investimentos', icon: '🟡' },
    { name: 'BTG Pactual', icon: '🔵' },
    { name: 'Next', icon: '🟢' },
    { name: 'Neon', icon: '🟢' },
    { name: 'PagBank', icon: '🔵' },
    { name: 'Picpay', icon: '🟢' },
    { name: '99Pay', icon: '🟡' },
    { name: 'Mercado Pago', icon: '🔵' },
    { name: 'Stone', icon: '🟦' },
    { name: 'Outros', icon: '📱' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Por favor, selecione um banco');
      return;
    }

    if (!formData.holderName) {
      alert('Por favor, preencha o nome do titular da conta');
      return;
    }

    onSave(formData);
  };

  const handleBankSelect = (e) => {
    const selectedBank = bankOptions.find(bank => bank.name === e.target.value);
    setFormData(prev => ({
      ...prev,
      name: selectedBank?.name || '',
      icon: selectedBank?.icon || '🏦'
    }));
  };

  return (
    <div className="modal-overlay-focused" onClick={onCancel}>
      <div className="modal-content edit-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>➕ Adicionar Novo Banco</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Banco *</label>
              <select
                value={formData.name}
                onChange={handleBankSelect}
                required
                className="form-input"
              >
                <option value="">Selecione o banco</option>
                {bankOptions.map(bank => (
                  <option key={bank.name} value={bank.name}>
                    {bank.icon} {bank.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Nome do Titular da Conta *</label>
              <input
                type="text"
                value={formData.holderName}
                onChange={(e) => setFormData(prev => ({ ...prev, holderName: e.target.value.toUpperCase() }))}
                placeholder="NOME COMO APARECE NA CONTA"
                required
                className="form-input"
                maxLength="50"
              />
            </div>

            <div className="form-group">
              <label>Tipo de Conta *</label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value }))}
                required
                className="form-input"
              >
                <option value="corrente">💳 Conta Corrente</option>
                <option value="poupanca">🏦 Conta Poupança</option>
                <option value="salario">💰 Conta Salário</option>
                <option value="investimento">📈 Conta Investimento</option>
                <option value="conjunta">👥 Conta Conjunta</option>
                <option value="empresarial">🏢 Conta Empresarial</option>
                <option value="digital">📱 Conta Digital</option>
                <option value="universitaria">🎓 Conta Universitária</option>
              </select>
            </div>

            <div className="form-group">
              <label>Observações</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ex: Conta principal, conta salário, conta de investimentos, etc."
                rows="3"
                className="form-textarea"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-cancel" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-success">
              💾 Adicionar Banco
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
