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

// Context para Modal de Nova Transação
const NewTransactionContext = createContext();
const useNewTransaction = () => useContext(NewTransactionContext);

// Provider para Modal de Nova Transação
const NewTransactionProvider = ({ children }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  
  const openModal = () => setShowAddModal(true);
  const closeModal = () => setShowAddModal(false);
  
  return (
    <NewTransactionContext.Provider value={{ showAddModal, openModal, closeModal }}>
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
  const navigate = useNavigate();
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
                    {creditCards.map((card) => (
                      <option key={card._id} value={card.name}>
                        {card.name}
                      </option>
                    ))}
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

// Modal de Nova Transação
const AddTransactionModal = ({ onSave, onCancel, creditCards = [] }) => {
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

    console.log('Dados da transação sendo enviados:', transactionData);

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
    <div className="modal-overlay-focused" onClick={onCancel}>
      <div className="modal-content edit-transaction-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>➕ Nova Transação</h3>
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
                  {creditCards.map((card) => (
                    <option key={card._id} value={card.name}>
                      {card.name}
                    </option>
                  ))}
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
  const navigate = useNavigate();
  const [data, setData] = useState({
    stats: {
      balance: 0,
      income: 0,
      expense: 0
    },
    recentTransactions: []
  });
  const [creditCards, setCreditCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [currentModalMonth, setCurrentModalMonth] = useState(new Date().getMonth());
  const [currentModalYear, setCurrentModalYear] = useState(new Date().getFullYear());

  const loadData = async (month = selectedMonth, year = selectedYear) => {
    try {
      const response = await axios.get(`/dashboard?month=${month}&year=${year}`);
      setData(response.data || {
        stats: { balance: 0, income: 0, expense: 0 },
        recentTransactions: []
      });
      
  // Carregar cartões de crédito
      const cardsResponse = await axios.get('/credit-cards');
      setCreditCards(cardsResponse.data || []);
      
      // Carregar transações para cálculos dos cartões
      const transactionsResponse = await axios.get(`/transactions`);
      setTransactions(transactionsResponse.data || []);
      
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

  const getDashboardCardTransactionsByMonth = (cardName, month, year) => {
    if (!transactions || !Array.isArray(transactions)) return [];
    
    return transactions.filter(transaction => {
      if (!transaction.date) return false;
      
      const transactionDate = new Date(transaction.date);
      const transactionMonth = transactionDate.getMonth();
      const transactionYear = transactionDate.getFullYear();
      
      const isCorrectMonth = transactionMonth === month && transactionYear === year;
      const isCorrectCard = transaction.creditCard === cardName;
      const isCorrectType = transaction.paymentMethod === 'credito';
      
      return isCorrectMonth && isCorrectCard && isCorrectType;
    });
  };

  const calculateDashboardCardExpensesByMonth = (cardName, month, year) => {
    const monthTransactions = getDashboardCardTransactionsByMonth(cardName, month, year);
    return monthTransactions.reduce((sum, transaction) => {
      return sum + (transaction.amount || 0);
    }, 0);
  };

  const calculateDashboardCardExpenses = (cardName) => {
    if (!transactions || !Array.isArray(transactions)) return 0;
    
    return transactions
      .filter(t => t.creditCard === cardName && t.paymentMethod === 'credito')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  const calculateDashboardCommittedBalance = (cardName) => {
    // Implementação simples - pode ser expandida conforme necessário
    return 0;
  };

  const closeCardModal = () => {
    setSelectedCardForModal(null);
    setShowCardModal(false);
  };

  useEffect(() => {
    loadData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

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
      console.log('🔍 Verificando se deve criar cartão:', {
        creditCard: transactionData.creditCard,
        paymentMethod: transactionData.paymentMethod,
        shouldCreate: transactionData.creditCard && transactionData.paymentMethod === 'credito'
      });
      
      if (transactionData.creditCard && transactionData.paymentMethod === 'credito') {
        console.log('💳 Dashboard - Tentando criar cartão:', transactionData.creditCard);
        try {
          // Verificar se o cartão já existe
          const existingCards = await axios.get('/credit-cards');
          console.log('💳 Dashboard - Cartões existentes:', existingCards.data.map(c => c.name));
          const cardExists = existingCards.data.some(card => card.name === transactionData.creditCard);
          console.log('💳 Dashboard - Cartão já existe?', cardExists);
          
          if (!cardExists) {
            console.log('💳 Dashboard - Criando novo cartão:', transactionData.creditCard);
            // Criar novo cartão
            const newCard = {
              name: transactionData.creditCard,
              lastDigits: '0000', // Valor padrão - usuário pode editar depois
              limit: 1000, // Limite padrão - usuário pode editar depois
              dueDay: 10, // Dia padrão - usuário pode editar depois
              notes: 'Criado automaticamente via transação. Edite os dados do cartão.'
            };
            
            await axios.post('/credit-cards', newCard);
            console.log(`💳 Dashboard - Cartão ${transactionData.creditCard} criado automaticamente`);
          }
        } catch (error) {
          console.error('💳 Dashboard - Erro ao criar cartão automaticamente:', error);
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

  useEffect(() => {
    loadData();
    
    // Listener para recarregar quando uma transação for adicionada
    const handleTransactionAdded = () => {
      loadData();
    };
    
    window.addEventListener('transactionAdded', handleTransactionAdded);
    
    return () => {
      window.removeEventListener('transactionAdded', handleTransactionAdded);
    };
  }, []);

  if (loading) {
    return <div className="page loading">Carregando dashboard...</div>;
  }

  return (
    <div className="page">
      <PageHeaderWithMonthSelector 
        title="Dashboard"
        icon="📊"
        subtitle="Resumo financeiro do período"
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={loadData}
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
                const expenses = 0; // No dashboard, não calculamos gastos específicos
                const committed = 0; // No dashboard, não calculamos comprometido específico
                const usagePercentage = card.totalLimit > 0 ? ((card.usedLimit || 0) / card.totalLimit) * 100 : 0;
                const committedPercentage = 0;
                const totalPercentage = Math.min(usagePercentage + committedPercentage, 100);

                return (
                  <div key={card._id} className="credit-card-simple">
                    <div 
                      className={`card-content-simple ${getBrandClass(card.flag)}`}
                      onClick={() => openCardModal(card)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Header com nome do cartão apenas (sem botões de ação) */}
                      <div className="card-header-simple">
                        <div className="card-name-header">
                          <h3 className="card-name-top">{card.name}</h3>
                        </div>
                      </div>

                      {/* 1. Dados financeiros */}
                      <div className="card-financial-data">
                        <div className="financial-row">
                          <div className="financial-item">
                            <span className="financial-label">Limite</span>
                            <span className="financial-value">R$ {(card.totalLimit || 0).toFixed(2)}</span>
                          </div>
                          <div className="financial-item">
                            <span className="financial-label">Gasto</span>
                            <span className="financial-value expense">R$ {(card.usedLimit || 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="financial-row">
                          <div className="financial-item">
                            <span className="financial-label">Comprometido</span>
                            <span className="financial-value committed">R$ 0.00</span>
                          </div>
                          <div className="financial-item">
                            <span className="financial-label">Disponível</span>
                            <span className="financial-value available">R$ {Math.max(0, (card.totalLimit || 0) - (card.usedLimit || 0)).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                        
                      {/* 2. Barra de utilização */}
                      {card.totalLimit > 0 && (
                        <div className="usage-bar-simple">
                          <div className="usage-info-simple">
                            <span>Utilizado: {totalPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="progress-bar-simple">
                            <div 
                              className={`progress-fill-simple current ${usagePercentage > 80 ? 'danger' : usagePercentage > 60 ? 'warning' : 'normal'}`}
                              style={{ width: `${usagePercentage}%` }}
                            />
                            <div 
                              className="progress-fill-simple committed"
                              style={{ 
                                width: `${committedPercentage}%`,
                                marginLeft: `${usagePercentage}%`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* 3. Footer com número do cartão, portador e bandeira */}
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
                          {transaction.isFixed && (
                            <span className="fixed-badge">FIXA</span>
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
                  onClick={() => setShowAddModal(true)}
                >
                  ➕ Adicionar Primeira Transação
                </button>
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
          creditCards={creditCards}
        />
      )}

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
                    <div className="modal-stat-label">Gasto neste mês</div>
                    <div className="modal-stat-value expense">
                      R$ {calculateDashboardCardExpensesByMonth(selectedCardForModal.name, currentModalMonth, currentModalYear).toFixed(2)}
                    </div>
                  </div>
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">Número de transações</div>
                    <div className="modal-stat-value">
                      {getDashboardCardTransactionsByMonth(selectedCardForModal.name, currentModalMonth, currentModalYear).length}
                    </div>
                  </div>
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">Disponível total</div>
                    <div className="modal-stat-value available">
                      R$ {Math.max(0, (selectedCardForModal.limit || 0) - 
                          calculateDashboardCardExpenses(selectedCardForModal.name) - 
                          calculateDashboardCommittedBalance(selectedCardForModal.name)).toFixed(2)}
                    </div>
                  </div>
                  <div className="modal-stat-item">
                    <div className="modal-stat-label">Limite total</div>
                    <div className="modal-stat-value">
                      R$ {(selectedCardForModal.limit || 0).toFixed(2)}
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

                      return (
                        <div key={transaction._id || index} className="transaction-item-extract">
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
                                {transaction.isFixed && (
                                  <span className="fixed-badge">FIXA</span>
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
    </div>
  );
};
                </div>
                
                <div className="transactions-list-enhanced" style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '1rem' }}>
                  {console.log('🔍 Total de transações:', transactions.length)}
                  {console.log('🔍 Cartão selecionado:', selectedCard.name)}
                  {console.log('🔍 Transações filtradas:', transactions.filter(t => t.creditCard === selectedCard.name))}
                  {transactions
                    .filter(t => {
                      // Filtrar por cartão (verificar tanto creditCard quanto cardName)
                      const matchCard = t.creditCard === selectedCard.name || t.cardName === selectedCard.name;
                      const matchMethod = t.paymentMethod === 'credito';
                      console.log('🔍 Transação:', t.description, 'Card:', t.creditCard, 'Method:', t.paymentMethod, 'Match:', matchCard && matchMethod);
                      return matchCard && matchMethod;
                    })
                    .map((transaction, index) => {
                      // Ícones bonitos baseados na categoria (IGUAL À PÁGINA DE TRANSACTIONS)
                      const getIconForCategory = (category, type) => {
                        const categoryIcons = {
                          'alimentacao': '�', 'alimentação': '🍕', 'comida': '�', 'restaurante': '🍽️',
                          'transporte': '🚗', 'combustivel': '⛽', 'combustível': '⛽', 'uber': '�',
                          'saude': '🏥', 'saúde': '🏥', 'farmacia': '💊', 'farmácia': '💊',
                          'educacao': '📚', 'educação': '📚', 'curso': '�', 'livros': '📖',
                          'lazer': '�', 'entretenimento': '🎬', 'cinema': '🎬', 'netflix': '📺',
                          'casa': '🏠', 'moradia': '🏠', 'aluguel': '🏠', 'condominio': '�',
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
                                {transaction.isInstallment && (
                                  <span className="installment-badge">
                                    {transaction.installmentNumber}/{transaction.totalInstallments}
                                  </span>
                                )}
                                {transaction.isFixed && (
                                  <span className="fixed-badge">FIXA</span>
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
                        </div>
                      );
                    })}
                  
                  {transactions.filter(t => (t.creditCard === selectedCard.name || t.cardName === selectedCard.name) && t.paymentMethod === 'credito').length === 0 && (
                    <div className="no-transactions-modal">
                      <p>📋 Nenhuma transação encontrada para este cartão no período selecionado</p>
                      <p>Total de transações: {transactions.length}</p>
                      <p>Cartão procurado: {selectedCard.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
      console.log('🔍 AllTransactions - Verificando se deve criar cartão:', {
        creditCard: transactionData.creditCard,
        paymentMethod: transactionData.paymentMethod,
        shouldCreate: transactionData.creditCard && transactionData.paymentMethod === 'credito'
      });
      
      if (transactionData.creditCard && transactionData.paymentMethod === 'credito') {
        console.log('💳 AllTransactions - Tentando criar cartão:', transactionData.creditCard);
        try {
          // Verificar se o cartão já existe
          const existingCards = await axios.get('/credit-cards');
          console.log('💳 AllTransactions - Cartões existentes:', existingCards.data.map(c => c.name));
          const cardExists = existingCards.data.some(card => card.name === transactionData.creditCard);
          console.log('💳 AllTransactions - Cartão já existe?', cardExists);
          
          if (!cardExists) {
            console.log('💳 AllTransactions - Criando novo cartão:', transactionData.creditCard);
            // Criar novo cartão
            const newCard = {
              name: transactionData.creditCard,
              lastDigits: '0000', // Valor padrão - usuário pode editar depois
              limit: 1000, // Limite padrão - usuário pode editar depois
              dueDay: 10, // Dia padrão - usuário pode editar depois
              notes: 'Criado automaticamente via transação. Edite os dados do cartão.'
            };
            
            await axios.post('/credit-cards', newCard);
            console.log(`💳 AllTransactions - Cartão ${transactionData.creditCard} criado automaticamente`);
          }
        } catch (error) {
          console.error('💳 AllTransactions - Erro ao criar cartão automaticamente:', error);
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
      // Criar banco automaticamente se selecionado
      if (transactionData.bank && (transactionData.paymentMethod === 'debito' || transactionData.paymentMethod === 'pix')) {
        console.log('🏦 Edit - Verificando se deve criar banco:', transactionData.bank);
        try {
          // Verificar se o banco já existe
          const existingBanks = await axios.get('/banks');
          const bankExists = existingBanks.data.some(bank => bank.name === transactionData.bank);
          
          if (!bankExists) {
            console.log('🏦 Edit - Criando novo banco:', transactionData.bank);
            // Mapear ícones dos bancos
            const bankIcons = {
              'Banco do Brasil': '🟨',
              'Bradesco': '🔴',
              'Itaú': '🟠',
              'Santander': '🔺',
              'Caixa': '🟦',
              'Inter': '🟠',
              'Nubank': '🟣',
              'C6 Bank': '⚫',
              'XP': '⚫',
              'BTG Pactual': '⚫'
            };
            
            const bankData = Object.entries(bankIcons).find(([name]) => name === transactionData.bank);
            
            const newBank = {
              name: transactionData.bank,
              icon: bankData?.[1] || '🏦',
              accountType: 'corrente',
              notes: 'Criado automaticamente via transação'
            };
            
            await axios.post('/banks', newBank);
            console.log(`🏦 Edit - Banco ${transactionData.bank} criado automaticamente`);
          }
        } catch (error) {
          console.error('🏦 Edit - Erro ao criar banco automaticamente:', error);
        }
      }

      // Criar cartão automaticamente se selecionado
      console.log('🔍 Edit - Verificando se deve criar cartão:', {
        creditCard: transactionData.creditCard,
        paymentMethod: transactionData.paymentMethod,
        shouldCreate: transactionData.creditCard && transactionData.paymentMethod === 'credito'
      });
      
      if (transactionData.creditCard && transactionData.paymentMethod === 'credito') {
        console.log('💳 Edit - Tentando criar cartão:', transactionData.creditCard);
        try {
          // Verificar se o cartão já existe
          const existingCards = await axios.get('/credit-cards');
          console.log('💳 Edit - Cartões existentes:', existingCards.data.map(c => c.name));
          const cardExists = existingCards.data.some(card => card.name === transactionData.creditCard);
          console.log('💳 Edit - Cartão já existe?', cardExists);
          
          if (!cardExists) {
            console.log('💳 Edit - Criando novo cartão:', transactionData.creditCard);
            // Criar novo cartão
            const newCard = {
              name: transactionData.creditCard,
              lastDigits: '0000', // Valor padrão - usuário pode editar depois
              limit: 1000, // Limite padrão - usuário pode editar depois
              dueDay: 10, // Dia padrão - usuário pode editar depois
              notes: 'Criado automaticamente via edição de transação. Edite os dados do cartão.'
            };
            
            await axios.post('/credit-cards', newCard);
            console.log(`💳 Edit - Cartão ${transactionData.creditCard} criado automaticamente`);
          }
        } catch (error) {
          console.error('💳 Edit - Erro ao criar cartão automaticamente:', error);
        }
      }

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
    
    // Listener para o botão "Nova Transação" da sidebar
    const handleOpenNewTransaction = () => {
      setShowAddModal(true);
    };
    
    window.addEventListener('openNewTransaction', handleOpenNewTransaction);
    
    // Cleanup
    return () => {
      window.removeEventListener('openNewTransaction', handleOpenNewTransaction);
    };
  }, []);

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
        onMonthChange={loadTransactions}
      />

      {/* Lista de transações */}
      <div className="transactions-container-enhanced">
        {transactions.length === 0 ? (
          <div className="no-transactions-enhanced">
            <div className="empty-state-icon">📊</div>
            <h3>Nenhuma transação encontrada</h3>
            <p>Este mês ainda não possui movimentações financeiras</p>
            <button 
              className="btn-add-enhanced"
              onClick={() => setShowAddModal(true)}
            >
              ➕ Adicionar Primeira Transação
            </button>
          </div>
        ) : (
          <div className="transactions-list-enhanced">
            {transactions.map(transaction => {
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
                        {transaction.isFixed && (
                          <span className="fixed-badge">FIXA</span>
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
                        // Verificar se é uma transação fixa ou parcelada
                        if (transaction.isRecurring || transaction.recurringParentId || transaction.totalInstallments > 1) {
                          setShowConfirmDeleteAllModal(true);
                        } else {
                          setShowDeleteModal(true);
                        }
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

      {/* Modais */}
      {showAddModal && (
        <AddTransactionModal 
          onSave={handleAddTransaction}
          onCancel={() => setShowAddModal(false)}
          creditCards={[]}
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
            <div className="modal-footer special-delete">
              <button 
                className="btn btn-cancel"
                onClick={() => setShowConfirmDeleteAllModal(false)}
              >
                ❌ Cancelar
              </button>
              <button 
                className="btn btn-warning"
                onClick={() => {
                  handleDeleteTransaction(false);
                  setShowConfirmDeleteAllModal(false);
                }}
              >
                🗓️ Deletar Apenas Este Mês
              </button>
              <button 
                className="btn btn-danger"
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
  const [expandedCard, setExpandedCard] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Carregar cartões e transações
  const loadData = async (month = selectedMonth, year = selectedYear) => {
    try {
      // Carregar cartões cadastrados
      const cardsResponse = await axios.get('/credit-cards');
      // Ordenar cartões por data de criação (mais novos primeiro)
      const sortedCards = (cardsResponse.data || []).sort((a, b) => {
        const dateA = new Date(a.createdAt || a._id);
        const dateB = new Date(b.createdAt || b._id);
        return dateB - dateA; // Mais novos primeiro
      });
      setCreditCards(sortedCards);

      // Carregar transações para calcular gastos (filtradas por mês)
      const transactionsResponse = await axios.get(`/transactions?month=${month}&year=${year}`);
      setTransactions(transactionsResponse.data || []);
      
      // Atualizar states se foram passados parâmetros
      if (month !== selectedMonth) setSelectedMonth(month);
      if (year !== selectedYear) setSelectedYear(year);
      
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

  // Calcular saldo comprometido com parcelamentos futuros
  const calculateCommittedBalance = (cardName) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureInstallments = transactions.filter(t => 
      t.creditCard === cardName && 
      t.paymentMethod === 'credito' &&
      t.isInstallment &&
      new Date(t.date) > today
    );
    
    return futureInstallments.reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  // Obter transações de um cartão específico
  const getCardTransactions = (cardName) => {
    return transactions.filter(t => 
      t.creditCard === cardName && 
      t.paymentMethod === 'credito'
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Toggle para expandir/recolher detalhes do cartão
  const toggleCardDetails = (cardName) => {
    setExpandedCard(expandedCard === cardName ? null : cardName);
  };

  // Estados para o modal de transações
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);
  const [currentModalMonth, setCurrentModalMonth] = useState(new Date().getMonth());
  const [currentModalYear, setCurrentModalYear] = useState(new Date().getFullYear());

  // Abrir modal de transações do cartão
  const openCardModal = (card) => {
    setSelectedCardForModal(card);
    setCurrentModalMonth(new Date().getMonth());
    setCurrentModalYear(new Date().getFullYear());
    setShowCardModal(true);
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

  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
  };

  // Filtrar transações por mês/ano específico
  const getCardTransactionsByMonth = (cardName, month, year) => {
    if (!cardName) return [];
    
    const allTransactions = transactions.filter(transaction => {
      if (transaction.paymentMethod === 'credito' && transaction.creditCard === cardName) {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === month && transactionDate.getFullYear() === year;
      }
      return false;
    });

    return allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Calcular gastos de um mês específico
  const calculateCardExpensesByMonth = (cardName, month, year) => {
    const monthTransactions = getCardTransactionsByMonth(cardName, month, year);
    return monthTransactions.reduce((total, transaction) => {
      return total + (transaction.amount || 0);
    }, 0);
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
    
    // Listener para recarregar quando uma transação for adicionada
    const handleTransactionAdded = () => {
      loadData();
    };
    
    window.addEventListener('transactionAdded', handleTransactionAdded);
    
    return () => {
      window.removeEventListener('transactionAdded', handleTransactionAdded);
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
        onMonthChange={loadData}
      />
      
      <div className="transactions-container-enhanced">
        {creditCards.length > 0 ? (
          <div className="cards-grid">
            {creditCards.map((card, index) => {
              const expenses = calculateCardExpenses(card.name);
              const committed = calculateCommittedBalance(card.name);
              const usagePercentage = calculateUsagePercentage(expenses, card.limit);
              const committedPercentage = card.limit > 0 ? (committed / card.limit) * 100 : 0;
              const totalPercentage = Math.min(usagePercentage + committedPercentage, 100);
              const cardTransactions = getCardTransactions(card.name);
              const isExpanded = expandedCard === card.name;
              
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
                    className={`card-content-simple ${getBrandClass(card.brand)}`}
                    onClick={() => openCardModal(card)}
                  >
                    {/* Header com nome do cartão à esquerda e botões de ação à direita */}
                    <div className="card-header-simple">
                      <div className="card-name-header">
                        <h3 className="card-name-top">{card.name}</h3>
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

                    {/* 1. Dados financeiros (MAIS PRA CIMA) */}
                    <div className="card-financial-data">
                      <div className="financial-row">
                        <div className="financial-item">
                          <span className="financial-label">Limite</span>
                          <span className="financial-value">R$ {(card.limit || 0).toFixed(2)}</span>
                        </div>
                        <div className="financial-item">
                          <span className="financial-label">Gasto</span>
                          <span className="financial-value expense">R$ {expenses.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="financial-row">
                        <div className="financial-item">
                          <span className="financial-label">Comprometido</span>
                          <span className="financial-value committed">R$ {committed.toFixed(2)}</span>
                        </div>
                        <div className="financial-item">
                          <span className="financial-label">Disponível</span>
                          <span className="financial-value available">R$ {Math.max(0, (card.limit || 0) - expenses - committed).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                      
                    {/* 2. Barra de utilização (EM CIMA do nome) */}
                    {card.limit > 0 && (
                      <div className="usage-bar-simple">
                        <div className="usage-info-simple">
                          <span>Utilizado: {totalPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="progress-bar-simple">
                          <div 
                            className={`progress-fill-simple current ${usagePercentage > 80 ? 'danger' : usagePercentage > 60 ? 'warning' : 'normal'}`}
                            style={{ width: `${usagePercentage}%` }}
                          />
                          <div 
                            className="progress-fill-simple committed"
                            style={{ 
                              width: `${committedPercentage}%`,
                              marginLeft: `${usagePercentage}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 3. Footer com número do cartão, portador e bandeira */}
                    <div className="card-footer-simple">
                      <div className="card-holder-info">
                        <div className="card-number-simple">**** **** **** {card.lastDigits}</div>
                        <div className="card-holder-name">{card.holderName || 'PORTADOR'}</div>
                      </div>
                      <div className="card-brand-info">
                        <span className="brand-name">{getCardFlag(card.name)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Card pontilhado para adicionar novo cartão - À DIREITA */}
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
    </div>
  );
};

// Modal para Adicionar Cartão de Crédito
const AddCreditCardModal = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    holderName: '',
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
    <div className="modal-overlay-focused" onClick={onCancel}>
      <div className="modal-content edit-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ Editar Cartão</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nome do Cartão *</label>
              <input
                type="text"
                value={formData.name}
                readOnly
                disabled
                className="form-input form-input-disabled"
                title="O nome do cartão não pode ser alterado pois está vinculado às transações"
              />
              <small className="form-help">💡 O nome não pode ser alterado pois está vinculado às transações existentes</small>
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Estados para o modal de transações do banco
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBankForModal, setSelectedBankForModal] = useState(null);
  const [currentModalMonth, setCurrentModalMonth] = useState(new Date().getMonth());
  const [currentModalYear, setCurrentModalYear] = useState(new Date().getFullYear());
  
  // Estados para exclusão de transações
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTransactionId, setDeleteTransactionId] = useState(null);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Abrir modal de transações do banco
  const openBankModal = (bank) => {
    setSelectedBankForModal(bank);
    setCurrentModalMonth(new Date().getMonth());
    setCurrentModalYear(new Date().getFullYear());
    setShowBankModal(true);
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

  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
  };

  // Funções para exclusão de transações
  const handleConfirmDeleteTransaction = async () => {
    try {
      await axios.delete(`/transactions/${deleteTransactionId}`);
      setTransactions(transactions.filter(t => t._id !== deleteTransactionId));
      setShowConfirmDelete(false);
      setDeleteTransactionId(null);
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      alert('Erro ao deletar transação');
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
    setDeleteTransactionId(null);
  };

  // Filtrar transações por mês/ano específico
  const getBankTransactionsByMonth = (bankName, month, year) => {
    if (!bankName) return [];
    
    const allTransactions = transactions.filter(transaction => {
      if (transaction.bank === bankName && 
          (transaction.paymentMethod === 'debito' || transaction.paymentMethod === 'pix')) {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === month && transactionDate.getFullYear() === year;
      }
      return false;
    });

    return allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Calcular movimentação de um mês específico
  const calculateBankMovementByMonth = (bankName, month, year) => {
    const monthTransactions = getBankTransactionsByMonth(bankName, month, year);
    return monthTransactions.reduce((total, transaction) => {
      if (transaction.type === 'income') {
        return total + (transaction.amount || 0);
      } else {
        return total - (transaction.amount || 0);
      }
    }, 0);
  };

  // Carregar bancos e transações
  const loadData = async (month = selectedMonth, year = selectedYear) => {
    try {
      // Carregar bancos cadastrados
      const banksResponse = await axios.get('/banks');
      // Ordenar bancos por data de criação (mais novos primeiro)
      const sortedBanks = (banksResponse.data || []).sort((a, b) => {
        const dateA = new Date(a.createdAt || a._id);
        const dateB = new Date(b.createdAt || b._id);
        return dateB - dateA; // Mais novos primeiro
      });
      setBanks(sortedBanks);

      // Carregar transações para calcular saldos (filtradas por mês)
      const transactionsResponse = await axios.get(`/transactions?month=${month}&year=${year}`);
      setTransactions(transactionsResponse.data || []);
      
      // Atualizar states se foram passados parâmetros
      if (month !== selectedMonth) setSelectedMonth(month);
      if (year !== selectedYear) setSelectedYear(year);
      
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
      // Verificar se há transações vinculadas no mês atual
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
    
    // Listener para recarregar quando uma transação for adicionada
    const handleTransactionAdded = () => {
      loadData();
    };
    
    window.addEventListener('transactionAdded', handleTransactionAdded);
    
    return () => {
      window.removeEventListener('transactionAdded', handleTransactionAdded);
    };
  }, []);

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
        onMonthChange={loadData}
      />
      
      <div className="transactions-container-enhanced">
        {banks.length > 0 ? (
          <div className="banks-grid">
            {banks.map((bank) => {
              const balance = calculateBankBalance(bank.name);
              const transactionCount = transactions.filter(t => t.bank === bank.name).length;
              const currentMonth = new Date().getMonth();
              const currentYear = new Date().getFullYear();
              const monthlyMovement = calculateBankMovementByMonth(bank.name, currentMonth, currentYear);
              const incomeThisMonth = transactions.filter(t => 
                t.bank === bank.name && 
                t.type === 'income' && 
                new Date(t.date).getMonth() === currentMonth &&
                new Date(t.date).getFullYear() === currentYear
              ).reduce((sum, t) => sum + t.amount, 0);
              const expenseThisMonth = transactions.filter(t => 
                t.bank === bank.name && 
                t.type === 'expense' && 
                new Date(t.date).getMonth() === currentMonth &&
                new Date(t.date).getFullYear() === currentYear
              ).reduce((sum, t) => sum + t.amount, 0);
              
              return (
                <div 
                  key={bank._id} 
                  className="bank-card-modern"
                  onClick={() => openBankModal(bank)}
                >
                  <div className="bank-card-header">
                    <div className="bank-card-info">
                      <div className="bank-icon-name">
                        <span className="bank-icon">{bank.icon}</span>
                        <div className="bank-details">
                          <h3 className="bank-name">{bank.name}</h3>
                          <span className="account-type">
                            {bank.accountType === 'corrente' ? 'Conta Corrente' : 
                             bank.accountType === 'poupanca' ? 'Poupança' : 'Conta Investimento'}
                          </span>
                        </div>
                      </div>
                      <div className="bank-balance-main">
                        <span className="balance-label">Saldo</span>
                        <span className={`balance-amount ${balance >= 0 ? 'positive' : 'negative'}`}>
                          R$ {Math.abs(balance).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="bank-actions-menu" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="action-btn-modern edit"
                        onClick={() => {
                          setSelectedBank(bank);
                          setShowEditBankModal(true);
                        }}
                        title="Editar banco"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-btn-modern delete"
                        onClick={() => {
                          setBankToDelete(bank);
                          setShowDeleteModal(true);
                        }}
                        title="Excluir banco"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="bank-card-stats">
                    <div className="stats-grid">
                      <div className="stat-item">
                        <div className="stat-icon">📈</div>
                        <div className="stat-info">
                          <span className="stat-label">Entradas</span>
                          <span className="stat-value positive">+R$ {incomeThisMonth.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-icon">📉</div>
                        <div className="stat-info">
                          <span className="stat-label">Saídas</span>
                          <span className="stat-value negative">-R$ {expenseThisMonth.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bank-card-footer">
                      <div className="transaction-count">
                        📊 {transactionCount} transações
                      </div>
                      <div className="click-hint">
                        👆 Clique para ver extrato
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Card pontilhado para adicionar novo banco - À DIREITA */}
            <div className="bank-card add-bank-button" onClick={() => setShowAddBankModal(true)}>
              <div className="bank-card-content add-bank-content">
                <div className="add-bank-icon">➕</div>
                <div className="add-bank-text">
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

      {/* Modal de Transações do Banco - Mesmo Padrão dos Cartões */}
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
                        <div key={transaction._id || index} className="transaction-item-extract">
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
                                {transaction.isFixed && (
                                  <span className="fixed-badge">FIXA</span>
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
      <div className="page-header-simple">
        <h1 className="page-title">⚙️ Configurações</h1>
        <p className="page-subtitle">Perfil e preferências do sistema</p>
      </div>

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

// Modal Global de Nova Transação
const GlobalNewTransactionModal = () => {
  const { showAddModal, closeModal } = useNewTransaction();
  
  const handleSave = async (transactionData) => {
    try {
      await axios.post('/transactions', transactionData);
      closeModal();
      
      // Recarregar dados das páginas
      window.dispatchEvent(new CustomEvent('transactionAdded'));
      
      alert('Transação adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
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
    </NewTransactionProvider>
    </AuthProvider>
  );
};

export default App;
