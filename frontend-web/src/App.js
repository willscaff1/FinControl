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

// Modal de Edição de Transação
const EditTransactionModal = ({ transaction, onSave, onCancel }) => {
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
    installmentNumber: transaction.installmentNumber || 1,
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
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Editar Transação</h3>
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
                    <option value="Banco do Brasil">🟨 Banco do Brasil</option>
                    <option value="Bradesco">🔴 Bradesco</option>
                    <option value="Caixa Econômica">🔵 Caixa Econômica Federal</option>
                    <option value="Itaú">🟠 Itaú Unibanco</option>
                    <option value="Santander">🔴 Santander</option>
                    <option value="Nubank">🟣 Nubank</option>
                    <option value="Inter">🟠 Banco Inter</option>
                    <option value="C6 Bank">⚫ C6 Bank</option>
                    <option value="XP Investimentos">🟡 XP Investimentos</option>
                    <option value="BTG Pactual">🔵 BTG Pactual</option>
                    <option value="Next">🟢 Next (Bradesco)</option>
                    <option value="Neon">🟢 Neon</option>
                    <option value="PagBank">🔵 PagBank</option>
                    <option value="Picpay">🟢 PicPay</option>
                    <option value="99Pay">🟡 99Pay</option>
                    <option value="Mercado Pago">🔵 Mercado Pago</option>
                    <option value="Stone">🟦 Stone</option>
                    <option value="Outros">📱 Outros</option>
                  </select>
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
                    <optgroup label="🟨 Banco do Brasil">
                      <option value="BB Visa">BB Visa</option>
                      <option value="BB Mastercard">BB Mastercard</option>
                      <option value="BB Elo">BB Elo</option>
                    </optgroup>
                    <optgroup label="🔴 Bradesco">
                      <option value="Bradesco Visa">Bradesco Visa</option>
                      <option value="Bradesco Mastercard">Bradesco Mastercard</option>
                      <option value="Bradesco Elo">Bradesco Elo</option>
                    </optgroup>
                    <optgroup label="🔵 Caixa Econômica">
                      <option value="Caixa Visa">Caixa Visa</option>
                      <option value="Caixa Mastercard">Caixa Mastercard</option>
                      <option value="Caixa Elo">Caixa Elo</option>
                    </optgroup>
                    <optgroup label="🟠 Itaú">
                      <option value="Itaú Visa">Itaú Visa</option>
                      <option value="Itaú Mastercard">Itaú Mastercard</option>
                      <option value="Itaú Elo">Itaú Elo</option>
                    </optgroup>
                    <optgroup label="🔴 Santander">
                      <option value="Santander Visa">Santander Visa</option>
                      <option value="Santander Mastercard">Santander Mastercard</option>
                    </optgroup>
                    <optgroup label="🟣 Nubank">
                      <option value="Nubank Mastercard">Nubank Mastercard</option>
                    </optgroup>
                    <optgroup label="🟠 Inter">
                      <option value="Inter Mastercard">Inter Mastercard</option>
                      <option value="Inter Visa">Inter Visa</option>
                    </optgroup>
                    <optgroup label="⚫ C6 Bank">
                      <option value="C6 Mastercard">C6 Mastercard</option>
                    </optgroup>
                    <optgroup label="🔵 BTG Pactual">
                      <option value="BTG Black">BTG Black</option>
                      <option value="BTG Mastercard">BTG Mastercard</option>
                    </optgroup>
                    <optgroup label="🟢 Next">
                      <option value="Next Mastercard">Next Mastercard</option>
                    </optgroup>
                    <optgroup label="🔵 PagBank">
                      <option value="PagBank Visa">PagBank Visa</option>
                    </optgroup>
                    <optgroup label="🟢 PicPay">
                      <option value="PicPay Visa">PicPay Visa</option>
                    </optgroup>
                    <optgroup label="🔵 Mercado Pago">
                      <option value="Mercado Pago Mastercard">Mercado Pago Mastercard</option>
                    </optgroup>
                    <option value="Outros">💳 Outros</option>
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
                    disabled={transaction.recurringParentId || transaction.isRecurring || (transaction.installmentParentId || transaction.installmentNumber > 0)}
                    style={{ opacity: (transaction.recurringParentId || transaction.isRecurring || (transaction.installmentParentId || transaction.installmentNumber > 0)) ? 0.5 : 1 }}
                  />
                  <span className={`checkbox-text ${(transaction.installmentParentId || transaction.installmentNumber > 0) ? 'disabled-text' : ''}`}>
                    Transação Fixa (repete todos os meses)
                  </span>
                </label>
              </div>

              {/* 7. PARCELAMENTO */}
              <div className="form-group">
                <label className={`checkbox-label ${formData.isRecurring || (transaction.installmentParentId || transaction.installmentNumber > 0) ? 'disabled' : ''}`}>
                  <input
                    type="checkbox"
                    name="isInstallment"
                    checked={formData.isInstallment}
                    disabled={formData.isRecurring || (transaction.installmentParentId || transaction.installmentNumber > 0)}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isInstallment: e.target.checked,
                      // Se ativar parcelamento e estiver no PIX, mudar para débito
                      paymentMethod: (e.target.checked && prev.paymentMethod === 'pix') ? 'debito' : prev.paymentMethod
                    }))}
                    style={{ opacity: (formData.isRecurring || (transaction.installmentParentId || transaction.installmentNumber > 0)) ? 0.5 : 1 }}
                  />
                  <span className={`checkbox-text ${(transaction.installmentParentId || transaction.installmentNumber > 0) ? 'disabled-text' : ''}`}>
                    Parcelado (crédito/débito apenas)
                    {transaction.installmentNumber > 0 && (
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
                    disabled={transaction.installmentParentId || transaction.installmentNumber > 0}
                    style={{ opacity: (transaction.installmentParentId || transaction.installmentNumber > 0) ? 0.5 : 1 }}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      totalInstallments: parseInt(e.target.value) || 2
                    }))}
                    required
                  />
                  <small className="helper-text">
                    {(transaction.installmentParentId || transaction.installmentNumber > 0) 
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
    totalInstallments: 2,
    bank: '',
    creditCard: ''
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

            {/* Campo Banco (para débito e PIX) */}
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
                  <option value="Banco do Brasil">🟨 Banco do Brasil</option>
                  <option value="Bradesco">🔴 Bradesco</option>
                  <option value="Caixa Econômica">🔵 Caixa Econômica Federal</option>
                  <option value="Itaú">🟠 Itaú Unibanco</option>
                  <option value="Santander">🔴 Santander</option>
                  <option value="Nubank">🟣 Nubank</option>
                  <option value="Inter">🟠 Banco Inter</option>
                  <option value="C6 Bank">⚫ C6 Bank</option>
                  <option value="XP Investimentos">🟡 XP Investimentos</option>
                  <option value="BTG Pactual">🔵 BTG Pactual</option>
                  <option value="Next">🟢 Next (Bradesco)</option>
                  <option value="Neon">🟢 Neon</option>
                  <option value="PagBank">🔵 PagBank</option>
                  <option value="Picpay">🟢 PicPay</option>
                  <option value="99Pay">🟡 99Pay</option>
                  <option value="Mercado Pago">🔵 Mercado Pago</option>
                  <option value="Stone">🟦 Stone</option>
                  <option value="Outros">📱 Outros</option>
                </select>
              </div>
            )}

            {/* Campo Cartão (para crédito) */}
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
                  <optgroup label="🟨 Banco do Brasil">
                    <option value="BB Visa">BB Visa</option>
                    <option value="BB Mastercard">BB Mastercard</option>
                    <option value="BB Elo">BB Elo</option>
                  </optgroup>
                  <optgroup label="🔴 Bradesco">
                    <option value="Bradesco Visa">Bradesco Visa</option>
                    <option value="Bradesco Mastercard">Bradesco Mastercard</option>
                    <option value="Bradesco Elo">Bradesco Elo</option>
                  </optgroup>
                  <optgroup label="🔵 Caixa Econômica">
                    <option value="Caixa Visa">Caixa Visa</option>
                    <option value="Caixa Mastercard">Caixa Mastercard</option>
                    <option value="Caixa Elo">Caixa Elo</option>
                  </optgroup>
                  <optgroup label="🟠 Itaú">
                    <option value="Itaú Visa">Itaú Visa</option>
                    <option value="Itaú Mastercard">Itaú Mastercard</option>
                    <option value="Itaú Elo">Itaú Elo</option>
                  </optgroup>
                  <optgroup label="🔴 Santander">
                    <option value="Santander Visa">Santander Visa</option>
                    <option value="Santander Mastercard">Santander Mastercard</option>
                  </optgroup>
                  <optgroup label="🟣 Nubank">
                    <option value="Nubank Mastercard">Nubank Mastercard</option>
                  </optgroup>
                  <optgroup label="🟠 Inter">
                    <option value="Inter Mastercard">Inter Mastercard</option>
                    <option value="Inter Visa">Inter Visa</option>
                  </optgroup>
                  <optgroup label="⚫ C6 Bank">
                    <option value="C6 Mastercard">C6 Mastercard</option>
                  </optgroup>
                  <optgroup label="🔵 BTG Pactual">
                    <option value="BTG Black">BTG Black</option>
                    <option value="BTG Mastercard">BTG Mastercard</option>
                  </optgroup>
                  <optgroup label="🟢 Next">
                    <option value="Next Mastercard">Next Mastercard</option>
                  </optgroup>
                  <optgroup label="🔵 PagBank">
                    <option value="PagBank Visa">PagBank Visa</option>
                  </optgroup>
                  <optgroup label="🟢 PicPay">
                    <option value="PicPay Visa">PicPay Visa</option>
                  </optgroup>
                  <optgroup label="🔵 Mercado Pago">
                    <option value="Mercado Pago Mastercard">Mercado Pago Mastercard</option>
                  </optgroup>
                  <option value="Outros">💳 Outros</option>
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
      // Criar banco automaticamente se selecionado
      if (transactionData.bank && (transactionData.paymentMethod === 'debito' || transactionData.paymentMethod === 'pix')) {
        try {
          // Verificar se o banco já existe
          const existingBanks = await axios.get('/banks');
          const bankExists = existingBanks.data.some(bank => bank.name === transactionData.bank);
          
          if (!bankExists) {
            // Criar novo banco
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
            
            const bankData = bankOptions.find(bank => bank.name === transactionData.bank);
            const newBank = {
              name: transactionData.bank,
              icon: bankData?.icon || '🏦',
              accountType: 'corrente',
              notes: 'Criado automaticamente via transação'
            };
            
            await axios.post('/banks', newBank);
            console.log(`Banco ${transactionData.bank} criado automaticamente`);
          }
        } catch (error) {
          console.error('Erro ao criar banco automaticamente:', error);
        }
      }

      // Criar cartão automaticamente se selecionado
      if (transactionData.creditCard && transactionData.paymentMethod === 'credito') {
        try {
          // Verificar se o cartão já existe
          const existingCards = await axios.get('/credit-cards');
          const cardExists = existingCards.data.some(card => card.name === transactionData.creditCard);
          
          if (!cardExists) {
            // Criar novo cartão
            const newCard = {
              name: transactionData.creditCard,
              lastDigits: '0000', // Valor padrão - usuário pode editar depois
              limit: 1000, // Limite padrão - usuário pode editar depois
              dueDay: 10, // Dia padrão - usuário pode editar depois
              notes: 'Criado automaticamente via transação. Edite os dados do cartão.'
            };
            
            await axios.post('/credit-cards', newCard);
            console.log(`Cartão ${transactionData.creditCard} criado automaticamente`);
          }
        } catch (error) {
          console.error('Erro ao criar cartão automaticamente:', error);
        }
      }

      // Criar a transação
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
      // Criar banco automaticamente se selecionado
      if (transactionData.bank && (transactionData.paymentMethod === 'debito' || transactionData.paymentMethod === 'pix')) {
        try {
          // Verificar se o banco já existe
          const existingBanks = await axios.get('/banks');
          const bankExists = existingBanks.data.some(bank => bank.name === transactionData.bank);
          
          if (!bankExists) {
            // Criar novo banco
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
            
            const bankData = bankOptions.find(bank => bank.name === transactionData.bank);
            const newBank = {
              name: transactionData.bank,
              icon: bankData?.icon || '🏦',
              accountType: 'corrente',
              notes: 'Criado automaticamente via transação'
            };
            
            await axios.post('/banks', newBank);
            console.log(`Banco ${transactionData.bank} criado automaticamente`);
          }
        } catch (error) {
          console.error('Erro ao criar banco automaticamente:', error);
        }
      }

      // Criar cartão automaticamente se selecionado
      if (transactionData.creditCard && transactionData.paymentMethod === 'credito') {
        try {
          // Verificar se o cartão já existe
          const existingCards = await axios.get('/credit-cards');
          const cardExists = existingCards.data.some(card => card.name === transactionData.creditCard);
          
          if (!cardExists) {
            // Criar novo cartão
            const newCard = {
              name: transactionData.creditCard,
              lastDigits: '0000', // Valor padrão - usuário pode editar depois
              limit: 1000, // Limite padrão - usuário pode editar depois
              dueDay: 10, // Dia padrão - usuário pode editar depois
              notes: 'Criado automaticamente via transação. Edite os dados do cartão.'
            };
            
            await axios.post('/credit-cards', newCard);
            console.log(`Cartão ${transactionData.creditCard} criado automaticamente`);
          }
        } catch (error) {
          console.error('Erro ao criar cartão automaticamente:', error);
        }
      }

      // Criar a transação
      await axios.post('/transactions', transactionData);
      setShowAddModal(false);
      alert('Transação adicionada com sucesso!');
      loadTransactions();
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      alert('Erro ao adicionar transação');
    }
  };

  const handleEditTransaction = async (transactionData) => {
    try {
      const response = await axios.put(`/transactions/${editingTransaction._id}`, transactionData);
      
      setShowEditModal(false);
      setEditingTransaction(null);
      alert('Transação editada com sucesso!');
      
      // Recarregar transações para garantir sincronização
      loadTransactions();
    } catch (error) {
      console.error('Erro ao editar transação:', error);
      alert('Erro ao editar transação');
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
                        // Se for transação fixa ou parcelada, mostra modal de confirmação especial
                        if (transaction.isRecurring || transaction.recurringParentId || 
                            transaction.isInstallment || transaction.installmentParentId || 
                            transaction.installmentNumber > 0) {
                          setShowConfirmDeleteAllModal(true);
                        } else {
                          setShowDeleteModal(true);
                        }
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

      {/* Modal de Edição */}
      {showEditModal && editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onSave={handleEditTransaction}
          onCancel={() => {
            setShowEditModal(false);
            setEditingTransaction(null);
          }}
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

      {/* Modal de confirmação especial para transações fixas/parceladas */}
      {showConfirmDeleteAllModal && transactionToDelete && (
        <div className="modal-overlay" onClick={() => setShowConfirmDeleteAllModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {transactionToDelete.isRecurring || transactionToDelete.recurringParentId 
                  ? '🔄 Deletar Transação Fixa' 
                  : '💳 Deletar Parcelamento'
                }
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowConfirmDeleteAllModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="transaction-preview">
                <strong>{transactionToDelete.description}</strong>
                <span className={`amount ${transactionToDelete.type}`}>
                  {transactionToDelete.type === 'income' ? '+' : '-'}R$ {(transactionToDelete.amount || 0).toFixed(2)}
                </span>
                {transactionToDelete.installmentNumber > 0 && (
                  <small style={{ display: 'block', marginTop: '5px', opacity: 0.7 }}>
                    Parcela {transactionToDelete.installmentNumber} de {transactionToDelete.totalInstallments}
                  </small>
                )}
              </div>
              
              {transactionToDelete.isRecurring || transactionToDelete.recurringParentId ? (
                <div className="delete-options">
                  <p><strong>Esta é uma transação fixa.</strong></p>
                  <p>O que deseja fazer?</p>
                </div>
              ) : (
                <div className="delete-options">
                  <p><strong>Esta é uma transação parcelada.</strong></p>
                  <p>O que deseja fazer?</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowConfirmDeleteAllModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-warning"
                onClick={() => {
                  handleDeleteTransaction(false);
                  setShowConfirmDeleteAllModal(false);
                }}
              >
                🗓️ Deletar Apenas Este Mês
              </button>
              <button 
                className="btn-danger"
                onClick={() => {
                  handleDeleteTransaction(true);
                  setShowConfirmDeleteAllModal(false);
                }}
              >
                🗑️ Deletar {transactionToDelete.isRecurring || transactionToDelete.recurringParentId ? 'Todos os Meses' : 'Todas as Parcelas'}
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
  const [creditCards, setCreditCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardToDelete, setCardToDelete] = useState(null);

  // Carregar cartões e transações
  const loadData = async () => {
    try {
      // Carregar cartões cadastrados
      const cardsResponse = await axios.get('/credit-cards');
      setCreditCards(cardsResponse.data || []);

      // Carregar transações para calcular gastos
      const transactionsResponse = await axios.get('/transactions');
      setTransactions(transactionsResponse.data || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setCreditCards([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcular gastos de um cartão baseado nas transações
  const calculateCardExpenses = (cardName) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const cardTransactions = transactions.filter(t => 
      t.creditCard === cardName && 
      t.paymentMethod === 'credito' &&
      new Date(t.date).getMonth() + 1 === currentMonth &&
      new Date(t.date).getFullYear() === currentYear
    );
    
    return cardTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  // Adicionar novo cartão
  const handleAddCard = async (cardData) => {
    try {
      await axios.post('/credit-cards', cardData);
      setShowAddCardModal(false);
      loadData();
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
      loadData();
      alert('Cartão atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao editar cartão:', error);
      alert('Erro ao editar cartão');
    }
  };

  // Deletar cartão
  const handleDeleteCard = async () => {
    try {
      // Verificar se há transações vinculadas
      const cardTransactions = transactions.filter(t => t.creditCard === cardToDelete.name);
      if (cardTransactions.length > 0) {
        alert(`Não é possível deletar este cartão. Existem ${cardTransactions.length} transação(ões) vinculada(s) a ele.`);
        return;
      }

      await axios.delete(`/credit-cards/${cardToDelete._id}`);
      setShowDeleteModal(false);
      setCardToDelete(null);
      loadData();
      alert('Cartão deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar cartão:', error);
      alert('Erro ao deletar cartão');
    }
  };

  // Calcular percentual usado do limite
  const calculateUsagePercentage = (expenses, limit) => {
    if (!limit || limit <= 0) return 0;
    return Math.min((expenses / limit) * 100, 100);
  };

  // Formatar data de vencimento
  const formatDueDate = (day) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    return `${String(day).padStart(2, '0')}/${String(currentMonth).padStart(2, '0')}/${currentYear}`;
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div className="page loading">Carregando cartões...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">💳 Meus Cartões</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddCardModal(true)}
        >
          + Adicionar Cartão
        </button>
      </div>

      <div className="cards-container">
        {creditCards.length > 0 ? (
          <div className="cards-grid">
            {creditCards.map((card) => {
              const expenses = calculateCardExpenses(card.name);
              const usagePercentage = calculateUsagePercentage(expenses, card.limit);
              const transactionCount = transactions.filter(t => t.creditCard === card.name).length;
              
              return (
                <div key={card._id} className="credit-card">
                  <div className="card-header">
                    <div className="card-info">
                      <h3>{card.name}</h3>
                      <span className="card-number">**** {card.lastDigits}</span>
                    </div>
                    <div className="card-actions">
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
                  
                  <div className="card-body">
                    <div className="card-balance">
                      <div className="balance-info">
                        <span className="balance-label">Gasto este mês:</span>
                        <span className="balance-value expense">
                          R$ {expenses.toFixed(2)}
                        </span>
                      </div>
                      <div className="balance-info">
                        <span className="balance-label">Limite:</span>
                        <span className="balance-value">
                          R$ {card.limit?.toFixed(2) || '0,00'}
                        </span>
                      </div>
                    </div>
                    
                    {card.limit > 0 && (
                      <div className="usage-bar">
                        <div className="usage-label">
                          <span>Limite usado</span>
                          <span>{usagePercentage.toFixed(1)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className={`progress-fill ${usagePercentage > 80 ? 'danger' : usagePercentage > 60 ? 'warning' : 'normal'}`}
                            style={{ width: `${usagePercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="card-footer">
                      <div className="card-details">
                        <span>🗓️ Vence dia {card.dueDay}</span>
                        <span>📊 {transactionCount} transação(ões)</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-cards">
            <h3>💳 Nenhum cartão cadastrado</h3>
            <p>Adicione seus cartões para controlar seus gastos</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddCardModal(true)}
            >
              + Adicionar Primeiro Cartão
            </button>
          </div>
        )}
      </div>

      {/* Modais */}
      {showAddCardModal && (
        <AddCreditCardModal 
          onSave={handleAddCard}
          onCancel={() => setShowAddCardModal(false)}
        />
      )}

      {showEditCardModal && selectedCard && (
        <EditCreditCardModal 
          card={selectedCard}
          onSave={handleEditCard}
          onCancel={() => {
            setShowEditCardModal(false);
            setSelectedCard(null);
          }}
        />
      )}

      {showDeleteModal && cardToDelete && (
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
              <p>Tem certeza que deseja deletar este cartão?</p>
              <div className="card-preview">
                <strong>{cardToDelete.name}</strong>
                <span>**** {cardToDelete.lastDigits}</span>
              </div>
              <small style={{ color: '#666', marginTop: '10px', display: 'block' }}>
                ⚠️ Só é possível deletar cartões sem transações vinculadas
              </small>
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
                onClick={handleDeleteCard}
              >
                🗑️ Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal para Adicionar Cartão de Crédito
const AddCreditCardModal = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    lastDigits: '',
    limit: '',
    dueDay: '',
    notes: ''
  });

  const cardOptions = [
    { name: 'BB Visa', bank: 'Banco do Brasil' },
    { name: 'BB Mastercard', bank: 'Banco do Brasil' },
    { name: 'BB Elo', bank: 'Banco do Brasil' },
    { name: 'Bradesco Visa', bank: 'Bradesco' },
    { name: 'Bradesco Mastercard', bank: 'Bradesco' },
    { name: 'Bradesco Elo', bank: 'Bradesco' },
    { name: 'Caixa Visa', bank: 'Caixa Econômica' },
    { name: 'Caixa Mastercard', bank: 'Caixa Econômica' },
    { name: 'Caixa Elo', bank: 'Caixa Econômica' },
    { name: 'Itaú Visa', bank: 'Itaú' },
    { name: 'Itaú Mastercard', bank: 'Itaú' },
    { name: 'Itaú Elo', bank: 'Itaú' },
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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Adicionar Novo Cartão</h3>
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
              >
                <option value="">Selecione o cartão</option>
                {cardOptions.map(card => (
                  <option key={card.name} value={card.name}>
                    {card.name} ({card.bank})
                  </option>
                ))}
              </select>
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
              />
            </div>

            <div className="form-group">
              <label>Observações</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ex: Cartão principal, cartão de emergência, etc."
                rows="3"
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
    lastDigits: card.lastDigits || '',
    limit: card.limit || '',
    dueDay: card.dueDay || '',
    notes: card.notes || ''
  });

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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar Cartão</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nome do Cartão *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
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
              />
            </div>

            <div className="form-group">
              <label>Observações</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ex: Cartão principal, cartão de emergência, etc."
                rows="3"
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

// Página Bancos
const BanksPage = () => {
  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankToDelete, setBankToDelete] = useState(null);

  // Carregar bancos e transações
  const loadData = async () => {
    try {
      // Carregar bancos cadastrados
      const banksResponse = await axios.get('/banks');
      setBanks(banksResponse.data || []);

      // Carregar transações para calcular saldos
      const transactionsResponse = await axios.get('/transactions');
      setTransactions(transactionsResponse.data || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setBanks([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcular saldo de um banco baseado nas transações
  const calculateBankBalance = (bankName) => {
    const bankTransactions = transactions.filter(t => t.bank === bankName);
    return bankTransactions.reduce((sum, t) => {
      if (t.type === 'income') {
        return sum + (t.amount || 0);
      } else {
        return sum - (t.amount || 0);
      }
    }, 0);
  };

  // Adicionar novo banco
  const handleAddBank = async (bankData) => {
    try {
      await axios.post('/banks', bankData);
      setShowAddBankModal(false);
      loadData();
      alert('Banco adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar banco:', error);
      alert('Erro ao adicionar banco');
    }
  };

  // Editar banco
  const handleEditBank = async (bankData) => {
    try {
      await axios.put(`/banks/${selectedBank._id}`, bankData);
      setShowEditBankModal(false);
      setSelectedBank(null);
      loadData();
      alert('Banco atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao editar banco:', error);
      alert('Erro ao editar banco');
    }
  };

  // Deletar banco
  const handleDeleteBank = async () => {
    try {
      // Verificar se há transações vinculadas
      const bankTransactions = transactions.filter(t => t.bank === bankToDelete.name);
      if (bankTransactions.length > 0) {
        alert(`Não é possível deletar este banco. Existem ${bankTransactions.length} transação(ões) vinculada(s) a ele.`);
        return;
      }

      await axios.delete(`/banks/${bankToDelete._id}`);
      setShowDeleteModal(false);
      setBankToDelete(null);
      loadData();
      alert('Banco deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar banco:', error);
      alert('Erro ao deletar banco');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div className="page loading">Carregando bancos...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🏦 Meus Bancos</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddBankModal(true)}
        >
          + Adicionar Banco
        </button>
      </div>

      <div className="banks-container">
        {banks.length > 0 ? (
          <div className="banks-grid">
            {banks.map((bank) => {
              const balance = calculateBankBalance(bank.name);
              const transactionCount = transactions.filter(t => t.bank === bank.name).length;
              
              return (
                <div key={bank._id} className="bank-card">
                  <div className="bank-header">
                    <h3>{bank.icon} {bank.name}</h3>
                    <div className="bank-actions">
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
                        �️
                      </button>
                    </div>
                  </div>
                  
                  <div className="bank-info">
                    <div className="bank-balance">
                      <span className="balance-label">Saldo:</span>
                      <span className={`balance-value ${balance >= 0 ? 'positive' : 'negative'}`}>
                        R$ {balance.toFixed(2)}
                      </span>
                    </div>
                    <div className="bank-stats">
                      <small>{transactionCount} transação(ões)</small>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-banks">
            <h3>🏦 Nenhum banco cadastrado</h3>
            <p>Adicione seus bancos para começar a organizar suas finanças</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddBankModal(true)}
            >
              + Adicionar Primeiro Banco
            </button>
          </div>
        )}
      </div>

      {/* Modais */}
      {showAddBankModal && (
        <AddBankModal 
          onSave={handleAddBank}
          onCancel={() => setShowAddBankModal(false)}
        />
      )}

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

      {showDeleteModal && bankToDelete && (
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
              <p>Tem certeza que deseja deletar este banco?</p>
              <div className="bank-preview">
                <strong>{bankToDelete.icon} {bankToDelete.name}</strong>
              </div>
              <small style={{ color: '#666', marginTop: '10px', display: 'block' }}>
                ⚠️ Só é possível deletar bancos sem transações vinculadas
              </small>
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
                onClick={handleDeleteBank}
              >
                🗑️ Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal para Adicionar Banco
const AddBankModal = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    icon: '🏦',
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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Adicionar Novo Banco</h3>
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
              <label>Tipo de Conta</label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value }))}
              >
                <option value="corrente">Conta Corrente</option>
                <option value="poupanca">Poupança</option>
                <option value="investimento">Conta Investimento</option>
              </select>
            </div>

            <div className="form-group">
              <label>Observações</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ex: Conta principal, conta salário, etc."
                rows="3"
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

// Modal para Editar Banco
const EditBankModal = ({ bank, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: bank.name || '',
    icon: bank.icon || '🏦',
    accountType: bank.accountType || 'corrente',
    notes: bank.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Por favor, preencha o nome do banco');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar Banco</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nome do Banco *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                readOnly
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
              <small className="helper-text">O nome do banco não pode ser alterado</small>
            </div>

            <div className="form-group">
              <label>Tipo de Conta</label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value }))}
              >
                <option value="corrente">Conta Corrente</option>
                <option value="poupanca">Poupança</option>
                <option value="investimento">Conta Investimento</option>
              </select>
            </div>

            <div className="form-group">
              <label>Observações</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ex: Conta principal, conta salário, etc."
                rows="3"
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
