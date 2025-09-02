import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ActionSheetIOS,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import ApiService from './services/apiService';

// Função global para formatação de moeda
const formatCurrency = (value) => {
  return `R$ ${(value || 0).toFixed(2).replace('.', ',')}`;
};

const theme = {
  colors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    success: '#10B981',
    danger: '#EF4444',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
    },
    white: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

// 📊 DASHBOARD
const DashboardPage = () => {
  const [data, setData] = useState({
    stats: { balance: 0, income: 0, expense: 0 },
    recentTransactions: [],
    creditCardTotal: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async (month = selectedMonth, year = selectedYear) => {
    try {
      const response = await ApiService.request(`/dashboard?month=${month}&year=${year}`);
      setData(response || {
        stats: { balance: 0, income: 0, expense: 0 },
        recentTransactions: [],
        creditCardTotal: 0
      });
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      setData({
        stats: { balance: 0, income: 0, expense: 0 },
        recentTransactions: [],
        creditCardTotal: 0
      });
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
    loadData(newMonth, newYear);
  };

  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

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

  const getPaymentIcon = (paymentMethod) => {
    const paymentIcons = {
      'pix': '📱',
      'credito': '💳',
      'debito': '💸',
      'dinheiro': '💵',
      'transferencia': '🏦',
      'boleto': '📄'
    };
    return paymentIcons[paymentMethod?.toLowerCase()] || '💳';
  };

  const getTransactionIcon = (transaction) => {
    // Prioriza o método de pagamento sobre a categoria
    if (transaction.paymentMethod) {
      const paymentIcons = {
        'pix': '📱',
        'credito': '💳',
        'debito': '💸',
        'dinheiro': '💵',
        'transferencia': '🏦',
        'boleto': '📄'
      };
      return paymentIcons[transaction.paymentMethod?.toLowerCase()] || getCategoryIcon(transaction.category, transaction.type);
    }
    
    // Se não tem método de pagamento, usa o ícone da categoria
    return getCategoryIcon(transaction.category, transaction.type);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Título da página */}
        <Text style={styles.pageTitle}>Dashboard</Text>
        
        {/* Seletor de meses moderno */}
        <SafeAreaView style={styles.modernMonthSelector}>
          <TouchableOpacity
            style={styles.modernNavBtn}
            onPress={() => changeMonth(-1)}
          >
            <Ionicons name="chevron-back" size={20} color="#667eea" />
          </TouchableOpacity>
          
          <View style={styles.modernMonthDisplay}>
            <Text style={styles.modernMonthText}>
              {getMonthName(selectedMonth)} {selectedYear}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.modernNavBtn}
            onPress={() => changeMonth(1)}
          >
            <Ionicons name="chevron-forward" size={20} color="#667eea" />
          </TouchableOpacity>
        </SafeAreaView>

      {/* Cards de Estatísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.balanceCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Saldo Atual</Text>
              <Text style={styles.statEmoji}>💰</Text>
            </View>
            <Text style={[
              styles.statValue,
              { color: (data.stats?.balance ?? 0) >= 0 ? theme.colors.success : theme.colors.danger }
            ]}>
              {formatCurrency(data.stats?.balance)}
            </Text>
          </View>
          
          <View style={[styles.statCard, styles.creditCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Cartão Crédito</Text>
              <Text style={styles.statEmoji}>💳</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {formatCurrency(data.creditCardTotal)}
            </Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.incomeCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Receitas</Text>
              <Text style={styles.statEmoji}>📈</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              {formatCurrency(data.stats?.income)}
            </Text>
          </View>
          
          <View style={[styles.statCard, styles.expenseCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Despesas</Text>
              <Text style={styles.statEmoji}>📉</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.colors.danger }]}>
              {formatCurrency(data.stats?.expense)}
            </Text>
          </View>
        </View>
      </View>

      {/* Transações Recentes */}
      <View style={styles.dashboardCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💳 Transações Recentes</Text>
        </View>
        
        <View style={styles.transactionsContainer}>
          {(data.recentTransactions || []).slice(0, 5).map((transaction, index) => {
            // Função para obter ícone da categoria (igual ao web)
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

            const getTransactionIcon = (transaction) => {
              // Prioriza o método de pagamento sobre a categoria
              if (transaction.paymentMethod) {
                const paymentIcons = {
                  'pix': '📱',
                  'credito': '💳',
                  'debito': '💸',
                  'dinheiro': '💵',
                  'transferencia': '🏦',
                  'boleto': '📄'
                };
                return paymentIcons[transaction.paymentMethod?.toLowerCase()] || getCategoryIcon(transaction.category, transaction.type);
              }
              
              // Se não tem método de pagamento, usa o ícone da categoria
              return getCategoryIcon(transaction.category, transaction.type);
            };

            return (
              <TouchableOpacity
                key={transaction._id || index}
                style={styles.transactionItem}
              >
                <View style={styles.transactionContent}>
                  <View style={[
                    styles.transactionIconContainer,
                    { backgroundColor: transaction.type === 'income' ? theme.colors.success + '20' : theme.colors.danger + '20' }
                  ]}>
                    <Text style={styles.categoryEmoji}>
                      {getTransactionIcon(transaction)}
                    </Text>
                  </View>

                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>
                      {transaction.description}
                      {transaction.isInstallment && (
                        <Text style={styles.installmentText}>
                          {' '}({transaction.installmentNumber}/{transaction.totalInstallments})
                        </Text>
                      )}
                      {transaction.isFixed && (
                        <Text style={styles.fixedText}> FIXA</Text>
                      )}
                    </Text>
                    <Text style={styles.transactionCategory}>
                      {transaction.category}
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
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </Text>
                    {transaction.notes && (
                      <Text style={styles.transactionNotes}>
                        📝 {transaction.notes}
                      </Text>
                    )}
                  </View>

                  <Text style={[
                    styles.transactionValue,
                    { color: transaction.type === 'income' ? theme.colors.success : theme.colors.danger }
                  ]}>
                    {transaction.type === 'income' ? '+' : '-'}R$ {(transaction.amount || 0).toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {(data.recentTransactions || []).length === 0 && (
          <View style={styles.noTransactions}>
            <Text style={styles.noTransactionsIcon}>📄</Text>
            <Text style={styles.noTransactionsTitle}>Nenhuma transação</Text>
            <Text style={styles.noTransactionsSubtitle}>Adicione uma transação para começar</Text>
          </View>
        )}
      </View>
      </ScrollView>
    </View>
  );
};

// 💳 TRANSAÇÕES
const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpdateAllModal, setShowUpdateAllModal] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
    }
  }, [isAuthenticated]);

  const fetchTransactions = async (month = selectedMonth, year = selectedYear) => {
    try {
      setLoading(true);
      const data = await ApiService.request(`/transactions?month=${month}&year=${year}`);
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      setTransactions([]);
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
    fetchTransactions(newMonth, newYear);
  };

  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const handleDeletePress = (transaction) => {
    setTransactionToDelete(transaction);
    // Verificar se é uma transação fixa ou parcelada
    if (transaction.isRecurring || transaction.recurringParentId || transaction.totalInstallments > 1) {
      setShowDeleteAllModal(true);
    } else {
      setShowDeleteModal(true);
    }
  };

  const handleDeleteTransaction = async (deleteAll = false) => {
    if (!transactionToDelete) return;

    try {
      let endpoint = `/transactions/${transactionToDelete._id}`;
      if (deleteAll) {
        endpoint += '?deleteAll=true';
      }

      await ApiService.request(endpoint, {
        method: 'DELETE'
      });

      // Recarregar transações
      fetchTransactions();
      
      Alert.alert(
        'Sucesso',
        deleteAll ? 'Todas as transações relacionadas foram excluídas!' : 'Transação excluída com sucesso!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      Alert.alert(
        'Erro',
        'Não foi possível excluir a transação. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setTransactionToDelete(null);
      setShowDeleteModal(false);
      setShowDeleteAllModal(false);
    }
  };

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

  const getPaymentIcon = (paymentMethod) => {
    const paymentIcons = {
      'pix': '📱',
      'credito': '💳',
      'debito': '💸',
      'dinheiro': '💵',
      'transferencia': '🏦',
      'boleto': '📄'
    };
    return paymentIcons[paymentMethod?.toLowerCase()] || '💳';
  };

  const getTransactionIcon = (transaction) => {
    // Prioriza o método de pagamento sobre a categoria
    if (transaction.paymentMethod) {
      const paymentIcons = {
        'pix': '📱',
        'credito': '💳',
        'debito': '💸',
        'dinheiro': '💵',
        'transferencia': '🏦',
        'boleto': '📄'
      };
      return paymentIcons[transaction.paymentMethod?.toLowerCase()] || getCategoryIcon(transaction.category, transaction.type);
    }
    
    // Se não tem método de pagamento, usa o ícone da categoria
    return getCategoryIcon(transaction.category, transaction.type);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        {/* Seletor de meses moderno */}
        <SafeAreaView style={styles.modernMonthSelector}>
          <TouchableOpacity
            style={styles.modernNavBtn}
            onPress={() => changeMonth(-1)}
          >
            <Ionicons name="chevron-back" size={20} color="#667eea" />
          </TouchableOpacity>
          
          <View style={styles.modernMonthDisplay}>
            <Text style={styles.modernMonthText}>
              {getMonthName(selectedMonth)} {selectedYear}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.modernNavBtn}
            onPress={() => changeMonth(1)}
          >
            <Ionicons name="chevron-forward" size={20} color="#667eea" />
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Título da página */}
      <Text style={styles.pageTitle}>Transações</Text>
      
      {/* Seletor de meses moderno */}
      <SafeAreaView style={styles.modernMonthSelector}>
        <TouchableOpacity
          style={styles.modernNavBtn}
          onPress={() => changeMonth(-1)}
        >
          <Ionicons name="chevron-back" size={20} color="#667eea" />
        </TouchableOpacity>
        
        <View style={styles.modernMonthDisplay}>
          <Text style={styles.modernMonthText}>
            {getMonthName(selectedMonth)} {selectedYear}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.modernNavBtn}
          onPress={() => changeMonth(1)}
        >
          <Ionicons name="chevron-forward" size={20} color="#667eea" />
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
        <View style={styles.transactionsContainer}>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhuma transação encontrada</Text>
            </View>
          ) : (
            transactions.map((transaction, index) => {
              // Função para obter ícone da categoria (igual ao dashboard)
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

              const getTransactionIcon = (transaction) => {
                // Prioriza o método de pagamento sobre a categoria
                if (transaction.paymentMethod) {
                  const paymentIcons = {
                    'pix': '📱',
                    'credito': '💳',
                    'debito': '💸',
                    'dinheiro': '💵',
                    'transferencia': '🏦',
                    'boleto': '📄'
                  };
                  return paymentIcons[transaction.paymentMethod?.toLowerCase()] || getCategoryIcon(transaction.category, transaction.type);
                }
                
                // Se não tem método de pagamento, usa o ícone da categoria
                return getCategoryIcon(transaction.category, transaction.type);
              };

              return (
                <TouchableOpacity
                  key={transaction._id || index}
                  style={styles.transactionItem}
                >
                  <View style={styles.transactionContent}>
                    <View style={[
                      styles.transactionIconContainer,
                      { backgroundColor: transaction.type === 'income' ? theme.colors.success + '20' : theme.colors.danger + '20' }
                    ]}>
                      <Text style={styles.categoryEmoji}>
                        {getTransactionIcon(transaction)}
                      </Text>
                    </View>

                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionDescription}>
                        {transaction.description}
                        {transaction.isInstallment && (
                          <Text style={styles.installmentText}>
                            {' '}({transaction.installmentNumber}/{transaction.totalInstallments})
                          </Text>
                        )}
                        {transaction.isFixed && (
                          <Text style={styles.fixedText}> FIXA</Text>
                        )}
                      </Text>
                      <Text style={styles.transactionCategory}>
                        {transaction.category}
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
                      </Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </Text>
                      {transaction.notes && (
                        <Text style={styles.transactionNotes}>📝 {transaction.notes}</Text>
                      )}
                    </View>

                    <View style={styles.transactionValueContainer}>
                      <Text style={[
                        styles.transactionValue,
                        { color: transaction.type === 'income' ? theme.colors.success : theme.colors.danger }
                      ]}>
                        {transaction.type === 'income' ? '+' : '-'}R$ {(transaction.amount || 0).toFixed(2)}
                      </Text>
                      
                      {/* Botões de ação */}
                      <View style={styles.transactionActions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.editBtn]}
                          onPress={() => handleEditTransaction(transaction)}
                        >
                          <Text style={styles.actionBtnText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteBtn]}
                          onPress={() => handleDeletePress(transaction)}
                        >
                          <Text style={styles.actionBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal de confirmação simples */}
      {showDeleteModal && transactionToDelete && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showDeleteModal}
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirmar Exclusão</Text>
              <Text style={styles.modalText}>
                Deseja excluir a transação "{transactionToDelete.description}"?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={() => handleDeleteTransaction(false)}
                >
                  <Text style={styles.deleteButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal de confirmação para transações fixas/parceladas */}
      {showDeleteAllModal && transactionToDelete && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showDeleteAllModal}
          onRequestClose={() => setShowDeleteAllModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {transactionToDelete.isRecurring || transactionToDelete.recurringParentId 
                  ? '🔄 Deletar Transação Fixa' 
                  : '💳 Deletar Parcelamento'
                }
              </Text>
              <View style={styles.transactionPreview}>
                <Text style={styles.previewTitle}>{transactionToDelete.description}</Text>
                <Text style={[
                  styles.previewAmount,
                  { color: transactionToDelete.type === 'income' ? theme.colors.success : theme.colors.danger }
                ]}>
                  {transactionToDelete.type === 'income' ? '+' : '-'}R$ {(transactionToDelete.amount || 0).toFixed(2)}
                </Text>
                {transactionToDelete.installmentNumber > 0 && (
                  <Text style={styles.previewInstallment}>
                    Parcela {transactionToDelete.installmentNumber} de {transactionToDelete.totalInstallments}
                  </Text>
                )}
              </View>
              
              <Text style={styles.modalText}>
                {transactionToDelete.isRecurring || transactionToDelete.recurringParentId 
                  ? 'Esta é uma transação fixa. O que deseja fazer?'
                  : 'Esta é uma transação parcelada. O que deseja fazer?'
                }
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowDeleteAllModal(false)}
                >
                  <Text style={styles.cancelButtonText}>❌ Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.warningButton]}
                  onPress={() => handleDeleteTransaction(false)}
                >
                  <Text style={styles.warningButtonText}>🗓️ Apenas Este Mês</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={() => handleDeleteTransaction(true)}
                >
                  <Text style={styles.deleteButtonText}>
                    🗑️ {transactionToDelete.isRecurring || transactionToDelete.recurringParentId ? 'Todos os Meses' : 'Todas as Parcelas'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal de Edição de Transação */}
      {showEditModal && editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onSave={async (updatedTransaction) => {
            try {
              const response = await ApiService.updateTransaction(editingTransaction._id, updatedTransaction);
              if (response.success) {
                Alert.alert('Sucesso', 'Transação atualizada com sucesso!');
                fetchTransactions();
                setShowEditModal(false);
                setEditingTransaction(null);
              } else {
                Alert.alert('Erro', response.message || 'Erro ao atualizar transação');
              }
            } catch (error) {
              Alert.alert('Erro', 'Erro ao atualizar transação');
            }
          }}
          onCancel={() => {
            setShowEditModal(false);
            setEditingTransaction(null);
          }}
        />
      )}
    </View>
  );
};

// Modal de Edição de Transação
const EditTransactionModal = ({ transaction, onSave, onCancel }) => {
  // Estados para o formulário
  const [formData, setFormData] = useState({
    type: transaction.type || 'expense',
    date: transaction.date ? formatDateToBR(transaction.date) : formatDateToBR(new Date().toISOString()),
    paymentMethod: transaction.paymentMethod || 'debito',
    bank: transaction.bank || '',
    creditCard: transaction.creditCard || '',
    description: transaction.description || '',
    amount: formatInitialAmount(transaction.amount) || '',
    category: transaction.category || '',
    isRecurring: transaction.isRecurring || false,
    isInstallment: transaction.totalInstallments > 1 || false,
    totalInstallments: transaction.totalInstallments || 2
  });

  const [pendingFormData, setPendingFormData] = useState(null);
  const [showUpdateAllModal, setShowUpdateAllModal] = useState(false);

  // Função para formatar valor inicial
  function formatInitialAmount(amount) {
    if (!amount) return '';
    const numericValue = parseFloat(amount);
    if (isNaN(numericValue)) return '';
    return numericValue.toFixed(2).replace('.', ',');
  }

  // Função para converter data de AAAA-MM-DD para DD-MM-AAAA
  function formatDateToBR(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}-${month}-${year}`;
  }

  // Função para converter data de DD-MM-AAAA para AAAA-MM-DD
  function formatDateToISO(dateString) {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  }

  // Função para formatar currency
  const formatCurrency = (value) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue === '') return '';
    const number = parseFloat(numericValue) / 100;
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Handle amount change
  const handleAmountChange = (value) => {
    const formatted = formatCurrency(value);
    setFormData(prev => ({
      ...prev,
      amount: formatted
    }));
  };

  // Função para mostrar seletor de banco
  const showBankSelector = () => {
    const banks = [
      'Selecione o banco',
      'Banco do Brasil',
      'Bradesco',
      'Caixa Econômica',
      'Itaú',
      'Santander',
      'Nubank',
      'Inter',
      'C6 Bank',
      'XP Investimentos',
      'BTG Pactual',
      'Next',
      'Neon',
      'PagBank',
      'Picpay',
      '99Pay',
      'Mercado Pago',
      'Stone',
      'Outros'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...banks, 'Cancelar'],
          cancelButtonIndex: banks.length,
        },
        (buttonIndex) => {
          if (buttonIndex !== banks.length && buttonIndex !== 0) {
            setFormData(prev => ({ ...prev, bank: banks[buttonIndex] }));
          } else if (buttonIndex === 0) {
            setFormData(prev => ({ ...prev, bank: '' }));
          }
        }
      );
    } else {
      // Para Android, vamos usar um Alert simples por enquanto
      Alert.alert(
        'Selecionar Banco',
        'Escolha um banco:',
        banks.slice(1).map((bank, index) => ({
          text: bank,
          onPress: () => setFormData(prev => ({ ...prev, bank: bank }))
        })).concat([
          { text: 'Cancelar', style: 'cancel' }
        ])
      );
    }
  };

  // Função para mostrar seletor de cartão
  const showCreditCardSelector = () => {
    const cards = [
      'Selecione o cartão',
      'BB Visa',
      'BB Mastercard',
      'BB Elo',
      'Bradesco Visa',
      'Bradesco Mastercard',
      'Bradesco Elo',
      'Caixa Visa',
      'Caixa Mastercard',
      'Caixa Elo',
      'Itaú Visa',
      'Itaú Mastercard',
      'Itaú Elo',
      'Santander Visa',
      'Santander Mastercard',
      'Nubank Mastercard',
      'Inter Mastercard',
      'Inter Visa',
      'C6 Mastercard',
      'BTG Black',
      'BTG Mastercard',
      'Next Mastercard',
      'PagBank Visa',
      'PicPay Visa',
      'Mercado Pago Mastercard',
      'Outros'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...cards, 'Cancelar'],
          cancelButtonIndex: cards.length,
        },
        (buttonIndex) => {
          if (buttonIndex !== cards.length && buttonIndex !== 0) {
            setFormData(prev => ({ ...prev, creditCard: cards[buttonIndex] }));
          } else if (buttonIndex === 0) {
            setFormData(prev => ({ ...prev, creditCard: '' }));
          }
        }
      );
    } else {
      Alert.alert(
        'Selecionar Cartão',
        'Escolha um cartão:',
        cards.slice(1).map((card, index) => ({
          text: card,
          onPress: () => setFormData(prev => ({ ...prev, creditCard: card }))
        })).concat([
          { text: 'Cancelar', style: 'cancel' }
        ])
      );
    }
  };

  // Função para mostrar seletor de categoria
  const showCategorySelector = () => {
    const incomeCategories = ['Salário', 'Freelance', 'Investimentos', 'Outros'];
    const expenseCategories = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Outros'];
    const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...categories, 'Cancelar'],
          cancelButtonIndex: categories.length,
        },
        (buttonIndex) => {
          if (buttonIndex !== categories.length) {
            setFormData(prev => ({ ...prev, category: categories[buttonIndex] }));
          }
        }
      );
    } else {
      Alert.alert(
        'Selecionar Categoria',
        'Escolha uma categoria:',
        categories.map((category, index) => ({
          text: category,
          onPress: () => setFormData(prev => ({ ...prev, category: category }))
        })).concat([
          { text: 'Cancelar', style: 'cancel' }
        ])
      );
    }
  };

  const handleSubmit = () => {
    // Validar campos obrigatórios
    if (!formData.description.trim() || !formData.amount.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    // Converter valor para número
    const numericAmount = parseFloat(formData.amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    const transactionData = {
      ...formData,
      date: formatDateToISO(formData.date),
      amount: numericAmount
    };

    // Verificar se é transação recorrente e houve mudanças significativas
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

  return (
    <>
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Editar Transação</Text>
              <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Formulário */}
            <View style={styles.modalBody}>
              {/* 1. TIPO - Receita/Despesa */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tipo *</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      styles.incomeButton,
                      formData.type === 'income' && styles.activeButton
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                  >
                    <Text style={[styles.buttonText, formData.type === 'income' && styles.activeButtonText]}>
                      💰 Receita
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      styles.expenseButton,
                      formData.type === 'expense' && styles.activeButton
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                  >
                    <Text style={[styles.buttonText, formData.type === 'expense' && styles.activeButtonText]}>
                      💸 Despesa
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. DATA */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Data *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.date}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, date: value }))}
                  placeholder="DD-MM-AAAA"
                />
              </View>

              {/* 3. TIPO DE PAGAMENTO */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tipo de Pagamento *</Text>
                <View style={styles.paymentButtons}>
                  <TouchableOpacity
                    style={[
                      styles.paymentButton,
                      formData.paymentMethod === 'debito' && styles.activePaymentButton
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, paymentMethod: 'debito' }))}
                  >
                    <Text style={[styles.buttonText, formData.paymentMethod === 'debito' && styles.activeButtonText]}>
                      💳 Débito
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.paymentButton,
                      formData.paymentMethod === 'credito' && styles.activePaymentButton
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, paymentMethod: 'credito' }))}
                  >
                    <Text style={[styles.buttonText, formData.paymentMethod === 'credito' && styles.activeButtonText]}>
                      🏦 Crédito
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.paymentButton,
                      formData.paymentMethod === 'pix' && styles.activePaymentButton,
                      formData.isInstallment && styles.disabledButton
                    ]}
                    disabled={formData.isInstallment}
                    onPress={() => {
                      if (!formData.isInstallment) {
                        setFormData(prev => ({ 
                          ...prev, 
                          paymentMethod: 'pix',
                          isInstallment: false
                        }));
                      }
                    }}
                  >
                    <Text style={[
                      styles.buttonText, 
                      formData.paymentMethod === 'pix' && styles.activeButtonText,
                      formData.isInstallment && styles.disabledButtonText
                    ]}>
                      📱 PIX
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Campo Banco (para débito e PIX) */}
              {(formData.paymentMethod === 'debito' || formData.paymentMethod === 'pix') && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Banco</Text>
                  <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={showBankSelector}
                  >
                    <Text style={[styles.selectorText, !formData.bank && styles.placeholderText]}>
                      {formData.bank || 'Selecione o banco'}
                    </Text>
                    <Text style={styles.selectorArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Campo Cartão (para crédito) */}
              {formData.paymentMethod === 'credito' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Cartão de Crédito</Text>
                  <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={showCreditCardSelector}
                  >
                    <Text style={[styles.selectorText, !formData.creditCard && styles.placeholderText]}>
                      {formData.creditCard || 'Selecione o cartão'}
                    </Text>
                    <Text style={styles.selectorArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Descrição e Valor - em linha */}
              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Descrição *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.description}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, description: value }))}
                    placeholder="Ex: Almoço, Salário, etc."
                  />
                </View>

                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Valor *</Text>
                  <View style={styles.currencyInput}>
                    <Text style={styles.currencySymbol}>R$</Text>
                    <TextInput
                      style={styles.currencyInputField}
                      value={formData.amount}
                      onChangeText={handleAmountChange}
                      placeholder="0,00"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* 6. CATEGORIA */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Categoria</Text>
                <TouchableOpacity
                  style={styles.selectorButton}
                  onPress={showCategorySelector}
                >
                  <Text style={[styles.selectorText, !formData.category && styles.placeholderText]}>
                    {formData.category || 'Selecione uma categoria'}
                  </Text>
                  <Text style={styles.selectorArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* 7. RECORRENTE */}
              <View style={styles.checkboxGroup}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => {
                    if (!transaction.recurringParentId && !transaction.isRecurring && 
                        !transaction.installmentParentId && transaction.installmentNumber <= 0) {
                      setFormData(prev => ({
                        ...prev,
                        isRecurring: !prev.isRecurring,
                        isInstallment: prev.isRecurring ? prev.isInstallment : false
                      }));
                    }
                  }}
                  disabled={transaction.recurringParentId || transaction.isRecurring || 
                           transaction.installmentParentId || transaction.installmentNumber > 0}
                >
                  <View style={[
                    styles.checkbox,
                    formData.isRecurring && styles.checkboxActive,
                    (transaction.recurringParentId || transaction.isRecurring || 
                     transaction.installmentParentId || transaction.installmentNumber > 0) && styles.checkboxDisabled
                  ]}>
                    {formData.isRecurring && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[
                    styles.checkboxText,
                    (transaction.installmentParentId || transaction.installmentNumber > 0) && styles.disabledText
                  ]}>
                    Transação Fixa (repete todos os meses)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 7. PARCELAMENTO */}
              <View style={styles.checkboxGroup}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => {
                    if (!formData.isRecurring && !transaction.installmentParentId && transaction.installmentNumber <= 0) {
                      setFormData(prev => ({
                        ...prev,
                        isInstallment: !prev.isInstallment,
                        paymentMethod: (!prev.isInstallment && prev.paymentMethod === 'pix') ? 'debito' : prev.paymentMethod
                      }));
                    }
                  }}
                  disabled={formData.isRecurring || transaction.installmentParentId || transaction.installmentNumber > 0}
                >
                  <View style={[
                    styles.checkbox,
                    formData.isInstallment && styles.checkboxActive,
                    (formData.isRecurring || transaction.installmentParentId || transaction.installmentNumber > 0) && styles.checkboxDisabled
                  ]}>
                    {formData.isInstallment && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.checkboxTextContainer}>
                    <Text style={[
                      styles.checkboxText,
                      (transaction.installmentParentId || transaction.installmentNumber > 0) && styles.disabledText
                    ]}>
                      Parcelado (crédito/débito apenas)
                    </Text>
                    {transaction.installmentNumber > 0 && (
                      <Text style={styles.installmentInfo}>
                        Parcela {transaction.installmentNumber} de {transaction.totalInstallments}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Campo de número de parcelas */}
              {formData.isInstallment && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Número de Parcelas:</Text>
                  <TextInput
                    style={[
                      styles.input,
                      (transaction.installmentParentId || transaction.installmentNumber > 0) && styles.disabledInput
                    ]}
                    value={formData.totalInstallments.toString()}
                    onChangeText={(value) => {
                      const numValue = parseInt(value) || 2;
                      if (numValue >= 2 && numValue <= 60) {
                        setFormData(prev => ({ ...prev, totalInstallments: numValue }));
                      }
                    }}
                    keyboardType="numeric"
                    editable={!transaction.installmentParentId && transaction.installmentNumber <= 0}
                  />
                  <Text style={styles.helperText}>
                    {(transaction.installmentParentId || transaction.installmentNumber > 0) 
                      ? `Parcela fixa: ${transaction.totalInstallments} parcelas` 
                      : 'De 2 a 60 parcelas'
                    }
                  </Text>
                </View>
              )}
            </View>

            {/* Footer com botões */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>❌ Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                <Text style={styles.saveButtonText}>💾 Salvar Alterações</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de Confirmação para Edição de Transação Recorrente */}
      {showUpdateAllModal && (
        <Modal
          visible={true}
          animationType="fade"
          transparent={true}
        >
          <View style={styles.overlay}>
            <View style={styles.alertModal}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitle}>Atualizar Transação Fixa</Text>
              </View>
              <View style={styles.alertBody}>
                <Text style={styles.alertText}>
                  <Text style={styles.boldText}>Esta é uma transação fixa.</Text>
                </Text>
                <Text style={styles.alertText}>Deseja aplicar as alterações:</Text>
              </View>
              <View style={styles.alertFooter}>
                <TouchableOpacity 
                  style={styles.alertButtonSecondary}
                  onPress={() => setShowUpdateAllModal(false)}
                >
                  <Text style={styles.alertButtonSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.alertButtonPrimary}
                  onPress={() => handleUpdateChoice(false)}
                >
                  <Text style={styles.alertButtonPrimaryText}>Apenas Este Mês</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.alertButtonPrimary}
                  onPress={() => handleUpdateChoice(true)}
                >
                  <Text style={styles.alertButtonPrimaryText}>Todos os Meses</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

// 💳 CARTÕES
const CardsPage = () => {
  const [creditCards, setCreditCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  
  // Estados para modal de extrato
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardTransactions, setCardTransactions] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const { isAuthenticated } = useAuth();

  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchCreditCards();
    }
  }, [isAuthenticated]);

  const fetchCreditCards = async () => {
    try {
      const data = await ApiService.getCreditCards();
      setCreditCards(data);
    } catch (error) {
      console.error('Erro ao buscar cartões:', error);
      setCreditCards([]);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de extrato do cartão
  const openCardModal = async (card) => {
    setSelectedCard(card);
    const now = new Date();
    const currentMonthNum = now.getMonth() + 1; // 1-12
    setCurrentMonth(currentMonthNum);
    setCurrentYear(now.getFullYear());
    await loadCardTransactions(card.name, now.getMonth(), now.getFullYear()); // 0-11 para API
    setShowCardModal(true);
  };

  // Carregar transações do cartão por mês (EXATAMENTE igual aos bancos)
  const loadCardTransactions = async (cardName, month, year) => {
    try {
      console.log(`💳 Carregando transações para ${cardName} - Mês: ${month + 1}/${year}`);
      
      // CHAMADA IDÊNTICA aos bancos
      const data = await ApiService.request(`/transactions?month=${month + 1}&year=${year}`);
      console.log(`📊 Total de transações da API: ${data.length}`);
      data.forEach(t => console.log(`  📄 ${t.description} - Cartão: ${t.creditCard} - Método: ${t.paymentMethod}`));
      
      // Filtrar transações do cartão
      const cardTxns = data.filter(t => 
        t.creditCard === cardName && t.paymentMethod === 'credito'
      );
      
      console.log(`✅ Transações filtradas para ${cardName}: ${cardTxns.length}`);
      setCardTransactions(cardTxns.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Erro ao carregar transações do cartão:', error);
      setCardTransactions([]);
    }
  };

  // Navegação de mês (padrão mobile igual aos bancos)
  const goToPreviousMonth = async () => {
    console.log('🔙 Navegando para mês anterior');
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    console.log(`📅 Novo mês: ${newMonth}/${newYear}`);
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    await loadCardTransactions(selectedCard.name, newMonth - 1, newYear); // -1 para API (0-11)
  };

  const goToNextMonth = async () => {
    console.log('🔜 Navegando para próximo mês');
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    
    console.log(`📅 Novo mês: ${newMonth}/${newYear}`);
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    await loadCardTransactions(selectedCard.name, newMonth - 1, newYear); // -1 para API (0-11)
  };

  const closeModal = () => {
    setShowCardModal(false);
    setSelectedCard(null);
    setCardTransactions([]);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getTotalLimit = () => {
    return creditCards.reduce((total, card) => total + (card.limit || 0), 0);
  };

  const getTotalUsed = () => {
    return creditCards.reduce((total, card) => total + (card.usedAmount || 0), 0);
  };

  const getAvailableLimit = () => {
    return getTotalLimit() - getTotalUsed();
  };

  // Função para obter a cor do cartão baseada no nome/banco
  const getCardColor = (cardName) => {
    const colors = {
      'nubank': '#8A05BE',
      'inter': '#FF7A00',
      'c6': '#000000',
      'itau': '#EC7000',
      'itaú': '#EC7000',
      'bradesco': '#C8102E',
      'santander': '#EC1C24',
      'banco do brasil': '#FFD700',
      'bb': '#FFD700',
      'btg': '#000000',
      'next': '#00A859',
      'pagbank': '#00A859',
      'picpay': '#11C76F',
    };
    
    const normalizedName = cardName.toLowerCase();
    for (const [key, color] of Object.entries(colors)) {
      if (normalizedName.includes(key)) {
        return color;
      }
    }
    return '#6366F1'; // Cor padrão roxa
  };

  const getUsagePercentage = (used, limit) => {
    if (!limit || limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage < 30) return '#10b981'; // Verde
    if (percentage < 70) return '#f59e0b'; // Amarelo
    return '#ef4444'; // Vermelho
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando cartões...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>💳 Cartões</Text>
        
        {/* Card de Resumo Total */}
        <View style={styles.totalLimitCard}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.totalLimitGradient}
          >
            <Text style={styles.totalLimitLabel}>Limite Total</Text>
            <Text style={styles.totalLimitAmount}>
              {formatCurrency(getTotalLimit())}
            </Text>
            <View style={styles.limitDetails}>
              <View style={styles.limitDetailItem}>
                <Text style={styles.limitDetailLabel}>Usado</Text>
                <Text style={styles.limitDetailValue}>
                  {formatCurrency(getTotalUsed())}
                </Text>
              </View>
              <View style={styles.limitDetailItem}>
                <Text style={styles.limitDetailLabel}>Disponível</Text>
                <Text style={styles.limitDetailValue}>
                  {formatCurrency(getAvailableLimit())}
                </Text>
              </View>
            </View>
            <Text style={styles.totalLimitSubtext}>
              {creditCards.length} {creditCards.length === 1 ? 'cartão' : 'cartões'} cadastrado{creditCards.length === 1 ? '' : 's'}
            </Text>
          </LinearGradient>
        </View>

        {/* Lista de Cartões */}
        <View style={styles.cardsContainer}>
          {creditCards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhum cartão cadastrado</Text>
            </View>
          ) : (
            creditCards.map((card) => {
              const usagePercentage = getUsagePercentage(card.usedAmount, card.limit);
              const usageColor = getUsageColor(usagePercentage);
              
              return (
                <TouchableOpacity 
                  key={card._id} 
                  style={styles.creditCard}
                  onPress={() => openCardModal(card)}
                >
                  <View style={styles.creditCardHeader}>
                    <View style={[styles.creditCardIcon, { backgroundColor: getCardColor(card.name) }]}>
                      <Ionicons name="card" size={24} color="#fff" />
                    </View>
                    <View style={styles.creditCardInfo}>
                      <Text style={styles.creditCardName}>{card.name}</Text>
                      <Text style={styles.creditCardBank}>{card.bank || 'Banco'}</Text>
                    </View>
                    <TouchableOpacity style={styles.creditCardMenuButton}>
                      <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.creditCardLimits}>
                    <View style={styles.limitRow}>
                      <Text style={styles.limitLabel}>Limite Total</Text>
                      <Text style={styles.limitValue}>
                        {formatCurrency(card.limit)}
                      </Text>
                    </View>
                    
                    <View style={styles.limitRow}>
                      <Text style={styles.limitLabel}>Limite Usado</Text>
                      <Text style={[styles.limitValue, { color: usageColor }]}>
                        {formatCurrency(card.usedAmount)}
                      </Text>
                    </View>
                    
                    <View style={styles.limitRow}>
                      <Text style={styles.limitLabel}>Limite Disponível</Text>
                      <Text style={[styles.limitValue, { color: '#10b981' }]}>
                        {formatCurrency((card.limit || 0) - (card.usedAmount || 0))}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Barra de progresso do uso */}
                  <View style={styles.usageBar}>
                    <View style={styles.usageBarBackground}>
                      <View 
                        style={[
                          styles.usageBarFill,
                          { 
                            width: `${usagePercentage}%`,
                            backgroundColor: usageColor
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.usagePercentage}>
                      {usagePercentage.toFixed(1)}% utilizado
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Card para adicionar novo cartão */}
          <TouchableOpacity 
            style={styles.addCardCard}
            onPress={() => setShowAddCardModal(true)}
          >
            <Ionicons name="add-circle-outline" size={32} color="#6366F1" />
            <Text style={styles.addCardText}>Adicionar Cartão</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Modal de Extratos do Cartão */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCardModal && selectedCard}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="arrow-back" size={24} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Extrato - {selectedCard?.name}
              </Text>
              <View style={styles.placeholder} />
            </View>

            {/* Seletor de meses moderno */}
            <SafeAreaView style={styles.modernMonthSelector}>
              <TouchableOpacity
                style={styles.modernNavBtn}
                onPress={goToPreviousMonth}
              >
                <Ionicons name="chevron-back" size={20} color="#667eea" />
              </TouchableOpacity>
              
              <View style={styles.modernMonthDisplay}>
                <Text style={styles.modernMonthText}>
                  {getMonthName(currentMonth)} {currentYear}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.modernNavBtn}
                onPress={goToNextMonth}
              >
                <Ionicons name="chevron-forward" size={20} color="#667eea" />
              </TouchableOpacity>
            </SafeAreaView>

            <ScrollView style={styles.transactionsList}>
              {cardTransactions.length > 0 ? (
                cardTransactions.map((transaction) => (
                  <View key={transaction._id} style={styles.transactionItem}>
                    <View style={styles.transactionContent}>
                      <View style={[
                        styles.transactionIconContainer,
                        { backgroundColor: transaction.type === 'income' ? '#22c55e20' : '#ef444420' }
                      ]}>
                        <Text style={styles.categoryEmoji}>💳</Text>
                      </View>

                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionDescription}>
                          {transaction.description}
                          {transaction.isInstallment && (
                            <Text style={styles.installmentText}>
                              {' '}({transaction.installmentNumber}/{transaction.totalInstallments})
                            </Text>
                          )}
                          {transaction.isFixed && (
                            <Text style={styles.fixedText}> FIXA</Text>
                          )}
                        </Text>
                        <Text style={styles.transactionCategory}>
                          {transaction.category}
                          {transaction.creditCard && ` • 💳 ${transaction.creditCard}`}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </Text>
                        {transaction.notes && (
                          <Text style={styles.transactionNotes}>📝 {transaction.notes}</Text>
                        )}
                      </View>

                      <View style={styles.transactionValueContainer}>
                        <Text style={[
                          styles.transactionValue,
                          { color: transaction.type === 'income' ? '#22c55e' : '#ef4444' }
                        ]}>
                          {transaction.type === 'income' ? '+' : '-'}R$ {(transaction.amount || 0).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noTransactionsContainer}>
                  <Text style={styles.noTransactionsText}>
                    Nenhuma transação encontrada para este período
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// 🏦 BANCOS
const BanksScreen = () => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  
  // Estados para modal de extrato
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankTransactions, setBankTransactions] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const { isAuthenticated } = useAuth();

  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchBanks();
      // CORRIGIR transações fixas sem banco na primeira vez
      fixRecurringTransactions();
    }
  }, [isAuthenticated]);

  const fixRecurringTransactions = async () => {
    try {
      console.log('🔧 Corrigindo transações fixas...');
      await ApiService.request('/fix-recurring-transactions', 'GET');
      console.log('✅ Transações fixas corrigidas!');
    } catch (error) {
      console.error('Erro ao corrigir transações fixas:', error);
    }
  };

  const fetchBanks = async () => {
    try {
      const data = await ApiService.getBanks();
      setBanks(data);
    } catch (error) {
      console.error('Erro ao buscar bancos:', error);
      setBanks([]);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de extrato do banco
  const openBankModal = async (bank) => {
    setSelectedBank(bank);
    const now = new Date();
    const currentMonthNum = now.getMonth() + 1; // 1-12
    setCurrentMonth(currentMonthNum);
    setCurrentYear(now.getFullYear());
    await loadBankTransactions(bank.name, now.getMonth(), now.getFullYear()); // 0-11 para API
    setShowBankModal(true);
  };

  // Carregar transações do banco por mês (EXATAMENTE igual à página de transações)
  const loadBankTransactions = async (bankName, month, year) => {
    try {
      console.log(`🏦 Carregando transações para ${bankName} - Mês: ${month + 1}/${year}`);
      
      // CHAMADA IDÊNTICA à página de transações: usar o mês como está (0-11 vira 1-12 no backend)
      const data = await ApiService.request(`/transactions?month=${month + 1}&year=${year}`);
      console.log(`📊 Total de transações da API: ${data.length}`);
      data.forEach(t => console.log(`  📄 ${t.description} - Banco: ${t.bank} - Método: ${t.paymentMethod}`));
      
      // Filtrar transações do banco
      const bankTxns = data.filter(t => 
        t.bank === bankName && (t.paymentMethod === 'debito' || t.paymentMethod === 'pix')
      );
      
      console.log(`✅ Transações filtradas para ${bankName}: ${bankTxns.length}`);
      setBankTransactions(bankTxns.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Erro ao carregar transações do banco:', error);
      setBankTransactions([]);
    }
  };

  // Navegação de mês (padrão mobile)
  const goToPreviousMonth = async () => {
    console.log('🔙 Navegando para mês anterior');
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    console.log(`📅 Novo mês: ${newMonth}/${newYear}`);
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    await loadBankTransactions(selectedBank.name, newMonth - 1, newYear); // -1 para API (0-11)
  };

  const goToNextMonth = async () => {
    console.log('🔜 Navegando para próximo mês');
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    
    console.log(`📅 Novo mês: ${newMonth}/${newYear}`);
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    await loadBankTransactions(selectedBank.name, newMonth - 1, newYear); // -1 para API (0-11)
  };

  const closeModal = () => {
    setShowBankModal(false);
    setSelectedBank(null);
    setBankTransactions([]);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTotalBalance = () => {
    return banks.reduce((total, bank) => total + (bank.balance || 0), 0);
  };

  // Função para obter a cor do banco baseada no nome
  const getBankColor = (bankName) => {
    const colors = {
      'banco do brasil': '#FFD700',
      'nubank': '#8A05BE',
      'itau': '#EC7000',
      'itaú': '#EC7000',
      'c6 bank': '#000000',
      'bradesco': '#C8102E',
      'santander': '#EC1C24',
      'caixa': '#0066CC',
      'inter': '#FF7A00',
      'next': '#00A859',
    };
    
    const normalizedName = bankName.toLowerCase();
    return colors[normalizedName] || '#6366F1'; // Cor padrão roxa
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando bancos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>🏦 Bancos</Text>
        
        {/* Card de Saldo Total */}
        <View style={styles.totalBalanceCard}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.totalBalanceGradient}
          >
            <Text style={styles.totalBalanceLabel}>Saldo Total</Text>
            <Text style={styles.totalBalanceAmount}>
              {formatCurrency(getTotalBalance())}
            </Text>
            <Text style={styles.totalBalanceSubtext}>
              {banks.length} {banks.length === 1 ? 'conta' : 'contas'} cadastrada{banks.length === 1 ? '' : 's'}
            </Text>
          </LinearGradient>
        </View>

        {/* Lista de Bancos */}
        <View style={styles.banksContainer}>
          {banks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhum banco cadastrado</Text>
            </View>
          ) : (
            banks.map((bank) => (
              <TouchableOpacity 
                key={bank._id} 
                style={styles.bankCard}
                onPress={() => openBankModal(bank)}
              >
                <View style={styles.bankHeader}>
                  <View style={[styles.bankIcon, { backgroundColor: getBankColor(bank.name) }]}>
                    <Ionicons name="business" size={24} color="#fff" />
                  </View>
                  <View style={styles.bankInfo}>
                    <Text style={styles.bankName}>{bank.name}</Text>
                    <Text style={styles.bankType}>{bank.type || 'Conta Corrente'}</Text>
                    <Text style={styles.bankAccount}>
                      {bank.agency && `Ag: ${bank.agency}`}
                      {bank.agency && bank.accountNumber && ' • '}
                      {bank.accountNumber && `CC: ${bank.accountNumber}`}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.bankMenuButton}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.bankBalance}>
                  <Text style={styles.bankBalanceLabel}>Saldo do mês</Text>
                  <Text style={[
                    styles.bankBalanceAmount,
                    { color: (bank.balance || 0) >= 0 ? '#10b981' : '#ef4444' }
                  ]}>
                    {formatCurrency(bank.balance || 0)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* Card para adicionar novo banco */}
          <TouchableOpacity 
            style={styles.addBankCard}
            onPress={() => setShowAddBankModal(true)}
          >
            <Ionicons name="add-circle-outline" size={32} color="#6366F1" />
            <Text style={styles.addBankText}>Adicionar Banco</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Modal de Extrato do Banco */}
      {showBankModal && selectedBank && (
        <Modal
          visible={showBankModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Extrato - {selectedBank?.name}
              </Text>
              <View style={styles.placeholder} />
            </View>

            {/* Seletor de meses moderno */}
            <SafeAreaView style={styles.modernMonthSelector}>
              <TouchableOpacity
                style={styles.modernNavBtn}
                onPress={goToPreviousMonth}
              >
                <Ionicons name="chevron-back" size={20} color="#667eea" />
              </TouchableOpacity>
              
              <View style={styles.modernMonthDisplay}>
                <Text style={styles.modernMonthText}>
                  {getMonthName(currentMonth)} {currentYear}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.modernNavBtn}
                onPress={goToNextMonth}
              >
                <Ionicons name="chevron-forward" size={20} color="#667eea" />
              </TouchableOpacity>
            </SafeAreaView>

            {/* Lista de Transações */}
            <ScrollView style={styles.transactionsList}>
              {bankTransactions.length === 0 ? (
                <View style={styles.emptyTransactions}>
                  <Text style={styles.emptyText}>Nenhuma transação neste mês</Text>
                </View>
              ) : (
                bankTransactions.map((transaction) => (
                  <View key={transaction._id} style={styles.transactionItem}>
                    <View style={styles.transactionContent}>
                      <View style={[
                        styles.transactionIconContainer,
                        { backgroundColor: transaction.type === 'income' ? '#10b98120' : '#ef444420' }
                      ]}>
                        <Text style={styles.categoryEmoji}>
                          {transaction.paymentMethod === 'pix' ? '📱' : 
                           transaction.paymentMethod === 'debito' ? '💸' : '🏦'}
                        </Text>
                      </View>

                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionDescription}>
                          {transaction.description}
                          {transaction.isInstallment && (
                            <Text style={styles.installmentText}>
                              {' '}({transaction.installmentNumber}/{transaction.totalInstallments})
                            </Text>
                          )}
                          {transaction.isFixed && (
                            <Text style={styles.fixedText}> FIXA</Text>
                          )}
                        </Text>
                        <Text style={styles.transactionCategory}>
                          {transaction.category}
                          {transaction.paymentMethod === 'debito' && transaction.bank && 
                            ` • 🏦 ${transaction.bank}`
                          }
                          {transaction.paymentMethod === 'pix' && 
                            ' • 📱 PIX'
                          }
                        </Text>
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </Text>
                        {transaction.notes && (
                          <Text style={styles.transactionNotes}>📝 {transaction.notes}</Text>
                        )}
                      </View>

                      <View style={styles.transactionValueContainer}>
                        <Text style={[
                          styles.transactionValue,
                          { color: transaction.type === 'income' ? '#10b981' : '#ef4444' }
                        ]}>
                          {transaction.type === 'income' ? '+' : '-'}R$ {(transaction.amount || 0).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
};

// 🧭 NAVEGAÇÃO
const TabNavigation = ({ activeTab, setActiveTab, onAddTransaction }) => {
  const { logout } = useAuth();
  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: 'analytics-outline' },
    { key: 'transactions', label: 'Transações', icon: 'receipt-outline' },
    { key: 'cards', label: 'Cartões', icon: 'card-outline' },
    { key: 'banks', label: 'Bancos', icon: 'business-outline' },
    { key: 'logout', label: 'Sair', icon: 'log-out-outline' },
  ];

  const handleTabPress = (tabKey) => {
    if (tabKey === 'logout') {
      Alert.alert(
        'Sair',
        'Tem certeza que deseja sair?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sair', onPress: logout, style: 'destructive' },
        ]
      );
    } else {
      setActiveTab(tabKey);
    }
  };

  return (
    <View style={styles.tabContainer}>
      {/* Todas as tabs normalmente */}
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={`tab-${tab.key}-${index}`}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => handleTabPress(tab.key)}
        >
          <Ionicons 
            name={activeTab === tab.key ? tab.icon.replace('-outline', '') : tab.icon} 
            size={20} 
            color={activeTab === tab.key ? theme.colors.primary : theme.colors.text.secondary} 
          />
          <Text style={[
            styles.tabLabel,
            activeTab === tab.key && styles.activeTabLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// 🏠 APP PRINCIPAL  
const MainApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshData, setRefreshData] = useState(0); // Para forçar recarregamento
  const { isAuthenticated, isLoading } = useAuth();

  const handleAddTransaction = () => {
    setShowAddModal(true);
  };

  const handleSaveTransaction = async (transactionData) => {
    try {
      console.log('Dados da transação sendo enviados:', transactionData);
      
      const response = await ApiService.createTransaction(transactionData);
      console.log('Resposta da API:', response);
      
      Alert.alert('Sucesso', 'Transação criada com sucesso!');
      setShowAddModal(false);
      
      // Força recarregamento dos dados em todas as páginas
      setRefreshData(prev => prev + 1);
      
    } catch (error) {
      console.error('Erro completo ao criar transação:', error);
      
      let errorMessage = 'Erro ao criar transação';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Erro', errorMessage);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage key={refreshData} />;
      case 'transactions':
        return <TransactionsPage key={refreshData} />;
      case 'cards':
        return <CardsPage key={refreshData} />;
      case 'banks':
        return <BanksScreen key={refreshData} />;
      default:
        return <DashboardPage key={refreshData} />;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.appContainer, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
      
      <TabNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onAddTransaction={handleAddTransaction}
      />
      
      {/* Botão flutuante de adicionar */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddTransaction}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
      
      {/* Modal de Adicionar Transação */}
      {showAddModal && (
        <AddTransactionModal
          onSave={handleSaveTransaction}
          onCancel={() => setShowAddModal(false)}
        />
      )}
    </SafeAreaView>
  );
};

// Modal de Adicionar Transação
const AddTransactionModal = ({ onSave, onCancel }) => {
  const today = new Date().toISOString().split('T')[0].split('-').reverse().join('-'); // DD-MM-AAAA
  
  // Estados para o formulário
  const [formData, setFormData] = useState({
    type: 'expense',
    date: today,
    paymentMethod: 'pix',
    bank: '',
    creditCard: '',
    description: '',
    amount: '',
    category: '',
    isRecurring: false,
    isInstallment: false,
    totalInstallments: 2
  });

  // Função para formatar currency
  const formatCurrency = (value) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue === '') return '';
    const number = parseFloat(numericValue) / 100;
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Handle amount change
  const handleAmountChange = (value) => {
    const formatted = formatCurrency(value);
    setFormData(prev => ({
      ...prev,
      amount: formatted
    }));
  };

  // Função para converter data de DD-MM-AAAA para AAAA-MM-DD
  function formatDateToISO(dateString) {
    if (!dateString) return new Date().toISOString().split('T')[0];
    
    try {
      const parts = dateString.split('-');
      if (parts.length !== 3) return new Date().toISOString().split('T')[0];
      
      const [day, month, year] = parts;
      
      // Validar se são números válidos
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return new Date().toISOString().split('T')[0];
      }
      
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return new Date().toISOString().split('T')[0];
    }
  }

  // Função para mostrar seletor de banco
  const showBankSelector = () => {
    const banks = [
      'Selecione o banco',
      'Banco do Brasil',
      'Bradesco',
      'Caixa Econômica',
      'Itaú',
      'Santander',
      'Nubank',
      'Inter',
      'C6 Bank',
      'XP Investimentos',
      'BTG Pactual',
      'Next',
      'Neon',
      'PagBank',
      'Picpay',
      '99Pay',
      'Mercado Pago',
      'Stone',
      'Outros'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...banks, 'Cancelar'],
          cancelButtonIndex: banks.length,
        },
        (buttonIndex) => {
          if (buttonIndex !== banks.length && buttonIndex !== 0) {
            setFormData(prev => ({ ...prev, bank: banks[buttonIndex] }));
          } else if (buttonIndex === 0) {
            setFormData(prev => ({ ...prev, bank: '' }));
          }
        }
      );
    } else {
      Alert.alert(
        'Selecionar Banco',
        'Escolha um banco:',
        banks.slice(1).map((bank, index) => ({
          text: bank,
          onPress: () => setFormData(prev => ({ ...prev, bank: bank }))
        })).concat([
          { text: 'Cancelar', style: 'cancel' }
        ])
      );
    }
  };

  // Função para mostrar seletor de cartão
  const showCreditCardSelector = () => {
    const cards = [
      'Selecione o cartão',
      'BB Visa',
      'BB Mastercard',
      'BB Elo',
      'Bradesco Visa',
      'Bradesco Mastercard',
      'Bradesco Elo',
      'Caixa Visa',
      'Caixa Mastercard',
      'Caixa Elo',
      'Itaú Visa',
      'Itaú Mastercard',
      'Itaú Elo',
      'Santander Visa',
      'Santander Mastercard',
      'Nubank Mastercard',
      'Inter Mastercard',
      'Inter Visa',
      'C6 Mastercard',
      'BTG Black',
      'BTG Mastercard',
      'Next Mastercard',
      'PagBank Visa',
      'PicPay Visa',
      'Mercado Pago Mastercard',
      'Outros'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...cards, 'Cancelar'],
          cancelButtonIndex: cards.length,
        },
        (buttonIndex) => {
          if (buttonIndex !== cards.length && buttonIndex !== 0) {
            setFormData(prev => ({ ...prev, creditCard: cards[buttonIndex] }));
          } else if (buttonIndex === 0) {
            setFormData(prev => ({ ...prev, creditCard: '' }));
          }
        }
      );
    } else {
      Alert.alert(
        'Selecionar Cartão',
        'Escolha um cartão:',
        cards.slice(1).map((card, index) => ({
          text: card,
          onPress: () => setFormData(prev => ({ ...prev, creditCard: card }))
        })).concat([
          { text: 'Cancelar', style: 'cancel' }
        ])
      );
    }
  };

  // Função para mostrar seletor de categoria
  const showCategorySelector = () => {
    const incomeCategories = ['Salário', 'Freelance', 'Investimentos', 'Outros'];
    const expenseCategories = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Outros'];
    const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...categories, 'Cancelar'],
          cancelButtonIndex: categories.length,
        },
        (buttonIndex) => {
          if (buttonIndex !== categories.length) {
            setFormData(prev => ({ ...prev, category: categories[buttonIndex] }));
          }
        }
      );
    } else {
      Alert.alert(
        'Selecionar Categoria',
        'Escolha uma categoria:',
        categories.map((category, index) => ({
          text: category,
          onPress: () => setFormData(prev => ({ ...prev, category: category }))
        })).concat([
          { text: 'Cancelar', style: 'cancel' }
        ])
      );
    }
  };

  const handleSubmit = () => {
    console.log('Dados do formulário antes da validação:', formData);
    
    // Validar campos obrigatórios
    if (!formData.description.trim()) {
      Alert.alert('Erro', 'A descrição é obrigatória');
      return;
    }
    
    if (!formData.amount.trim()) {
      Alert.alert('Erro', 'O valor é obrigatório');
      return;
    }

    // Validar banco para débito/PIX
    if ((formData.paymentMethod === 'debito' || formData.paymentMethod === 'pix') && !formData.bank) {
      Alert.alert('Erro', 'Selecione um banco para débito/PIX');
      return;
    }

    // Validar cartão para crédito
    if (formData.paymentMethod === 'credito' && !formData.creditCard) {
      Alert.alert('Erro', 'Selecione um cartão de crédito');
      return;
    }

    // Converter valor para número
    const numericAmount = parseFloat(formData.amount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    const transactionData = {
      ...formData,
      date: formatDateToISO(formData.date),
      amount: numericAmount
    };

    console.log('Dados da transação final:', transactionData);
    onSave(transactionData);
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>➕ Nova Transação</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Formulário */}
          <View style={styles.modalBody}>
            {/* 1. TIPO - Receita/Despesa */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo *</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    styles.incomeButton,
                    formData.type === 'income' && styles.activeButton
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                >
                  <Text style={[styles.buttonText, formData.type === 'income' && styles.activeButtonText]}>
                    💰 Receita
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    styles.expenseButton,
                    formData.type === 'expense' && styles.activeButton
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                >
                  <Text style={[styles.buttonText, formData.type === 'expense' && styles.activeButtonText]}>
                    💸 Despesa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. DATA */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Data *</Text>
              <TextInput
                style={styles.input}
                value={formData.date}
                onChangeText={(value) => setFormData(prev => ({ ...prev, date: value }))}
                placeholder="DD-MM-AAAA"
              />
            </View>

            {/* 3. TIPO DE PAGAMENTO */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo de Pagamento *</Text>
              <View style={styles.paymentButtons}>
                <TouchableOpacity
                  style={[
                    styles.paymentButton,
                    formData.paymentMethod === 'debito' && styles.activePaymentButton
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, paymentMethod: 'debito' }))}
                >
                  <Text style={[styles.buttonText, formData.paymentMethod === 'debito' && styles.activeButtonText]}>
                    💳 Débito
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentButton,
                    formData.paymentMethod === 'credito' && styles.activePaymentButton
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, paymentMethod: 'credito' }))}
                >
                  <Text style={[styles.buttonText, formData.paymentMethod === 'credito' && styles.activeButtonText]}>
                    🏦 Crédito
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentButton,
                    formData.paymentMethod === 'pix' && styles.activePaymentButton,
                    formData.isInstallment && styles.disabledButton
                  ]}
                  disabled={formData.isInstallment}
                  onPress={() => {
                    if (!formData.isInstallment) {
                      setFormData(prev => ({ 
                        ...prev, 
                        paymentMethod: 'pix',
                        isInstallment: false
                      }));
                    }
                  }}
                >
                  <Text style={[
                    styles.buttonText, 
                    formData.paymentMethod === 'pix' && styles.activeButtonText,
                    formData.isInstallment && styles.disabledButtonText
                  ]}>
                    📱 PIX
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Campo Banco (para débito e PIX) */}
            {(formData.paymentMethod === 'debito' || formData.paymentMethod === 'pix') && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Banco</Text>
                <TouchableOpacity
                  style={styles.selectorButton}
                  onPress={showBankSelector}
                >
                  <Text style={[styles.selectorText, !formData.bank && styles.placeholderText]}>
                    {formData.bank || 'Selecione o banco'}
                  </Text>
                  <Text style={styles.selectorArrow}>▼</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Campo Cartão (para crédito) */}
            {formData.paymentMethod === 'credito' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Cartão de Crédito</Text>
                <TouchableOpacity
                  style={styles.selectorButton}
                  onPress={showCreditCardSelector}
                >
                  <Text style={[styles.selectorText, !formData.creditCard && styles.placeholderText]}>
                    {formData.creditCard || 'Selecione o cartão'}
                  </Text>
                  <Text style={styles.selectorArrow}>▼</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Descrição e Valor - em linha */}
            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Descrição *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.description}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, description: value }))}
                  placeholder="Ex: Almoço, Salário, etc."
                />
              </View>

              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Valor *</Text>
                <View style={styles.currencyInput}>
                  <Text style={styles.currencySymbol}>R$</Text>
                  <TextInput
                    style={styles.currencyInputField}
                    value={formData.amount}
                    onChangeText={handleAmountChange}
                    placeholder="0,00"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* 6. CATEGORIA */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Categoria</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={showCategorySelector}
              >
                <Text style={[styles.selectorText, !formData.category && styles.placeholderText]}>
                  {formData.category || 'Selecione uma categoria'}
                </Text>
                <Text style={styles.selectorArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* 7. RECORRENTE */}
            <View style={styles.checkboxGroup}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => {
                  setFormData(prev => ({
                    ...prev,
                    isRecurring: !prev.isRecurring,
                    isInstallment: prev.isRecurring ? prev.isInstallment : false
                  }));
                }}
              >
                <View style={[
                  styles.checkbox,
                  formData.isRecurring && styles.checkboxActive
                ]}>
                  {formData.isRecurring && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>
                  Transação Fixa (repete todos os meses)
                </Text>
              </TouchableOpacity>
            </View>

            {/* 7. PARCELAMENTO */}
            <View style={styles.checkboxGroup}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => {
                  if (!formData.isRecurring) {
                    setFormData(prev => ({
                      ...prev,
                      isInstallment: !prev.isInstallment,
                      paymentMethod: (!prev.isInstallment && prev.paymentMethod === 'pix') ? 'debito' : prev.paymentMethod
                    }));
                  }
                }}
                disabled={formData.isRecurring}
              >
                <View style={[
                  styles.checkbox,
                  formData.isInstallment && styles.checkboxActive,
                  formData.isRecurring && styles.checkboxDisabled
                ]}>
                  {formData.isInstallment && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[
                  styles.checkboxText,
                  formData.isRecurring && styles.disabledText
                ]}>
                  Parcelado (crédito/débito apenas)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Campo de número de parcelas */}
            {formData.isInstallment && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Número de Parcelas:</Text>
                <TextInput
                  style={styles.input}
                  value={formData.totalInstallments.toString()}
                  onChangeText={(value) => {
                    const numValue = parseInt(value) || 2;
                    if (numValue >= 2 && numValue <= 60) {
                      setFormData(prev => ({ ...prev, totalInstallments: numValue }));
                    }
                  }}
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>De 2 a 60 parcelas</Text>
              </View>
            )}
          </View>

          {/* Footer com botões */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>❌ Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
              <Text style={styles.saveButtonText}>💾 Salvar Transação</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

// 🎨 ESTILOS
const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 75 : 65, // Ajustado para a barra mais baixa
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1', // Roxo
    textAlign: 'center',
    paddingVertical: 15,
    paddingTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.text.secondary,
    fontSize: 16,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : Platform.OS === 'android' ? 40 : 0,
    paddingBottom: theme.spacing.md,
    minHeight: Platform.OS === 'ios' ? 140 : 120,
  },
  header: {
    padding: theme.spacing.md,
    paddingBottom: 0,
    paddingTop: Platform.OS === 'ios' ? theme.spacing.sm : theme.spacing.md,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Platform.OS === 'ios' ? 24 : 22,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: Platform.OS === 'ios' ? 14 : 13,
    color: theme.colors.white + 'CC',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  
  // Dashboard Styles - Seletor de meses moderno
  modernMonthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modernNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modernMonthDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modernMonthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  // Estilos antigos mantidos para compatibilidade
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  monthNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  monthDisplay: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  monthSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  statsContainer: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 75,
  },
  balanceCard: {
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.primary,
  },
  creditCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#8B5CF6',
  },
  incomeCard: {
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.success,
  },
  expenseCard: {
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.danger,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  statEmoji: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },

  // Recent Transactions Styles
  recentTransactionsContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recentTransactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  // Estilos adicionais para transações do dashboard
  categoryEmoji: {
    fontSize: 16,
  },
  installmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fixedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  transactionNotes: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Estilos das transações (padrão web) - compacto
  transactionsContainer: {
    marginTop: 0,
  },
  transactionItemExtract: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: 'white',
    minHeight: 60,
  },
  extractDate: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: 70,
    alignItems: 'center',
    marginRight: 12,
  },
  extractDateText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  extractMain: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  extractDescription: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  descriptionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  transactionTitleStrong: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  installmentBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fixedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  categoryLine: {
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  notesLine: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#e2e8f0',
  },
  notesText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  extractAmount: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extractAmountIncome: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  extractAmountExpense: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  extractAmountText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  extractAmountTextIncome: {
    color: '#059669',
  },
  extractAmountTextExpense: {
    color: '#dc2626',
  },
  transactionItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  transactionContent: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  transactionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  transactionIcon: {
    fontSize: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    opacity: 0.7,
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  transactionValueContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  transactionNotes: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  installmentText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  fixedText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
  },
  // Estilos dos botões de ação
  transactionActions: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  actionBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  editBtn: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  actionBtnText: {
    fontSize: 12,
  },
  // Estilos dos modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  transactionPreview: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 5,
  },
  previewAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  previewInstallment: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  warningButton: {
    backgroundColor: '#f59e0b',
  },
  warningButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyTransactionsText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Transactions Page Styles  
  transactionsList: {
    flex: 1,
    marginTop: 0, // Removido já que o seletor moderno não precisa de espaço extra
  },
  transactionsContainer: {
    padding: theme.spacing.md,
  },
  categoryEmoji: {
    fontSize: 20,
  },

  // Cards Styles
  cardsList: {
    flex: 1,
  },
  cardsContainer: {
    padding: theme.spacing.md,
  },
  creditCardItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  creditCardName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  creditCardLimit: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  creditCardUsed: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },

  // Tab Navigation
  tabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8, // Reduzido para colar mais na parte de baixo
    paddingTop: theme.spacing.sm,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  activeTab: {
    // Adicionar estilo para aba ativa se necessário
  },
  tabLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  activeTabLabel: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  // Botão de adicionar
  addButton: {
    position: 'absolute',
    bottom: 70, // Um pouquinho mais para cima
    left: '50%',
    marginLeft: -25, // Ajustado para o novo tamanho
    width: 50, // Diminuído de 60 para 50
    height: 50, // Diminuído de 60 para 50
    borderRadius: 25, // Ajustado para o novo tamanho
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000, // Garante que o botão fique por cima de tudo
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  // Estilos da seção
  dashboardCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'left',
  },
  noTransactions: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noTransactionsIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  noTransactionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  noTransactionsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Estilos do Modal de Edição
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalScrollView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
    marginHorizontal: 5,
  },
  formRow: {
    flexDirection: 'row',
    marginHorizontal: -5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
    opacity: 0.5,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  incomeButton: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  expenseButton: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  activeButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeButtonText: {
    color: '#fff',
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  activePaymentButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    backgroundColor: 'transparent',
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  currencySymbol: {
    paddingLeft: 12,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  currencyInputField: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  checkboxGroup: {
    marginBottom: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  disabledText: {
    color: '#9ca3af',
  },
  installmentInfo: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    gap: 10,
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  // Estilos do Modal de Confirmação
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  alertHeader: {
    padding: 20,
    paddingBottom: 10,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  alertBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  alertText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  boldText: {
    fontWeight: 'bold',
  },
  alertFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  alertButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  alertButtonSecondaryText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  alertButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  alertButtonPrimaryText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  // Estilos para os novos seletores
  selectorButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  selectorArrow: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  
  // Estilos dos Bancos
  totalBalanceCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  totalBalanceGradient: {
    padding: 20,
    alignItems: 'center',
  },
  totalBalanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  totalBalanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  totalBalanceSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  banksContainer: {
    padding: 16,
    paddingTop: 8,
  },
  bankCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  bankType: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  bankAccount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bankMenuButton: {
    padding: 4,
  },
  bankBalance: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  bankBalanceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  bankBalanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addBankCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addBankText: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
    marginTop: 8,
  },
  
  // Estilos dos Cartões
  totalLimitCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  totalLimitGradient: {
    padding: 20,
    alignItems: 'center',
  },
  totalLimitLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  totalLimitAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  limitDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 8,
  },
  limitDetailItem: {
    alignItems: 'center',
  },
  limitDetailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  limitDetailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalLimitSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cardsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  creditCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  creditCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creditCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creditCardInfo: {
    flex: 1,
  },
  creditCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  creditCardBank: {
    fontSize: 14,
    color: '#6b7280',
  },
  creditCardMenuButton: {
    padding: 4,
  },
  creditCardLimits: {
    marginBottom: 16,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  limitValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  usageBar: {
    marginTop: 8,
  },
  usageBarBackground: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  usagePercentage: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  addCardCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addCardText: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
    marginTop: 8,
  },
});

export default App;
