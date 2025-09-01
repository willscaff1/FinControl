/**
 * 📱 FINANCIAL CONTROL - EXPO APP (iOS/Android)
 * 📍 Caminho: C:\financial-control-system\FinancialAppExpo\App.js
 * 
 * INSTRUÇÕES:
 * 1. Substitua COMPLETAMENTE o arquivo App.js do Expo
 * 2. Cole este código inteiro
 * 3. Execute: npm start
 * 4. Escaneie QR Code no app "Expo Go" do iPhone
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// 🔗 Configuração da API
// IMPORTANTE: Para testar no iPhone, substitua pelo IP da sua máquina
const API_URL = __DEV__ 
  ? Platform.OS === 'ios'
    ? 'http://localhost:3001/api'  // iOS Simulator
    : 'http://10.0.2.2:3001/api'   // Android Emulator
  : 'http://SEU_IP_AQUI:3001/api'; // Para dispositivo físico

// 📱 Para dispositivo físico iPhone/Android:
// Descubra seu IP: cmd → ipconfig → IPv4
// Substitua acima: 'http://192.168.1.100:3001/api' (exemplo)

console.log('🔗 API URL:', API_URL);

// Context para autenticação
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

// 🛠️ Configuração do Axios
const api = axios.create({ 
  baseURL: API_URL,
  timeout: 10000 // 10 segundos timeout
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('financial_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// 🔐 Provider de Autenticação
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('financial_token');
      const userData = await AsyncStorage.getItem('financial_user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        console.log('✅ Usuário logado:', JSON.parse(userData).name);
      } else {
        console.log('ℹ️ Usuário não logado');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Tentando login:', email);
      const { data } = await api.post('/auth/login', { email, password });
      
      await AsyncStorage.setItem('financial_token', data.token);
      await AsyncStorage.setItem('financial_user', JSON.stringify(data.user));
      setUser(data.user);
      
      console.log('✅ Login realizado:', data.user.name);
      return data;
    } catch (error) {
      console.error('❌ Erro no login:', error.response?.data || error.message);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      console.log('📝 Tentando registro:', email);
      const { data } = await api.post('/auth/register', { name, email, password });
      
      await AsyncStorage.setItem('financial_token', data.token);
      await AsyncStorage.setItem('financial_user', JSON.stringify(data.user));
      setUser(data.user);
      
      console.log('✅ Registro realizado:', data.user.name);
      return data;
    } catch (error) {
      console.error('❌ Erro no registro:', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['financial_token', 'financial_user']);
      setUser(null);
      console.log('👋 Logout realizado');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 🔑 Tela de Login
const LoginScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: __DEV__ ? 'test@test.com' : '', // Pre-fill para desenvolvimento
    password: __DEV__ ? '123456' : '' 
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async () => {
    if (!formData.email || !formData.password || (!isLogin && !formData.name)) {
      Alert.alert('❌ Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('❌ Erro', 'Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email.trim().toLowerCase(), formData.password);
        Alert.alert('✅ Sucesso', 'Login realizado com sucesso!');
      } else {
        await register(formData.name.trim(), formData.email.trim().toLowerCase(), formData.password);
        Alert.alert('✅ Sucesso', 'Conta criada com sucesso!');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';
      Alert.alert('❌ Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      
      <ScrollView contentContainerStyle={styles.loginContainer}>
        {/* 🏢 Header com Logo */}
        <View style={styles.loginHeader}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>💰</Text>
          </View>
          <Text style={styles.loginTitle}>
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </Text>
          <Text style={styles.loginSubtitle}>
            {isLogin 
              ? 'Acesse seu controle financeiro' 
              : 'Comece a controlar suas finanças'
            }
          </Text>
          {__DEV__ && (
            <Text style={styles.devInfo}>
              🔗 Conectando em: {API_URL}
            </Text>
          )}
        </View>

        {/* 📝 Formulário */}
        <View style={styles.formContainer}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              autoCapitalize="words"
              autoCorrect={false}
            />
          )}
          
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Senha (min. 6 caracteres)"
            value={formData.password}
            onChangeText={(text) => setFormData({...formData, password: text})}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isLogin ? '🔐 Entrar' : '📝 Criar Conta'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 🔄 Alternar modo */}
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
          activeOpacity={0.8}
        >
          <Text style={styles.switchButtonText}>
            {isLogin 
              ? '📱 Não tem conta? Criar nova conta' 
              : '👤 Já tem conta? Fazer login'
            }
          </Text>
        </TouchableOpacity>

        {/* 🔧 Info de desenvolvimento */}
        {__DEV__ && (
          <View style={styles.devContainer}>
            <Text style={styles.devTitle}>🔧 Modo Desenvolvimento</Text>
            <Text style={styles.devText}>• Certifique-se que o backend está rodando</Text>
            <Text style={styles.devText}>• Backend: http://localhost:3001</Text>
            <Text style={styles.devText}>• Para dispositivo físico, ajuste o IP no código</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// 📊 Card de Estatísticas
const StatsCard = ({ title, value, color = '#2563eb', icon }) => (
  <View style={[styles.statsCard, { borderLeftColor: color }]}>
    <View style={styles.statsHeader}>
      <Text style={styles.statsTitle}>{title}</Text>
      {icon && <Text style={styles.statsIcon}>{icon}</Text>}
    </View>
    <Text style={[styles.statsValue, { color }]}>{value}</Text>
  </View>
);

// 💰 Modal de Nova Transação
const TransactionModal = ({ visible, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: 'food',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = {
    expense: [
      { id: 'food', name: '🍽️ Alimentação' },
      { id: 'transport', name: '🚗 Transporte' },
      { id: 'health', name: '🏥 Saúde' },
      { id: 'entertainment', name: '🎬 Entretenimento' },
      { id: 'shopping', name: '🛍️ Compras' }
    ],
    income: [
      { id: 'salary', name: '💼 Salário' },
      { id: 'freelance', name: '💻 Freelance' },
      { id: 'investment', name: '📈 Investimentos' }
    ]
  };

  const handleSubmit = () => {
    if (!formData.description.trim()) {
      Alert.alert('❌ Erro', 'Informe a descrição da transação');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount.replace(',', '.')) <= 0) {
      Alert.alert('❌ Erro', 'Informe um valor válido maior que zero');
      return;
    }

    const cleanAmount = formData.amount.replace(',', '.');
    const numericAmount = parseFloat(cleanAmount);

    if (isNaN(numericAmount)) {
      Alert.alert('❌ Erro', 'Valor deve ser um número válido');
      return;
    }

    onSave({
      ...formData,
      description: formData.description.trim(),
      amount: numericAmount
    });

    // Reset form
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      category: 'food',
      date: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>💰 Nova Transação</Text>
          
          {/* 🎯 Seletor de Tipo */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === 'expense' && styles.typeButtonActiveExpense
              ]}
              onPress={() => setFormData({...formData, type: 'expense', category: 'food'})}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.typeButtonText,
                formData.type === 'expense' && styles.typeButtonTextActive
              ]}>
                📉 Despesa
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === 'income' && styles.typeButtonActiveIncome
              ]}
              onPress={() => setFormData({...formData, type: 'income', category: 'salary'})}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.typeButtonText,
                formData.type === 'income' && styles.typeButtonTextActive
              ]}>
                📈 Receita
              </Text>
            </TouchableOpacity>
          </View>

          {/* 📝 Campos do formulário */}
          <TextInput
            style={styles.modalInput}
            placeholder="Descrição (ex: Almoço no restaurante)"
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
            maxLength={100}
          />

          <TextInput
            style={styles.modalInput}
            placeholder="Valor (ex: 50.00 ou 50,00)"
            value={formData.amount}
            onChangeText={(text) => {
              // Permitir apenas números, vírgula e ponto
              const cleanText = text.replace(/[^0-9.,]/g, '');
              setFormData({...formData, amount: cleanText});
            }}
            keyboardType="numeric"
            returnKeyType="done"
          />

          {/* 🏷️ Categorias */}
          <Text style={styles.inputLabel}>Categoria:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoryScroll}
          >
            {categories[formData.type].map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  formData.category === cat.id && styles.categoryButtonActive
                ]}
                onPress={() => setFormData({...formData, category: cat.id})}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.categoryButtonText,
                  formData.category === cat.id && styles.categoryButtonTextActive
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 🔘 Botões */}
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>❌ Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>✅ Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// 📄 Item de Transação
const TransactionItem = ({ transaction }) => {
  const categoryNames = {
    food: '🍽️ Alimentação', transport: '🚗 Transporte', health: '🏥 Saúde',
    entertainment: '🎬 Entretenimento', shopping: '🛍️ Compras',
    salary: '💼 Salário', freelance: '💻 Freelance', investment: '📈 Investimentos'
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[
          styles.transactionIcon,
          { backgroundColor: transaction.type === 'income' ? '#10b981' : '#ef4444' }
        ]}>
          <Text style={styles.transactionIconText}>
            {transaction.type === 'income' ? '📈' : '📉'}
          </Text>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text style={styles.transactionCategory} numberOfLines={1}>
            {categoryNames[transaction.category]} • {formatDate(transaction.date)}
          </Text>
        </View>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: transaction.type === 'income' ? '#10b981' : '#ef4444' }
      ]}>
        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
      </Text>
    </View>
  );
};

// 🏠 Tela Principal - Dashboard
const DashboardScreen = () => {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    totalTransactions: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 📊 Carregar dados da API
  const loadData = async () => {
    try {
      console.log('📊 Carregando dados...');
      
      const [transResponse, statsResponse] = await Promise.all([
        api.get('/transactions'),
        api.get('/transactions/stats')
      ]);
      
      setTransactions(transResponse.data.transactions || []);
      setStats(statsResponse.data || {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        totalTransactions: 0
      });
      
      console.log('✅ Dados carregados:', {
        transactions: transResponse.data.transactions?.length || 0,
        stats: statsResponse.data
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error.response?.data || error.message);
      Alert.alert(
        '❌ Erro de Conexão', 
        'Não foi possível conectar ao servidor. Verifique se o backend está rodando.\n\n' +
        'Servidor: ' + API_URL.replace('/api', ''),
        [
          { text: '🔄 Tentar Novamente', onPress: loadData },
          { text: '❌ OK', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 💾 Salvar nova transação
  const handleSaveTransaction = async (transactionData) => {
    try {
      console.log('💾 Salvando transação:', transactionData);
      
      await api.post('/transactions', transactionData);
      loadData(); // Recarregar dados
      
      Alert.alert('✅ Sucesso', 'Transação salva com sucesso!');
      console.log('✅ Transação salva');
      
    } catch (error) {
      console.error('❌ Erro ao salvar transação:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';
      Alert.alert('❌ Erro', 'Erro ao salvar transação:\n' + errorMessage);
    }
  };

  // 🔄 Pull to refresh
  const handleRefresh = () => {
    console.log('🔄 Atualizando dados...');
    setRefreshing(true);
    loadData();
  };

  // 👋 Logout com confirmação
  const handleLogout = () => {
    Alert.alert(
      '👋 Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: '❌ Cancelar', style: 'cancel' },
        { text: '✅ Sair', onPress: logout, style: 'destructive' }
      ]
    );
  };

  // 💱 Formatação de moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // ⏳ Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando dados...</Text>
        <Text style={styles.loadingSubtext}>Conectando ao servidor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      
      {/* 🎯 Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💰 FinanceControl</Text>
          <Text style={styles.headerSubtitle}>Olá, {user?.name || 'Usuário'} 👋</Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>👋 Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 📊 Cards de Estatísticas */}
        <View style={styles.statsContainer}>
          <StatsCard 
            title="Saldo Total" 
            value={formatCurrency(stats.balance)} 
            color={stats.balance >= 0 ? '#10b981' : '#ef4444'}
            icon="💰"
          />
          <StatsCard 
            title="Receitas" 
            value={formatCurrency(stats.totalIncome)} 
            color="#10b981"
            icon="📈"
          />
          <StatsCard 
            title="Despesas" 
            value={formatCurrency(stats.totalExpense)} 
            color="#ef4444"
            icon="📉"
          />
          <StatsCard 
            title="Transações" 
            value={stats.totalTransactions?.toString() || '0'} 
            color="#2563eb"
            icon="📊"
          />
        </View>

        {/* 📋 Lista de Transações */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>📋 Transações Recentes</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📭</Text>
              <Text style={styles.emptyStateText}>Nenhuma transação encontrada</Text>
              <Text style={styles.emptyStateSubtext}>Toque no botão + para adicionar sua primeira transação</Text>
            </View>
          ) : (
            transactions.slice(0, 20).map((transaction) => ( // Limitar a 20 para performance
              <TransactionItem key={transaction._id || transaction.id} transaction={transaction} />
            ))
          )}
        </View>

        {/* 🔧 Info de desenvolvimento */}
        {__DEV__ && (
          <View style={styles.devContainer}>
            <Text style={styles.devTitle}>🔧 Debug Info</Text>
            <Text style={styles.devText}>API: {API_URL}</Text>
            <Text style={styles.devText}>Transações: {transactions.length}</Text>
            <Text style={styles.devText}>Usuário: {user?.email}</Text>
          </View>
        )}
      </ScrollView>

      {/* 🎯 Botão Flutuante (FAB) */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* 💰 Modal de Transação */}
      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveTransaction}
      />
    </SafeAreaView>
  );
};

// � Tela de Cartões (apenas transações de crédito)
const CardsScreen = () => {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCredit, setTotalCredit] = useState(0);

  // 📊 Carregar transações de crédito
  const loadCreditTransactions = async () => {
    try {
      console.log('💳 Carregando transações de cartão...');
      
      const response = await api.get('/transactions');
      const allTransactions = response.data.transactions || [];
      
      // Filtrar apenas transações de crédito
      const creditTransactions = allTransactions.filter(t => 
        t.type === 'expense' && t.paymentMethod === 'credito'
      );
      
      setTransactions(creditTransactions);
      
      // Calcular total do cartão
      const total = creditTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      setTotalCredit(total);
      
      console.log('✅ Transações de cartão carregadas:', creditTransactions.length);
      
    } catch (error) {
      console.error('❌ Erro ao carregar transações de cartão:', error.response?.data || error.message);
      Alert.alert('❌ Erro', 'Não foi possível carregar as transações do cartão');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCreditTransactions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCreditTransactions();
  };

  // 🎨 Ícone baseado na categoria
  const getCategoryIcon = (category) => {
    const icons = {
      'alimentacao': '🍕', 'alimentação': '🍕', 'comida': '🍕', 'restaurante': '🍽️',
      'transporte': '🚗', 'combustivel': '⛽', 'combustível': '⛽', 'uber': '🚕',
      'saude': '🏥', 'saúde': '🏥', 'farmacia': '💊', 'farmácia': '💊',
      'casa': '🏠', 'mercado': '🛒', 'supermercado': '🛒',
      'educacao': '📚', 'educação': '📚', 'curso': '🎓',
      'lazer': '🎮', 'cinema': '🎬', 'streaming': '📺',
      'roupas': '👕', 'roupa': '👕', 'shopping': '🛍️',
      'servicos': '🔧', 'serviços': '🔧',
      'outros': '💳'
    };
    return icons[category?.toLowerCase()] || '💳';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando gastos do cartão...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* 🧭 Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💳 Cartões de Crédito</Text>
          <Text style={styles.headerSubtitle}>Olá, {user?.name}!</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>↗️ Sair</Text>
        </TouchableOpacity>
      </View>

      {/* 💰 Card de Total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Cartão</Text>
        <Text style={styles.totalValue}>R$ {totalCredit.toFixed(2)}</Text>
      </View>

      {/* 📋 Lista de Transações */}
      <ScrollView 
        style={styles.transactionsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💳</Text>
            <Text style={styles.emptyStateText}>Nenhum gasto no cartão</Text>
            <Text style={styles.emptyStateSubtext}>Suas transações de cartão aparecerão aqui</Text>
          </View>
        ) : (
          transactions.map((transaction) => (
            <View key={transaction._id} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: '#fee2e2' }]}>
                  <Text style={styles.transactionIconText}>
                    {getCategoryIcon(transaction.category)}
                  </Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.category} • Cartão de Crédito
                  </Text>
                </View>
              </View>
              <Text style={[styles.transactionAmount, { color: '#dc2626' }]}>
                -R$ {(transaction.amount || 0).toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// 🏦 Tela de Bancos (transações de débito e PIX)
const BanksScreen = () => {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalBank, setTotalBank] = useState(0);

  // 📊 Carregar transações bancárias
  const loadBankTransactions = async () => {
    try {
      console.log('🏦 Carregando transações bancárias...');
      
      const response = await api.get('/transactions');
      const allTransactions = response.data.transactions || [];
      
      // Filtrar apenas transações de débito e PIX
      const bankTransactions = allTransactions.filter(t => 
        t.type === 'expense' && (t.paymentMethod === 'debito' || t.paymentMethod === 'pix')
      );
      
      setTransactions(bankTransactions);
      
      // Calcular total bancário
      const total = bankTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      setTotalBank(total);
      
      console.log('✅ Transações bancárias carregadas:', bankTransactions.length);
      
    } catch (error) {
      console.error('❌ Erro ao carregar transações bancárias:', error.response?.data || error.message);
      Alert.alert('❌ Erro', 'Não foi possível carregar as transações bancárias');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBankTransactions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadBankTransactions();
  };

  // 🎨 Ícone baseado na categoria e método de pagamento
  const getCategoryIcon = (category, paymentMethod) => {
    if (paymentMethod === 'pix') return '📱';
    if (paymentMethod === 'debito') return '💳';
    
    const icons = {
      'alimentacao': '🍕', 'alimentação': '🍕', 'comida': '🍕',
      'transporte': '🚗', 'combustivel': '⛽', 'combustível': '⛽',
      'saude': '🏥', 'saúde': '🏥', 'farmacia': '💊',
      'casa': '🏠', 'mercado': '🛒', 'supermercado': '🛒',
      'educacao': '📚', 'educação': '📚',
      'lazer': '🎮', 'cinema': '🎬', 'streaming': '📺',
      'roupas': '👕', 'roupa': '👕',
      'servicos': '🔧', 'serviços': '🔧',
      'outros': '💰'
    };
    return icons[category?.toLowerCase()] || '💰';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando movimentações bancárias...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* 🧭 Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🏦 Movimentações Bancárias</Text>
          <Text style={styles.headerSubtitle}>Olá, {user?.name}!</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>↗️ Sair</Text>
        </TouchableOpacity>
      </View>

      {/* 💰 Card de Total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Bancos</Text>
        <Text style={styles.totalValue}>R$ {totalBank.toFixed(2)}</Text>
      </View>

      {/* 📋 Lista de Transações */}
      <ScrollView 
        style={styles.transactionsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🏦</Text>
            <Text style={styles.emptyStateText}>Nenhuma movimentação bancária</Text>
            <Text style={styles.emptyStateSubtext}>Suas transações de débito e PIX aparecerão aqui</Text>
          </View>
        ) : (
          transactions.map((transaction) => (
            <View key={transaction._id} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: '#dbeafe' }]}>
                  <Text style={styles.transactionIconText}>
                    {getCategoryIcon(transaction.category, transaction.paymentMethod)}
                  </Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.category} • {transaction.paymentMethod === 'pix' ? 'PIX' : 'Débito'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.transactionAmount, { color: '#dc2626' }]}>
                -R$ {(transaction.amount || 0).toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// �📱 App Principal
const App = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Inicializando app...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'cards':
        return <CardsScreen />;
      case 'banks':
        return <BanksScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {renderActiveScreen()}
      
      {/* 🧭 Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={[styles.navTab, activeTab === 'dashboard' && styles.navTabActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.navTabIcon, activeTab === 'dashboard' && styles.navTabIconActive]}>📊</Text>
          <Text style={[styles.navTabText, activeTab === 'dashboard' && styles.navTabTextActive]}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navTab, activeTab === 'cards' && styles.navTabActive]}
          onPress={() => setActiveTab('cards')}
        >
          <Text style={[styles.navTabIcon, activeTab === 'cards' && styles.navTabIconActive]}>💳</Text>
          <Text style={[styles.navTabText, activeTab === 'cards' && styles.navTabTextActive]}>Cartões</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navTab, activeTab === 'banks' && styles.navTabActive]}
          onPress={() => setActiveTab('banks')}
        >
          <Text style={[styles.navTabIcon, activeTab === 'banks' && styles.navTabIconActive]}>🏦</Text>
          <Text style={[styles.navTabText, activeTab === 'banks' && styles.navTabTextActive]}>Bancos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 🚀 App Principal com Provider
export default function FinancialApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

// 🎨 ESTILOS - Design otimizado para iOS/Android
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // ⏳ Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#374151',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  
  // 🔑 Login
  loginContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#2563eb',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logoIcon: {
    fontSize: 32,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  devInfo: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  formContainer: {
    gap: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 32,
    alignItems: 'center',
    padding: 16,
  },
  switchButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  devContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  devTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  devText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },

  // 🎯 Header
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      android: {
        elevation: 4,
      },
    }),
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#93c5fd',
    fontSize: 14,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '500',
  },

  // 📄 Content
  content: {
    flex: 1,
    padding: 20,
  },
  
  // 📊 Stats
  statsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statsIcon: {
    fontSize: 18,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  // 📋 Transactions
  transactionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 13,
    color: '#6b7280',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },

  // 🚫 Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },

  // 🎯 FAB (Floating Action Button)
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: '#2563eb',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },

  // 💰 Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        paddingBottom: 34, // Safe area para iPhone
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActiveExpense: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  typeButtonActiveIncome: {
    backgroundColor: '#dcfce7',
    borderColor: '#10b981',
  },
  typeButtonText: {
    fontWeight: '500',
    color: '#6b7280',
    fontSize: 15,
  },
  typeButtonTextActive: {
    color: '#1f2937',
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 20,
    paddingVertical: 4,
  },
  categoryButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  categoryButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '500',
    fontSize: 15,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  // 🧭 Bottom Navigation
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingBottom: Platform.OS === 'ios' ? 34 : 8, // Safe area for iPhone
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  navTabActive: {
    backgroundColor: '#eff6ff',
  },
  navTabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navTabIconActive: {
    transform: [{ scale: 1.1 }],
  },
  navTabText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
  navTabTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },

  // 💰 Total Card (for new screens)
  totalCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 28,
    color: '#dc2626',
    fontWeight: 'bold',
  },
});