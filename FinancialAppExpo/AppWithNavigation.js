/**
 * 📱 FINANCIAL CONTROL - EXPO APP COM NAVEGAÇÃO
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
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// 🔗 Configuração da API
const API_URL = __DEV__ 
  ? Platform.OS === 'ios'
    ? 'http://192.168.1.110:3001/api'
    : 'http://10.0.2.2:3001/api'
  : 'http://192.168.1.110:3001/api';

console.log('🔗 API URL:', API_URL);

// Context para autenticação
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

// 🛠️ Configuração do Axios
const api = axios.create({ 
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para incluir token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Tab Navigator
const Tab = createBottomTabNavigator();

// 🏠 DASHBOARD SCREEN
function DashboardScreen() {
  const { user, logout } = useAuth();
  const [data, setData] = useState({
    transactions: [],
    stats: { balance: 0, income: 0, expense: 0, count: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = async () => {
    try {
      const [transactionsRes, statsRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/transactions/stats')
      ]);
      
      setData({
        transactions: transactionsRes.data || [],
        stats: {
          balance: statsRes.data?.balance ?? 0,
          income: statsRes.data?.income ?? 0,
          expense: statsRes.data?.expense ?? 0,
          count: statsRes.data?.count ?? 0,
          ...statsRes.data
        }
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Definir valores padrão em caso de erro
      setData({
        transactions: [],
        stats: {
          balance: 0,
          income: 0,
          expense: 0,
          count: 0
        }
      });
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading || !data || !data.stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Olá, {user?.name || 'Usuário'}!</Text>
          <Text style={styles.headerSubtitle}>Controle suas finanças</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.balanceCard]}>
            <Text style={styles.statLabel}>💰 SALDO ATUAL</Text>
            <Text style={[
              styles.statValue,
              (data.stats?.balance ?? 0) >= 0 ? styles.positive : styles.negative
            ]}>
              R$ {(data.stats?.balance ?? 0).toFixed(2)}
            </Text>
          </View>

          <View style={[styles.statCard, styles.incomeCard]}>
            <Text style={styles.statLabel}>📈 RECEITAS</Text>
            <Text style={[styles.statValue, styles.positive]}>
              R$ {(data.stats?.income ?? 0).toFixed(2)}
            </Text>
          </View>

          <View style={[styles.statCard, styles.expenseCard]}>
            <Text style={styles.statLabel}>📉 DESPESAS</Text>
            <Text style={[styles.statValue, styles.negative]}>
              R$ {(data.stats?.expense ?? 0).toFixed(2)}
            </Text>
          </View>

          <View style={[styles.statCard, styles.countCard]}>
            <Text style={styles.statLabel}>📊 TRANSAÇÕES</Text>
            <Text style={[styles.statValue, styles.primary]}>
              {data.stats?.count ?? 0}
            </Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>📋 Últimas Transações</Text>
          {!data.transactions || data.transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhuma transação encontrada</Text>
              <Text style={styles.emptyStateSubtext}>Adicione sua primeira transação</Text>
            </View>
          ) : (
            data.transactions.slice(0, 5).map((transaction) => (
              <View key={transaction._id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <View style={[
                    styles.transactionIcon,
                    transaction.type === 'income' ? styles.incomeIcon : styles.expenseIcon
                  ]}>
                    <Text style={styles.transactionIconText}>
                      {transaction.type === 'income' ? '+' : '-'}
                    </Text>
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionCategory}>
                      {transaction.category} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === 'income' ? styles.positive : styles.negative
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}R$ {(transaction.amount || 0).toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={loadData}
      />
    </SafeAreaView>
  );
}

// 💳 TRANSAÇÕES SCREEN
function TransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !transactions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando transações...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💳 Transações</Text>
        <Text style={styles.headerSubtitle}>Histórico completo</Text>
      </View>

      <ScrollView style={styles.content}>
        {!transactions || transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nenhuma transação</Text>
            <Text style={styles.emptyStateSubtext}>Suas transações aparecerão aqui</Text>
          </View>
        ) : (
          transactions.map((transaction) => (
            <View key={transaction._id} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <View style={[
                  styles.transactionIcon,
                  transaction.type === 'income' ? styles.incomeIcon : styles.expenseIcon
                ]}>
                  <Text style={styles.transactionIconText}>
                    {transaction.type === 'income' ? '+' : '-'}
                  </Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.category} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.transactionAmount,
                transaction.type === 'income' ? styles.positive : styles.negative
              ]}>
                {transaction.type === 'income' ? '+' : '-'}R$ {(transaction.amount || 0).toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// 💳 CARTÕES SCREEN
function CardsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💳 Cartões</Text>
        <Text style={styles.headerSubtitle}>Gerencie seus cartões</Text>
      </View>
      
      <View style={styles.comingSoon}>
        <Ionicons name="card-outline" size={64} color="#9ca3af" />
        <Text style={styles.comingSoonTitle}>Em breve!</Text>
        <Text style={styles.comingSoonText}>
          Funcionalidade de gerenciamento de cartões em desenvolvimento
        </Text>
      </View>
    </SafeAreaView>
  );
}

// 🏦 BANCOS SCREEN
function BanksScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏦 Bancos</Text>
        <Text style={styles.headerSubtitle}>Conecte suas contas</Text>
      </View>
      
      <View style={styles.comingSoon}>
        <Ionicons name="business-outline" size={64} color="#9ca3af" />
        <Text style={styles.comingSoonTitle}>Em breve!</Text>
        <Text style={styles.comingSoonText}>
          Integração com bancos e sincronização automática
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ⚙️ CONFIGURAÇÕES SCREEN
function SettingsScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Configurações</Text>
        <Text style={styles.headerSubtitle}>Perfil e preferências</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={32} color="#2563eb" />
          </View>
          <Text style={styles.profileName}>{user?.name || 'Usuário'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="notifications-outline" size={24} color="#6b7280" />
            <Text style={styles.settingsText}>Notificações</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#6b7280" />
            <Text style={styles.settingsText}>Segurança</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="moon-outline" size={24} color="#6b7280" />
            <Text style={styles.settingsText}>Tema Escuro</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="help-circle-outline" size={24} color="#6b7280" />
            <Text style={styles.settingsText}>Ajuda</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            <Text style={[styles.settingsText, { color: '#ef4444' }]}>Sair</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Modal de Transação (simplificado)
function TransactionModal({ visible, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: 'Outros'
  });

  const handleSave = async () => {
    try {
      await api.post('/transactions', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      onSuccess();
      onClose();
      setFormData({ type: 'expense', amount: '', description: '', category: 'Outros' });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a transação');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Nova Transação</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSave}>Salvar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, formData.type === 'expense' && styles.typeButtonActiveExpense]}
              onPress={() => setFormData({...formData, type: 'expense'})}
            >
              <Text style={styles.typeButtonText}>Despesa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, formData.type === 'income' && styles.typeButtonActiveIncome]}
              onPress={() => setFormData({...formData, type: 'income'})}
            >
              <Text style={styles.typeButtonText}>Receita</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.modalInput}
            placeholder="Valor (R$)"
            value={formData.amount}
            onChangeText={(text) => setFormData({...formData, amount: text})}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.modalInput}
            placeholder="Descrição"
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
          />

          <TextInput
            style={styles.modalInput}
            placeholder="Categoria"
            value={formData.category}
            onChangeText={(text) => setFormData({...formData, category: text})}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Telas de Login (simplificado)
function LoginScreen() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', formData);
      const { token, user } = response.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      login(user);
    } catch (error) {
      Alert.alert('Erro', 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      
      <View style={styles.loginContent}>
        <Text style={styles.loginLogo}>💰</Text>
        <Text style={styles.loginTitle}>Financial Control</Text>
        <Text style={styles.loginSubtitle}>Controle suas finanças</Text>

        <View style={styles.loginForm}>
          <TextInput
            style={styles.loginInput}
            placeholder="E-mail"
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.loginInput}
            placeholder="Senha"
            value={formData.password}
            onChangeText={(text) => setFormData({...formData, password: text})}
            secureTextEntry
          />
          
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Provider de Autenticação
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Main App com Navigation
function MainApp() {
  const { user } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            switch (route.name) {
              case 'Dashboard':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'Transações':
                iconName = focused ? 'list' : 'list-outline';
                break;
              case 'Cartões':
                iconName = focused ? 'card' : 'card-outline';
                break;
              case 'Bancos':
                iconName = focused ? 'business' : 'business-outline';
                break;
              case 'Configurações':
                iconName = focused ? 'settings' : 'settings-outline';
                break;
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#e5e7eb',
            height: Platform.OS === 'ios' ? 88 : 60,
            paddingBottom: Platform.OS === 'ios' ? 20 : 8,
            paddingTop: 8,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Transações" component={TransactionsScreen} />
        <Tab.Screen name="Cartões" component={CardsScreen} />
        <Tab.Screen name="Bancos" component={BanksScreen} />
        <Tab.Screen name="Configurações" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// App Principal
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

// 🎨 STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  positive: { color: '#10b981' },
  negative: { color: '#ef4444' },
  primary: { color: '#2563eb' },
  transactionsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  incomeIcon: {
    backgroundColor: '#dcfce7',
  },
  expenseIcon: {
    backgroundColor: '#fee2e2',
  },
  transactionIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  transactionCategory: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: '#2563eb',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    backgroundColor: '#eff6ff',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingsText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#2563eb',
  },
  loginContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loginLogo: {
    fontSize: 80,
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 40,
  },
  loginForm: {
    width: '100%',
  },
  loginInput: {
    backgroundColor: '#f9fafb',
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  loginButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCancel: {
    color: '#6b7280',
    fontSize: 16,
  },
  modalSave: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  typeButtonActiveExpense: {
    backgroundColor: '#fee2e2',
  },
  typeButtonActiveIncome: {
    backgroundColor: '#dcfce7',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6b7280',
  },
  modalInput: {
    backgroundColor: '#fff',
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
});
