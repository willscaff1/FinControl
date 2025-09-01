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
  FlatList,
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadData = async () => {
    try {
      const [transactionsRes, statsRes] = await Promise.all([
        api.get(`/transactions?month=${selectedMonth}&year=${selectedYear}`),
        api.get(`/transactions/stats?month=${selectedMonth}&year=${selectedYear}`)
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
  }, [selectedMonth, selectedYear]);

  const changeMonth = (direction) => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;
    
    if (direction === 'next') {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    } else {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading || !data || !data.stats || !data.transactions) {
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

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.monthButton}>
          <Ionicons name="chevron-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {getMonthName(selectedMonth)} {selectedYear}
        </Text>
        <TouchableOpacity onPress={() => changeMonth('next')} style={styles.monthButton}>
          <Ionicons name="chevron-forward" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {/* Primeira linha: Saldo Atual e Transações */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.balanceCard]}>
              <Text style={styles.statLabel}>💰 SALDO ATUAL</Text>
              <Text style={[
                styles.statValue,
                (data.stats?.balance ?? 0) >= 0 ? styles.positive : styles.negative
              ]}>
                R$ {(data.stats?.balance ?? 0).toFixed(2)}
              </Text>
            </View>

            <View style={[styles.statCard, styles.countCard]}>
              <Text style={styles.statLabel}>💳 CARTÃO CRÉDITO</Text>
              <Text style={[styles.statValue, styles.primary]}>
                R$ {(data.creditCardTotal ?? 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Segunda linha: Receitas e Despesas */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.incomeCard]}>
              <Text style={styles.statLabel}>� RECEITAS</Text>
              <Text style={[styles.statValue, styles.positive]}>
                R$ {(data.stats?.income ?? 0).toFixed(2)}
              </Text>
            </View>

            <View style={[styles.statCard, styles.expenseCard]}>
              <Text style={styles.statLabel}>� DESPESAS</Text>
              <Text style={[styles.statValue, styles.negative]}>
                R$ {(data.stats?.expense ?? 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>📋 Últimas Transações</Text>
          {!data.transactions || !Array.isArray(data.transactions) || data.transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhuma transação encontrada</Text>
              <Text style={styles.emptyStateSubtext}>Adicione sua primeira transação</Text>
            </View>
          ) : (
            (data.transactions || []).slice(0, 5).map((transaction) => (
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

// � EDIT TRANSACTION MODAL
function EditTransactionModal({ visible, transaction, onClose, onSave }) {
  // Estado para modal de categoria
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Categorias organizadas por tipo
  const categories = {
    income: ['Salário', 'Freelance', 'Investimentos', 'Outros'],
    expense: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Outros']
  };
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    paymentMethod: 'pix',
    isInstallment: false,
    installmentNumber: 1,
    totalInstallments: 2
  });
  
  const [showUpdateAllModal, setShowUpdateAllModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  // Função para converter YYYY-MM-DD para DD-MM-YYYY
  const formatDateForDisplay = (isoDate) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
  };

  // Função para converter DD-MM-YYYY para YYYY-MM-DD
  const formatDateForAPI = (displayDate) => {
    if (!displayDate) return '';
    const [day, month, year] = displayDate.split('-');
    return `${year}-${month}-${day}`;
  };

  // Função para formatar valor inicial
  const formatInitialAmount = (amount) => {
    if (!amount) return '';
    
    // amount já é um número decimal (ex: 123.45)
    // Converte para string com 2 casas decimais e substitui ponto por vírgula
    const formatted = amount.toFixed(2).replace('.', ',');
    
    // Adiciona separador de milhares se necessário
    const [reais, centavos] = formatted.split(',');
    const reaisFormatted = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${reaisFormatted},${centavos}`;
  };

  useEffect(() => {
    if (transaction) {
      console.log('🎯 Inicializando EditModal com transaction:', transaction);
      const transactionDate = transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      setFormData({
        description: transaction.description || '',
        amount: formatInitialAmount(transaction.amount),
        type: transaction.type || 'expense',
        category: transaction.category || '',
        date: formatDateForDisplay(transactionDate),
        isRecurring: transaction.isRecurring || !!transaction.recurringParentId,
        paymentMethod: transaction.paymentMethod || 'pix',
        isInstallment: transaction.isInstallment || !!transaction.installmentParentId,
        installmentNumber: transaction.installmentNumber || 1,
        totalInstallments: transaction.totalInstallments || 2
      });
    }
  }, [transaction]);

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

  const handleAmountChange = (value) => {
    const formatted = formatCurrency(value);
    setFormData(prev => ({
      ...prev,
      amount: formatted
    }));
  };

  const handleSave = () => {
    console.log('💾 handleSave chamado');
    console.log('📋 formData:', formData);
    
    if (!formData.description.trim() || !formData.amount.trim()) {
      Alert.alert('Erro', 'Descrição e valor são obrigatórios');
      return;
    }

    // Validação básica de data DD-MM-YYYY
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (!dateRegex.test(formData.date)) {
      Alert.alert('Erro', 'Data deve estar no formato DD-MM-AAAA');
      return;
    }

    // Converte o valor formatado de volta para número
    const numericAmount = parseFloat(formData.amount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Erro', 'Valor deve ser um número positivo');
      return;
    }

    const transactionData = {
      description: formData.description,
      amount: numericAmount,
      type: formData.type,
      category: formData.category,
      date: formatDateForAPI(formData.date),
      paymentMethod: formData.paymentMethod
      // NÃO incluir isRecurring aqui pois pode causar problemas
    };
    
    console.log('📤 transactionData a ser enviado:', transactionData);
    console.log('🔄 Verificando se é transação recorrente:');
    console.log('   transaction.recurringParentId:', transaction.recurringParentId);
    console.log('   transaction.isRecurring:', transaction.isRecurring);
    console.log('   numericAmount:', numericAmount, 'vs transaction.amount:', transaction.amount);
    console.log('   description changed:', formData.description !== transaction.description);
    console.log('   category changed:', formData.category !== transaction.category);
    console.log('   type changed:', formData.type !== transaction.type);
    console.log('   paymentMethod changed:', formData.paymentMethod !== transaction.paymentMethod);

    // Se for transação recorrente e algo mudou, perguntar se é para todos os meses
    if ((transaction.recurringParentId || transaction.isRecurring) && 
        (numericAmount !== transaction.amount || 
         formData.description !== transaction.description ||
         formData.category !== transaction.category ||
         formData.type !== transaction.type ||
         formData.paymentMethod !== transaction.paymentMethod)) {
      console.log('🔄 É transação recorrente e algo mudou - mostrando modal');
      setPendingFormData(transactionData);
      setShowUpdateAllModal(true);
    } else {
      console.log('📞 Chamando onSave diretamente');
      onSave(transactionData);
    }
  };

  const handleUpdateChoice = (updateAll) => {
    console.log('🎯 handleUpdateChoice chamado:', updateAll);
    console.log('📋 pendingFormData:', pendingFormData);
    
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
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar Transação</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* 1. TIPO - Primeiro com botões e emojis */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, formData.type === 'income' && styles.typeButtonActiveIncome]}
                onPress={() => setFormData({...formData, type: 'income'})}
              >
                <Text style={styles.typeButtonEmoji}>💰</Text>
                <Text style={[styles.typeButtonText, formData.type === 'income' && styles.typeButtonTextActive]}>
                  Receita
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, formData.type === 'expense' && styles.typeButtonActiveExpense]}
                onPress={() => setFormData({...formData, type: 'expense'})}
              >
                <Text style={styles.typeButtonEmoji}>💸</Text>
                <Text style={[styles.typeButtonText, formData.type === 'expense' && styles.typeButtonTextActive]}>
                  Despesa
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. DATA - Segundo */}
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>Data da Transação:</Text>
              <TextInput
                style={styles.dateInput}
                value={formData.date}
                onChangeText={(text) => setFormData({...formData, date: text})}
                placeholder="DD-MM-AAAA"
              />
            </View>

            {/* 3. MÉTODO DE PAGAMENTO - Terceiro */}
            <View style={styles.paymentSelector}>
              <Text style={styles.sectionLabel}>Método de Pagamento:</Text>
              <View style={styles.paymentButtons}>
                <TouchableOpacity
                  style={[styles.paymentButton, formData.paymentMethod === 'debito' && styles.paymentButtonActive]}
                  onPress={() => setFormData({...formData, paymentMethod: 'debito'})}
                >
                  <Text style={styles.paymentButtonEmoji}>💳</Text>
                  <Text style={[styles.paymentButtonText, formData.paymentMethod === 'debito' && styles.paymentButtonTextActive]}>
                    Débito
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.paymentButton, formData.paymentMethod === 'credito' && styles.paymentButtonActive]}
                  onPress={() => setFormData({...formData, paymentMethod: 'credito'})}
                >
                  <Text style={styles.paymentButtonEmoji}>🏦</Text>
                  <Text style={[styles.paymentButtonText, formData.paymentMethod === 'credito' && styles.paymentButtonTextActive]}>
                    Crédito
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentButton, 
                    formData.paymentMethod === 'pix' && styles.paymentButtonActive,
                    formData.isInstallment && { opacity: 0.5 }
                  ]}
                  onPress={() => {
                    if (!formData.isInstallment) {
                      setFormData({
                        ...formData, 
                        paymentMethod: 'pix',
                        // Se selecionar PIX, desativar parcelamento
                        isInstallment: false
                      });
                    }
                  }}
                  disabled={formData.isInstallment}
                >
                  <Text style={styles.paymentButtonEmoji}>📱</Text>
                  <Text style={[
                    styles.paymentButtonText, 
                    formData.paymentMethod === 'pix' && styles.paymentButtonTextActive,
                    formData.isInstallment && { opacity: 0.5 }
                  ]}>
                    PIX
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. DESCRIÇÃO - Quarto */}
            <TextInput
              style={styles.modalInput}
              placeholder="Descrição"
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
            />

            {/* 5. VALOR - Quinto */}
            <View style={styles.currencyInputContainer}>
              <Text style={styles.currencySymbol}>R$</Text>
              <TextInput
                style={styles.currencyInput}
                placeholder="0,00"
                value={formData.amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
              />
            </View>

            {/* 6. CATEGORIA - Sexto */}
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={[
                styles.inputText, 
                !formData.category && styles.placeholderText
              ]}>
                {formData.category || 'Selecione uma categoria'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#9ca3af" />
            </TouchableOpacity>

            {/* 7. RECORRENTE - Último */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[
                  styles.checkbox, 
                  formData.isRecurring ? styles.checkboxChecked : null,
                  (!!transaction?.recurringParentId || !!transaction?.isRecurring) ? { opacity: 0.5 } : null
                ]}
                onPress={() => {
                  if (!(!!transaction?.recurringParentId || !!transaction?.isRecurring)) {
                    setFormData(prev => ({ 
                      ...prev, 
                      isRecurring: !prev.isRecurring,
                      // Se ativar recorrente, desativar parcelamento
                      isInstallment: prev.isRecurring ? prev.isInstallment : false
                    }));
                  }
                }}
                disabled={!!(transaction?.recurringParentId || transaction?.isRecurring)}
              >
                {formData.isRecurring && <Ionicons name="checkmark" size={16} color="white" />}
              </TouchableOpacity>
              <Text style={[
                styles.checkboxLabel,
                (!!transaction?.recurringParentId || !!transaction?.isRecurring) ? { opacity: 0.5 } : null
              ]}>
                Transação Fixa (repete todos os meses)
              </Text>
            </View>

            {/* 8. PARCELAMENTO */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[
                  styles.checkbox, 
                  formData.isInstallment ? styles.checkboxChecked : null,
                  // Opaco se estiver em modo de edição de parcela ou se for recorrente
                  (formData.isRecurring || (!!transaction?.installmentParentId || !!transaction?.isInstallment)) ? { opacity: 0.5 } : null
                ]}
                onPress={() => {
                  // Só permite se não for recorrente e não for edição de parcela
                  if (!formData.isRecurring && !(!!transaction?.installmentParentId || !!transaction?.isInstallment)) {
                    setFormData(prev => ({ 
                      ...prev, 
                      isInstallment: !prev.isInstallment,
                      // Se ativar parcelamento e estiver no PIX, mudar para débito
                      paymentMethod: (!prev.isInstallment && prev.paymentMethod === 'pix') ? 'debito' : prev.paymentMethod
                    }));
                  }
                }}
                disabled={formData.isRecurring || (!!transaction?.installmentParentId || !!transaction?.isInstallment)}
              >
                {formData.isInstallment && <Ionicons name="checkmark" size={16} color="white" />}
              </TouchableOpacity>
              <Text style={[
                styles.checkboxLabel,
                (formData.isRecurring || (!!transaction?.installmentParentId || !!transaction?.isInstallment)) ? { opacity: 0.5 } : null
              ]}>
                Parcelado (crédito/débito apenas)
              </Text>
            </View>

            {/* Campo de número de parcelas */}
            {formData.isInstallment && (
              <View style={styles.inputContainer}>
                <Text style={[
                  styles.inputLabel,
                  (!!transaction?.installmentParentId || !!transaction?.isInstallment) ? { opacity: 0.5 } : null
                ]}>
                  Número de Parcelas
                </Text>
                <View style={[
                  styles.currencyContainer,
                  (!!transaction?.installmentParentId || !!transaction?.isInstallment) ? { opacity: 0.5 } : null
                ]}>
                  <Text style={styles.currencySymbol}>Parcelas:</Text>
                  <TextInput
                    style={styles.currencyInput}
                    value={formData.totalInstallments.toString()}
                    onChangeText={(value) => {
                      // Só permite editar se não for transação parcelada existente
                      if (!(!!transaction?.installmentParentId || !!transaction?.isInstallment)) {
                        const num = parseInt(value) || 2;
                        if (num >= 2 && num <= 60) {
                          setFormData(prev => ({ ...prev, totalInstallments: num }));
                        }
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="2"
                    placeholderTextColor="#9ca3af"
                    editable={!(!!transaction?.installmentParentId || !!transaction?.isInstallment)}
                  />
                </View>
                <Text style={[
                  styles.helperText,
                  (!!transaction?.installmentParentId || !!transaction?.isInstallment) ? { opacity: 0.5 } : null
                ]}>
                  {(!!transaction?.installmentParentId || !!transaction?.isInstallment) 
                    ? `Parcela ${transaction?.installmentNumber}/${transaction?.totalInstallments} (não editável)`
                    : 'De 2 a 60 parcelas'
                  }
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal de Seleção de Categoria */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.categoryModalOverlay}>
          <View style={styles.categoryModal}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>Selecionar Categoria</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.categoryList}>
              {categories[formData.type].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryItem,
                    formData.category === category && styles.categoryItemActive
                  ]}
                  onPress={() => {
                    setFormData({...formData, category});
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[
                    styles.categoryItemText,
                    formData.category === category && styles.categoryItemTextActive
                  ]}>
                    {category}
                  </Text>
                  {formData.category === category && (
                    <Ionicons name="checkmark" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação para Edição de Transação Recorrente */}
      <Modal
        visible={showUpdateAllModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUpdateAllModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Atualizar Transação Fixa</Text>
            <Text style={styles.confirmMessage}>
              Esta é uma transação fixa. Deseja aplicar as alterações:
            </Text>
            
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setShowUpdateAllModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteConfirmButton]}
                onPress={() => handleUpdateChoice(false)}
              >
                <Text style={styles.deleteButtonText}>Apenas Este Mês</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteConfirmButton]}
                onPress={() => handleUpdateChoice(true)}
              >
                <Text style={styles.deleteButtonText}>Todos os Meses</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// �💳 TRANSAÇÕES SCREEN
function CreditCardScreen() {
  const [transactions, setTransactions] = useState([]);
  const [creditTransactions, setCreditTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [totalCreditAmount, setTotalCreditAmount] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, [selectedMonth, selectedYear, searchText]);

  const changeMonth = (direction) => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;
    
    if (direction === 'next') {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    } else {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const loadTransactions = async () => {
    try {
      const response = await api.get(`/transactions?month=${selectedMonth}&year=${selectedYear}`);
      const transactionsData = response.data || [];
      
      // Garantir que é um array antes de ordenar
      const validTransactions = Array.isArray(transactionsData) ? transactionsData : [];
      
      // Ordenar por data (mais recente primeiro)
      const sortedTransactions = validTransactions.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      setTransactions(sortedTransactions);
      
      // Aplicar filtro de cartão de crédito imediatamente
      const creditOnly = sortedTransactions.filter(t => 
        t && t.type === 'expense' && t.paymentMethod === 'credito'
      );
      
      // Aplicar busca se existir
      let filtered = creditOnly;
      if (searchText.trim()) {
        const search = searchText.toLowerCase();
        filtered = creditOnly.filter(t => 
          t && 
          ((t.description || '').toLowerCase().includes(search) ||
          (t.category || '').toLowerCase().includes(search))
        );
      }
      
      setCreditTransactions(filtered);
      
      // Calcular total gasto no crédito
      const total = creditOnly.reduce((sum, t) => sum + (t.amount || 0), 0);
      setTotalCreditAmount(total);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setTransactions([]);
      Alert.alert('Erro', 'Não foi possível carregar as transações');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterCreditTransactions = () => {
    // Recarregar e aplicar filtro
    loadTransactions();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const handleDeleteTransaction = async (deleteAll = false) => {
    try {
      if (deleteAll && (transactionToDelete.recurringParentId || transactionToDelete.isRecurring)) {
        // Deletar todas as transações da série recorrente
        await api.delete(`/transactions/${transactionToDelete._id}/recurring`);
        Alert.alert('Sucesso', 'Todas as transações da série foram deletadas!');
      } else if (deleteAll && (transactionToDelete.installmentParentId || transactionToDelete.isInstallment)) {
        // Deletar todas as parcelas da série parcelada
        await api.delete(`/transactions/${transactionToDelete._id}/installments`);
        Alert.alert('Sucesso', 'Todas as parcelas foram deletadas!');
      } else {
        // Deletar apenas esta transação
        await api.delete(`/transactions/${transactionToDelete._id}`);
        Alert.alert('Sucesso', 'Transação deletada com sucesso!');
      }
      
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
      
      // Recarregar transações para garantir sincronização
      loadTransactions();
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      Alert.alert('Erro', 'Não foi possível deletar a transação');
    }
  };

  const handleEditTransaction = async (transactionData) => {
    try {
      console.log('📝 Editando transação:', editingTransaction._id);
      console.log('📄 Dados para enviar:', transactionData);
      console.log('🔄 updateAll flag:', transactionData.updateAll);
      
      const response = await api.put(`/transactions/${editingTransaction._id}`, transactionData);
      
      console.log('✅ Resposta do servidor:', response.data);
      
      // Atualizar lista local
      const updatedTransactions = transactions.map(t => 
        t._id === editingTransaction._id ? response.data : t
      );
      setTransactions(updatedTransactions);
      
      Alert.alert('Sucesso', 'Transação atualizada com sucesso!');
      setShowEditModal(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('❌ Erro ao atualizar transação:', error);
      console.error('❌ Detalhes do erro:', error.response?.data || error.message);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Headers:', error.response?.headers);
      console.error('❌ Request data:', error.config?.data);
      Alert.alert('Erro', `Não foi possível atualizar a transação: ${error.response?.data?.error || error.message}`);
    }
  };

  const confirmDelete = (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteConfirm(true);
  };

  const startEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const getTransactionIcon = (category) => {
    const icons = {
      'alimentacao': '🍕',
      'transporte': '🚗',
      'saude': '🏥',
      'educacao': '📚',
      'lazer': '🎮',
      'casa': '🏠',
      'trabalho': '💼',
      'salario': '💰',
      'freelance': '💻',
      'investimento': '📈',
      'venda': '💵'
    };
    return icons[category?.toLowerCase()] || (filterType === 'income' ? '💰' : '💳');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount || 0);
  };

  const getFilterButtonStyle = (type) => {
    return [
      styles.filterButton,
      filterType === type ? styles.filterButtonActive : null
    ];
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💳 Cartão de Crédito</Text>
          <Text style={styles.headerSubtitle}>
            {creditTransactions.length} {creditTransactions.length === 1 ? 'transação' : 'transações'}
          </Text>
          <Text style={styles.creditTotal}>
            Total: R$ {totalCreditAmount.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.filterToggleBtn}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name={showFilters ? "search" : "search-outline"} 
            size={20} 
            color="#2563eb" 
          />
        </TouchableOpacity>
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.monthButton}>
          <Ionicons name="chevron-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {getMonthName(selectedMonth)} {selectedYear}
        </Text>
        <TouchableOpacity onPress={() => changeMonth('next')} style={styles.monthButton}>
          <Ionicons name="chevron-forward" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      {showFilters && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar gastos no cartão..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#9ca3af"
            />
            {searchText ? (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      {/* Credit Card Transactions List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!creditTransactions || !Array.isArray(creditTransactions) || creditTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>�</Text>
            <Text style={styles.emptyStateText}>
              {searchText ? 'Nenhum gasto encontrado' : 'Nenhum gasto no cartão'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchText ? 'Tente alterar a busca' : 'Seus gastos no cartão aparecerão aqui'}
            </Text>
          </View>
        ) : (
          (creditTransactions || []).map((transaction, index) => (
            <View key={transaction._id || index} style={styles.transactionItem}>
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
                    {transaction.description || 'Transação'}
                  </Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.category || 'Categoria'} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                  </Text>
                  <Text style={styles.transactionTime}>
                    {new Date(transaction.date).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === 'income' ? styles.positive : styles.negative
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}R$ {(transaction.amount || 0).toFixed(2)}
                </Text>
                <View style={styles.transactionActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => startEdit(transaction)}
                  >
                    <Ionicons name="create-outline" size={16} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => confirmDelete(transaction)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        
        {/* Bottom spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Deletar Transação</Text>
            <Text style={styles.confirmMessage}>
              Tem certeza que deseja deletar a transação "{transactionToDelete?.description}"?
            </Text>
            <Text style={styles.confirmAmount}>
              {transactionToDelete?.type === 'income' ? '+' : '-'}{formatCurrency(transactionToDelete?.amount || 0)}
            </Text>
            
            {(transactionToDelete?.recurringParentId || transactionToDelete?.isRecurring) && (
              <Text style={styles.recurringInfo}>
                Esta é uma transação fixa. Escolha uma das opções:
              </Text>
            )}
            
            {(transactionToDelete?.installmentParentId || transactionToDelete?.isInstallment) && (
              <Text style={styles.recurringInfo}>
                Esta é uma transação parcelada ({transactionToDelete?.installmentNumber}/{transactionToDelete?.totalInstallments}). Escolha uma das opções:
              </Text>
            )}
            
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              {(transactionToDelete?.recurringParentId || transactionToDelete?.isRecurring) ? (
                <>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.deleteConfirmButton]}
                    onPress={() => handleDeleteTransaction(false)}
                  >
                    <Text style={styles.deleteButtonText}>Apenas Este Mês</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.deleteConfirmButton]}
                    onPress={() => handleDeleteTransaction(true)}
                  >
                    <Text style={styles.deleteButtonText}>Todos os Meses</Text>
                  </TouchableOpacity>
                </>
              ) : (transactionToDelete?.installmentParentId || transactionToDelete?.isInstallment) ? (
                <>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.deleteConfirmButton]}
                    onPress={() => handleDeleteTransaction(false)}
                  >
                    <Text style={styles.deleteButtonText}>Apenas Esta Parcela</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.deleteConfirmButton]}
                    onPress={() => handleDeleteTransaction(true)}
                  >
                    <Text style={styles.deleteButtonText}>Todas as Parcelas</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.confirmButton, styles.deleteConfirmButton]}
                  onPress={() => handleDeleteTransaction(false)}
                >
                  <Text style={styles.deleteButtonText}>Deletar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        visible={showEditModal}
        transaction={editingTransaction}
        onClose={() => {
          setShowEditModal(false);
          setEditingTransaction(null);
        }}
        onSave={handleEditTransaction}
      />
    </SafeAreaView>
  );
}

// � TODAS AS TRANSAÇÕES SCREEN
function AllTransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [selectedMonth, selectedYear, searchText]);

  const changeMonth = (direction) => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;
    
    if (direction === 'next') {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    } else {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const loadTransactions = async () => {
    try {
      const response = await api.get(`/transactions?month=${selectedMonth}&year=${selectedYear}`);
      const transactionsData = response.data || [];
      
      // Garantir que é um array antes de ordenar
      const validTransactions = Array.isArray(transactionsData) ? transactionsData : [];
      
      // Ordenar por data (mais recente primeiro)
      const sortedTransactions = validTransactions.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      // Aplicar busca se existir
      let filtered = sortedTransactions;
      if (searchText.trim()) {
        const search = searchText.toLowerCase();
        filtered = sortedTransactions.filter(t => 
          t && 
          ((t.description || '').toLowerCase().includes(search) ||
          (t.category || '').toLowerCase().includes(search))
        );
      }
      
      setTransactions(filtered);
      
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setTransactions([]);
      Alert.alert('Erro', 'Não foi possível carregar as transações');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const handleDeleteTransaction = async (deleteAll = false) => {
    try {
      if (deleteAll && (transactionToDelete.recurringParentId || transactionToDelete.isRecurring)) {
        // Deletar todas as transações da série recorrente
        await api.delete(`/transactions/${transactionToDelete._id}/recurring`);
        Alert.alert('Sucesso', 'Todas as transações da série foram deletadas!');
      } else if (deleteAll && (transactionToDelete.installmentParentId || transactionToDelete.isInstallment)) {
        // Deletar todas as parcelas da série parcelada
        await api.delete(`/transactions/${transactionToDelete._id}/installments`);
        Alert.alert('Sucesso', 'Todas as parcelas foram deletadas!');
      } else {
        // Deletar apenas esta transação
        await api.delete(`/transactions/${transactionToDelete._id}`);
        Alert.alert('Sucesso', 'Transação deletada com sucesso!');
      }
      
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
      
      // Recarregar transações para garantir sincronização
      loadTransactions();
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      Alert.alert('Erro', 'Não foi possível deletar a transação');
    }
  };

  const handleEditTransaction = async (transactionData) => {
    try {
      console.log('📝 Editando transação:', editingTransaction._id);
      console.log('📄 Dados para enviar:', transactionData);
      console.log('🔄 updateAll flag:', transactionData.updateAll);
      
      const response = await api.put(`/transactions/${editingTransaction._id}`, transactionData);
      
      console.log('✅ Resposta do servidor:', response.data);
      
      // Atualizar lista local
      const updatedTransactions = transactions.map(t => 
        t._id === editingTransaction._id ? response.data : t
      );
      setTransactions(updatedTransactions);
      
      Alert.alert('Sucesso', 'Transação atualizada com sucesso!');
      setShowEditModal(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('❌ Erro ao atualizar transação:', error);
      console.error('❌ Detalhes do erro:', error.response?.data || error.message);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Headers:', error.response?.headers);
      console.error('❌ Request data:', error.config?.data);
      Alert.alert('Erro', `Não foi possível atualizar a transação: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleAddTransaction = async (transactionData) => {
    try {
      await api.post('/transactions', transactionData);
      setShowAddModal(false);
      Alert.alert('Sucesso', 'Transação adicionada com sucesso!');
      loadTransactions();
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      Alert.alert('Erro', 'Erro ao adicionar transação');
    }
  };

  const confirmDelete = (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteConfirm(true);
  };

  const startEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const getTransactionIcon = (transaction) => {
    if (transaction.type === 'income') return '💰';
    if (transaction.paymentMethod === 'pix') return '📱';
    if (transaction.paymentMethod === 'credito') return '💳';
    if (transaction.paymentMethod === 'debito') return '🏦';
    return '💰';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount || 0);
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💰 Todas as Transações</Text>
          <Text style={styles.headerSubtitle}>
            {transactions.length} {transactions.length === 1 ? 'transação' : 'transações'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.filterToggleBtn}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name={showFilters ? "search" : "search-outline"} 
            size={20} 
            color="#2563eb" 
          />
        </TouchableOpacity>
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.monthButton}>
          <Ionicons name="chevron-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {getMonthName(selectedMonth)} {selectedYear}
        </Text>
        <TouchableOpacity onPress={() => changeMonth('next')} style={styles.monthButton}>
          <Ionicons name="chevron-forward" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      {showFilters && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar transações..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#9ca3af"
            />
            {searchText ? (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      {/* All Transactions List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!transactions || !Array.isArray(transactions) || transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💰</Text>
            <Text style={styles.emptyStateText}>
              {searchText ? 'Nenhuma transação encontrada' : 'Nenhuma transação'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchText ? 'Tente alterar a busca' : 'Suas transações aparecerão aqui'}
            </Text>
          </View>
        ) : (
          (transactions || []).map((transaction, index) => (
            <View key={transaction._id || index} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <View style={[
                  styles.transactionIcon,
                  transaction.type === 'income' ? styles.incomeIcon : styles.expenseIcon
                ]}>
                  <Text style={styles.transactionIconText}>
                    {getTransactionIcon(transaction)}
                  </Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description || 'Transação'}
                  </Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.category || 'Categoria'} • {
                      transaction.paymentMethod === 'pix' ? 'PIX' :
                      transaction.paymentMethod === 'credito' ? 'Crédito' :
                      transaction.paymentMethod === 'debito' ? 'Débito' : 'N/A'
                    } • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                  </Text>
                  <Text style={styles.transactionTime}>
                    {new Date(transaction.date).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === 'income' ? styles.positive : styles.negative
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}R$ {(transaction.amount || 0).toFixed(2)}
                </Text>
                <View style={styles.transactionActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => startEdit(transaction)}
                  >
                    <Ionicons name="create-outline" size={16} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => confirmDelete(transaction)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && transactionToDelete && (
        <Modal
          visible={showDeleteConfirm}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModal}>
              <Text style={styles.confirmTitle}>Confirmar Exclusão</Text>
              <Text style={styles.confirmText}>
                Deseja excluir "{transactionToDelete.description}"?
              </Text>
              
              {(transactionToDelete.isRecurring || transactionToDelete.recurringParentId) && (
                <View style={styles.recurringOptions}>
                  <TouchableOpacity
                    style={styles.deleteOptionButton}
                    onPress={() => handleDeleteTransaction(false)}
                  >
                    <Text style={styles.deleteOptionText}>Excluir apenas esta</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteOptionButton, styles.deleteAllButton]}
                    onPress={() => handleDeleteTransaction(true)}
                  >
                    <Text style={[styles.deleteOptionText, styles.deleteAllText]}>Excluir todas da série</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {(transactionToDelete.isInstallment || transactionToDelete.installmentParentId) && (
                <View style={styles.recurringOptions}>
                  <TouchableOpacity
                    style={styles.deleteOptionButton}
                    onPress={() => handleDeleteTransaction(false)}
                  >
                    <Text style={styles.deleteOptionText}>Excluir apenas esta parcela</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteOptionButton, styles.deleteAllButton]}
                    onPress={() => handleDeleteTransaction(true)}
                  >
                    <Text style={[styles.deleteOptionText, styles.deleteAllText]}>Excluir todas as parcelas</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {!transactionToDelete.isRecurring && 
               !transactionToDelete.recurringParentId && 
               !transactionToDelete.isInstallment && 
               !transactionToDelete.installmentParentId && (
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowDeleteConfirm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => handleDeleteTransaction(false)}
                  >
                    <Text style={styles.confirmButtonText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {((transactionToDelete.isRecurring || transactionToDelete.recurringParentId) ||
                (transactionToDelete.isInstallment || transactionToDelete.installmentParentId)) && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Add Modal */}
      <TransactionModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddTransaction}
      />

      {/* Edit Modal */}
      {editingTransaction && showEditModal && (
        <EditTransactionModal
          visible={showEditModal}
          transaction={editingTransaction}
          onClose={() => {
            setShowEditModal(false);
            setEditingTransaction(null);
          }}
          onSuccess={() => {
            loadTransactions();
            setShowEditModal(false);
            setEditingTransaction(null);
          }}
          onEdit={handleEditTransaction}
        />
      )}
    </SafeAreaView>
  );
}



// 🏦 BANCOS SCREEN
function BanksScreen() {
  const [transactions, setTransactions] = useState([]);
  const [bankTransactions, setBankTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [totalBankAmount, setTotalBankAmount] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, [selectedMonth, selectedYear, searchText]);

  const changeMonth = (direction) => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;
    
    if (direction === 'next') {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    } else {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const loadTransactions = async () => {
    try {
      const response = await api.get(`/transactions?month=${selectedMonth}&year=${selectedYear}`);
      const transactionsData = response.data || [];
      
      // Garantir que é um array antes de ordenar
      const validTransactions = Array.isArray(transactionsData) ? transactionsData : [];
      
      // Ordenar por data (mais recente primeiro)
      const sortedTransactions = validTransactions.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      setTransactions(sortedTransactions);
      
      // Filtrar apenas transações de débito e PIX
      const bankOnly = sortedTransactions.filter(t => 
        t && t.type === 'expense' && (t.paymentMethod === 'debito' || t.paymentMethod === 'pix')
      );
      
      // Aplicar busca se existir
      let filtered = bankOnly;
      if (searchText.trim()) {
        const search = searchText.toLowerCase();
        filtered = bankOnly.filter(t => 
          t && 
          ((t.description || '').toLowerCase().includes(search) ||
          (t.category || '').toLowerCase().includes(search))
        );
      }
      
      setBankTransactions(filtered);
      
      // Calcular total das movimentações bancárias
      const total = bankOnly.reduce((sum, t) => sum + (t.amount || 0), 0);
      setTotalBankAmount(total);
    } catch (error) {
      console.error('Erro ao carregar transações bancárias:', error);
      setTransactions([]);
      setBankTransactions([]);
      Alert.alert('Erro', 'Não foi possível carregar as movimentações bancárias');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterBankTransactions = () => {
    // Recarregar e aplicar filtro
    loadTransactions();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const handleDeleteTransaction = async (deleteAll = false) => {
    try {
      if (deleteAll && (transactionToDelete.recurringParentId || transactionToDelete.isRecurring)) {
        // Deletar todas as transações da série recorrente
        await api.delete(`/transactions/${transactionToDelete._id}/recurring`);
        Alert.alert('Sucesso', 'Todas as transações da série foram deletadas!');
      } else if (deleteAll && (transactionToDelete.installmentParentId || transactionToDelete.isInstallment)) {
        // Deletar todas as parcelas da série parcelada
        await api.delete(`/transactions/${transactionToDelete._id}/installments`);
        Alert.alert('Sucesso', 'Todas as parcelas foram deletadas!');
      } else {
        // Deletar apenas esta transação
        await api.delete(`/transactions/${transactionToDelete._id}`);
        Alert.alert('Sucesso', 'Transação deletada com sucesso!');
      }
      
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
      
      // Recarregar transações para garantir sincronização
      loadTransactions();
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      Alert.alert('Erro', 'Não foi possível deletar a transação');
    }
  };

  const handleEditTransaction = async (transactionData) => {
    try {
      console.log('📝 Editando transação:', editingTransaction._id);
      console.log('📄 Dados para enviar:', transactionData);
      console.log('🔄 updateAll flag:', transactionData.updateAll);
      
      const response = await api.put(`/transactions/${editingTransaction._id}`, transactionData);
      
      console.log('✅ Resposta do servidor:', response.data);
      
      // Atualizar lista local
      const updatedTransactions = transactions.map(t => 
        t._id === editingTransaction._id ? response.data : t
      );
      setTransactions(updatedTransactions);
      
      Alert.alert('Sucesso', 'Transação atualizada com sucesso!');
      setShowEditModal(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('❌ Erro ao atualizar transação:', error);
      console.error('❌ Detalhes do erro:', error.response?.data || error.message);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Headers:', error.response?.headers);
      console.error('❌ Request data:', error.config?.data);
      Alert.alert('Erro', `Não foi possível atualizar a transação: ${error.response?.data?.error || error.message}`);
    }
  };

  const confirmDelete = (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteConfirm(true);
  };

  const startEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const getTransactionIcon = (category) => {
    const icons = {
      'alimentacao': '🍕',
      'transporte': '�',
      'saude': '🏥',
      'educacao': '📚',
      'lazer': '🎮',
      'casa': '�',
      'trabalho': '�',
      'salario': '�',
      'freelance': '�',
      'investimento': '�',
      'venda': '�'
    };
    return icons[category?.toLowerCase()] || (filterType === 'income' ? '💰' : '🏦');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount || 0);
  };

  const getFilterButtonStyle = (type) => {
    return [
      styles.filterButton,
      filterType === type ? styles.filterButtonActive : null
    ];
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🏦 Bancos</Text>
          <Text style={styles.headerSubtitle}>
            {bankTransactions.length} {bankTransactions.length === 1 ? 'transação' : 'transações'}
          </Text>
          <Text style={styles.creditTotal}>
            Total: R$ {totalBankAmount.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.filterToggleBtn}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name={showFilters ? "search" : "search-outline"} 
            size={20} 
            color="#2563eb" 
          />
        </TouchableOpacity>
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.monthButton}>
          <Ionicons name="chevron-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {getMonthName(selectedMonth)} {selectedYear}
        </Text>
        <TouchableOpacity onPress={() => changeMonth('next')} style={styles.monthButton}>
          <Ionicons name="chevron-forward" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      {showFilters && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por débito ou PIX..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#9ca3af"
            />
            {searchText ? (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      {/* Bank Transactions List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!bankTransactions || !Array.isArray(bankTransactions) || bankTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🏦</Text>
            <Text style={styles.emptyStateText}>
              {searchText ? 'Nenhuma movimentação encontrada' : 'Nenhuma movimentação bancária'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchText ? 'Tente alterar a busca' : 'Suas transações de débito e PIX aparecerão aqui'}
            </Text>
          </View>
        ) : (
          (bankTransactions || []).map((transaction, index) => (
            <View key={transaction._id || index} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <View style={[
                  styles.transactionIcon,
                  transaction.type === 'income' ? styles.incomeIcon : styles.expenseIcon
                ]}>
                  <Text style={styles.transactionIconText}>
                    {transaction.paymentMethod === 'pix' ? '📱' : '💳'}
                  </Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description || 'Transação'}
                  </Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.category || 'Categoria'} • {transaction.paymentMethod === 'pix' ? 'PIX' : 'Débito'} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                  </Text>
                  <Text style={styles.transactionTime}>
                    {new Date(transaction.date).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === 'income' ? styles.positive : styles.negative
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}R$ {(transaction.amount || 0).toFixed(2)}
                </Text>
                <View style={styles.transactionActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => startEdit(transaction)}
                  >
                    <Ionicons name="create-outline" size={16} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => confirmDelete(transaction)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && transactionToDelete && (
        <Modal
          visible={showDeleteConfirm}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModal}>
              <Text style={styles.confirmTitle}>Confirmar Exclusão</Text>
              <Text style={styles.confirmText}>
                Deseja excluir "{transactionToDelete.description}"?
              </Text>
              
              {(transactionToDelete.isRecurring || transactionToDelete.recurringParentId) && (
                <View style={styles.recurringOptions}>
                  <TouchableOpacity
                    style={styles.deleteOptionButton}
                    onPress={() => handleDeleteTransaction(false)}
                  >
                    <Text style={styles.deleteOptionText}>Excluir apenas esta</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteOptionButton, styles.deleteAllButton]}
                    onPress={() => handleDeleteTransaction(true)}
                  >
                    <Text style={[styles.deleteOptionText, styles.deleteAllText]}>Excluir todas da série</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {(transactionToDelete.isInstallment || transactionToDelete.installmentParentId) && (
                <View style={styles.recurringOptions}>
                  <TouchableOpacity
                    style={styles.deleteOptionButton}
                    onPress={() => handleDeleteTransaction(false)}
                  >
                    <Text style={styles.deleteOptionText}>Excluir apenas esta parcela</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteOptionButton, styles.deleteAllButton]}
                    onPress={() => handleDeleteTransaction(true)}
                  >
                    <Text style={[styles.deleteOptionText, styles.deleteAllText]}>Excluir todas as parcelas</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {!transactionToDelete.isRecurring && 
               !transactionToDelete.recurringParentId && 
               !transactionToDelete.isInstallment && 
               !transactionToDelete.installmentParentId && (
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowDeleteConfirm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => handleDeleteTransaction(false)}
                  >
                    <Text style={styles.confirmButtonText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {((transactionToDelete.isRecurring || transactionToDelete.recurringParentId) ||
                (transactionToDelete.isInstallment || transactionToDelete.installmentParentId)) && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Modal */}
      {editingTransaction && showEditModal && (
        <EditTransactionModal
          visible={showEditModal}
          transaction={editingTransaction}
          onClose={() => {
            setShowEditModal(false);
            setEditingTransaction(null);
          }}
          onSuccess={() => {
            loadTransactions();
            setShowEditModal(false);
            setEditingTransaction(null);
          }}
          onEdit={handleEditTransaction}
        />
      )}
    </SafeAreaView>
  );
}

// ⚙️ CONFIGURAÇÕES SCREEN
function SettingsScreen() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Função para alternar tema escuro
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    Alert.alert('Tema', darkMode ? 'Tema claro ativado!' : 'Tema escuro ativado!');
  };

  // Função para alternar notificações
  const toggleNotifications = () => {
    setNotifications(!notifications);
    Alert.alert('Notificações', notifications ? 'Notificações desativadas!' : 'Notificações ativadas!');
  };

  // Função para mostrar informações do app
  const showAbout = () => {
    setShowAboutModal(true);
  };

  // Função para mostrar ajuda
  const showHelp = () => {
    setShowHelpModal(true);
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
    <SafeAreaView style={styles.container}>
      {/* Header moderno */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>⚙️ Configurações</Text>
          <Text style={styles.headerSubtitle}>Perfil e preferências</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seção do Perfil */}
        <View style={styles.modernProfileSection}>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Usuário'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'email@exemplo.com'}</Text>
              <Text style={styles.profileRole}>Controle Financeiro Pessoal</Text>
            </View>
          </View>
        </View>

        {/* Preferências */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>🔧 Preferências</Text>
          
          <TouchableOpacity style={styles.modernSettingsItem} onPress={toggleNotifications}>
            <View style={styles.settingsLeft}>
              <Ionicons 
                name={notifications ? "notifications" : "notifications-off"} 
                size={24} 
                color={notifications ? "#10b981" : "#6b7280"} 
              />
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsText}>Notificações</Text>
                <Text style={styles.settingsSubtext}>
                  {notifications ? 'Receber alertas de transações' : 'Notificações desativadas'}
                </Text>
              </View>
            </View>
            <View style={[styles.toggle, notifications && styles.toggleActive]}>
              <View style={[styles.toggleDot, notifications && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modernSettingsItem} onPress={toggleDarkMode}>
            <View style={styles.settingsLeft}>
              <Ionicons 
                name={darkMode ? "moon" : "sunny"} 
                size={24} 
                color={darkMode ? "#6366f1" : "#f59e0b"} 
              />
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsText}>Tema Escuro</Text>
                <Text style={styles.settingsSubtext}>
                  {darkMode ? 'Modo escuro ativo' : 'Modo claro ativo'}
                </Text>
              </View>
            </View>
            <View style={[styles.toggle, darkMode && styles.toggleActive]}>
              <View style={[styles.toggleDot, darkMode && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Suporte e Informações */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>💡 Suporte</Text>
          
          <TouchableOpacity style={styles.modernSettingsItem} onPress={showHelp}>
            <View style={styles.settingsLeft}>
              <Ionicons name="help-circle" size={24} color="#3b82f6" />
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsText}>Ajuda e Suporte</Text>
                <Text style={styles.settingsSubtext}>Dicas e tutoriais</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.modernSettingsItem} onPress={showAbout}>
            <View style={styles.settingsLeft}>
              <Ionicons name="information-circle" size={24} color="#8b5cf6" />
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsText}>Sobre o App</Text>
                <Text style={styles.settingsSubtext}>Versão 1.0.0</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Conta */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>👤 Conta</Text>
          
          <TouchableOpacity style={styles.modernSettingsItem} onPress={confirmLogout}>
            <View style={styles.settingsLeft}>
              <Ionicons name="log-out" size={24} color="#ef4444" />
              <View style={styles.settingsTextContainer}>
                <Text style={[styles.settingsText, { color: '#ef4444' }]}>Sair da conta</Text>
                <Text style={styles.settingsSubtext}>Desconectar do aplicativo</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
        
        {/* Espaço para o bottom tabs */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal de Ajuda */}
      <Modal
        visible={showHelpModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.helpModal}>
            <View style={styles.helpHeader}>
              <Text style={styles.helpTitle}>💡 Ajuda e Suporte</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.helpContent}>
              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>🚀 Como começar</Text>
                <Text style={styles.helpText}>
                  • Use o botão "+" para adicionar suas primeiras transações{'\n'}
                  • Organize por categorias: alimentação, transporte, etc.{'\n'}
                  • Escolha o método: PIX, débito ou crédito
                </Text>
              </View>
              
              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>💳 Cartões e Bancos</Text>
                <Text style={styles.helpText}>
                  • Cartões: visualize apenas gastos no crédito{'\n'}
                  • Bancos: visualize débito e PIX{'\n'}
                  • Use a busca para encontrar transações específicas
                </Text>
              </View>
              
              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>📊 Dashboard</Text>
                <Text style={styles.helpText}>
                  • Veja o resumo do mês atual{'\n'}
                  • Gráficos de receitas vs despesas{'\n'}
                  • Acesso rápido às principais funções
                </Text>
              </View>
            </ScrollView>
            <TouchableOpacity 
              style={styles.helpCloseButton} 
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={styles.helpCloseText}>Entendi!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Sobre */}
      <Modal
        visible={showAboutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.aboutModal}>
            <View style={styles.aboutHeader}>
              <Text style={styles.aboutTitle}>💰 Controle Financeiro</Text>
              <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.aboutContent}>
              <View style={styles.appIconContainer}>
                <Text style={styles.appIcon}>💰</Text>
              </View>
              <Text style={styles.appName}>Financial Control</Text>
              <Text style={styles.appVersion}>Versão 1.0.0</Text>
              <Text style={styles.aboutDescription}>
                Aplicativo completo para controle de finanças pessoais. 
                Gerencie suas receitas, despesas e tenha o controle total do seu dinheiro.
              </Text>
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>✨ Recursos:</Text>
                <Text style={styles.featureItem}>• Dashboard interativo</Text>
                <Text style={styles.featureItem}>• Gestão de transações</Text>
                <Text style={styles.featureItem}>• Controle por categorias</Text>
                <Text style={styles.featureItem}>• Visualização por período</Text>
                <Text style={styles.featureItem}>• Interface moderna</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.aboutCloseButton} 
              onPress={() => setShowAboutModal(false)}
            >
              <Text style={styles.aboutCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação de Logout */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>🚪 Sair da conta</Text>
            <Text style={styles.confirmText}>
              Tem certeza que deseja sair? Você precisará fazer login novamente.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleLogout}
              >
                <Text style={styles.confirmButtonText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Modal de Transação (simplificado)
function TransactionModal({ visible, onClose, onSuccess }) {
  const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
  
  // Estado para modal de categoria
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Categorias organizadas por tipo
  const categories = {
    income: ['Salário', 'Freelance', 'Investimentos', 'Outros'],
    expense: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Outros']
  };
  
  // Função para converter YYYY-MM-DD para DD-MM-YYYY
  const formatDateForDisplay = (isoDate) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
  };

  // Função para converter DD-MM-YYYY para YYYY-MM-DD
  const formatDateForAPI = (displayDate) => {
    if (!displayDate) return '';
    const [day, month, year] = displayDate.split('-');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: 'Outros',
    date: formatDateForDisplay(today),
    isRecurring: false,
    paymentMethod: 'pix',
    isInstallment: false,
    installmentNumber: 1,
    totalInstallments: 2
  });

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

  const handleAmountChange = (value) => {
    const formatted = formatCurrency(value);
    setFormData(prev => ({
      ...prev,
      amount: formatted
    }));
  };

  const handleSave = async () => {
    // Validação básica de data DD-MM-YYYY
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (!dateRegex.test(formData.date)) {
      Alert.alert('Erro', 'Data deve estar no formato DD-MM-AAAA');
      return;
    }

    try {
      // Converte o valor formatado de volta para número
      const numericAmount = parseFloat(formData.amount.replace(/\./g, '').replace(',', '.'));
      
      await api.post('/transactions', {
        ...formData,
        amount: numericAmount,
        date: formatDateForAPI(formData.date) // Converter para formato ISO
      });
      onSuccess();
      onClose();
      const todayReset = new Date().toISOString().split('T')[0];
      setFormData({ 
        type: 'expense', 
        amount: '', 
        description: '', 
        category: 'Outros', 
        date: formatDateForDisplay(todayReset),
        isRecurring: false,
        paymentMethod: 'pix',
        isInstallment: false,
        installmentNumber: 1,
        totalInstallments: 2
      });
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
          {/* 1. TIPO - Primeiro com botões e emojis */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, formData.type === 'income' && styles.typeButtonActiveIncome]}
              onPress={() => setFormData({...formData, type: 'income'})}
            >
              <Text style={styles.typeButtonEmoji}>💰</Text>
              <Text style={[styles.typeButtonText, formData.type === 'income' && styles.typeButtonTextActive]}>
                Receita
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, formData.type === 'expense' && styles.typeButtonActiveExpense]}
              onPress={() => setFormData({...formData, type: 'expense'})}
            >
              <Text style={styles.typeButtonEmoji}>💸</Text>
              <Text style={[styles.typeButtonText, formData.type === 'expense' && styles.typeButtonTextActive]}>
                Despesa
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2. DATA - Segundo */}
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>Data da Transação:</Text>
            <TextInput
              style={styles.dateInput}
              value={formData.date}
              onChangeText={(text) => setFormData({...formData, date: text})}
              placeholder="DD-MM-AAAA"
            />
          </View>

          {/* 3. MÉTODO DE PAGAMENTO - Terceiro */}
          <View style={styles.paymentSelector}>
            <Text style={styles.sectionLabel}>Método de Pagamento:</Text>
            <View style={styles.paymentButtons}>
              <TouchableOpacity
                style={[styles.paymentButton, formData.paymentMethod === 'debito' && styles.paymentButtonActive]}
                onPress={() => setFormData({...formData, paymentMethod: 'debito'})}
              >
                <Text style={styles.paymentButtonEmoji}>💳</Text>
                <Text style={[styles.paymentButtonText, formData.paymentMethod === 'debito' && styles.paymentButtonTextActive]}>
                  Débito
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentButton, formData.paymentMethod === 'credito' && styles.paymentButtonActive]}
                onPress={() => setFormData({...formData, paymentMethod: 'credito'})}
              >
                <Text style={styles.paymentButtonEmoji}>🏦</Text>
                <Text style={[styles.paymentButtonText, formData.paymentMethod === 'credito' && styles.paymentButtonTextActive]}>
                  Crédito
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentButton, 
                  formData.paymentMethod === 'pix' && styles.paymentButtonActive,
                  formData.isInstallment && { opacity: 0.5 }
                ]}
                onPress={() => {
                  if (!formData.isInstallment) {
                    setFormData({
                      ...formData, 
                      paymentMethod: 'pix',
                      // Se selecionar PIX, desativar parcelamento
                      isInstallment: false
                    });
                  }
                }}
                disabled={formData.isInstallment}
              >
                <Text style={styles.paymentButtonEmoji}>📱</Text>
                <Text style={[
                  styles.paymentButtonText, 
                  formData.paymentMethod === 'pix' && styles.paymentButtonTextActive,
                  formData.isInstallment && { opacity: 0.5 }
                ]}>
                  PIX
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. DESCRIÇÃO - Quarto */}
          <TextInput
            style={styles.modalInput}
            placeholder="Descrição"
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
          />

          {/* 5. VALOR - Quinto */}
          <View style={styles.currencyInputContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.currencyInput}
              placeholder="0,00"
              value={formData.amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
            />
          </View>

          {/* 6. CATEGORIA - Sexto */}
          <TouchableOpacity
            style={styles.modalInput}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={[
              styles.inputText, 
              !formData.category && styles.placeholderText
            ]}>
              {formData.category || 'Selecione uma categoria'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* 7. RECORRENTE */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[
                styles.checkbox, 
                formData.isRecurring ? styles.checkboxChecked : null
              ]}
              onPress={() => setFormData({
                ...formData, 
                isRecurring: !formData.isRecurring,
                // Se ativar recorrente, desativar parcelamento
                isInstallment: formData.isRecurring ? formData.isInstallment : false
              })}
            >
              {formData.isRecurring && <Ionicons name="checkmark" size={16} color="white" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Transação Fixa (repete todos os meses)</Text>
          </View>

          {/* 8. PARCELAMENTO */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[
                styles.checkbox, 
                formData.isInstallment ? styles.checkboxChecked : null,
                // Opaco apenas se for recorrente
                formData.isRecurring ? { opacity: 0.5 } : null
              ]}
              onPress={() => {
                // Só permite se não for recorrente
                if (!formData.isRecurring) {
                  setFormData({
                    ...formData, 
                    isInstallment: !formData.isInstallment,
                    // Se ativar parcelamento e estiver no PIX, mudar para débito
                    paymentMethod: (!formData.isInstallment && formData.paymentMethod === 'pix') ? 'debito' : formData.paymentMethod
                  });
                }
              }}
              disabled={formData.isRecurring}
            >
              {formData.isInstallment && <Ionicons name="checkmark" size={16} color="white" />}
            </TouchableOpacity>
            <Text style={[
              styles.checkboxLabel,
              formData.isRecurring ? { opacity: 0.5 } : null
            ]}>
              Parcelado (crédito/débito apenas)
            </Text>
          </View>

          {/* Campo de número de parcelas */}
          {formData.isInstallment && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Número de Parcelas</Text>
              <View style={styles.currencyContainer}>
                <Text style={styles.currencySymbol}>Parcelas:</Text>
                <TextInput
                  style={styles.currencyInput}
                  value={formData.totalInstallments.toString()}
                  onChangeText={(value) => {
                    const num = parseInt(value) || 2;
                    if (num >= 2 && num <= 60) {
                      setFormData({...formData, totalInstallments: num});
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="2"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <Text style={styles.helperText}>De 2 a 60 parcelas</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      
      {/* Modal de Seleção de Categoria */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.categoryModalOverlay}>
          <View style={styles.categoryModal}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>Selecionar Categoria</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.categoryList}>
              {categories[formData.type].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryItem,
                    formData.category === category && styles.categoryItemActive
                  ]}
                  onPress={() => {
                    setFormData({...formData, category});
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[
                    styles.categoryItemText,
                    formData.category === category && styles.categoryItemTextActive
                  ]}>
                    {category}
                  </Text>
                  {formData.category === category && (
                    <Ionicons name="checkmark" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
              case 'Cartão':
                iconName = focused ? 'card' : 'card-outline';
                break;
              case 'Cartões':
                iconName = focused ? 'wallet' : 'wallet-outline';
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
        <Tab.Screen name="Transações" component={AllTransactionsScreen} />
        <Tab.Screen name="Cartões" component={CreditCardScreen} />
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
  creditTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginTop: 4,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  monthButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563eb',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // 🔍 Search and Filter Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 0,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  incomeText: {
    color: '#059669',
  },
  expenseText: {
    color: '#dc2626',
  },
  filterToggleBtn: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  // 📱 Enhanced Transaction Item Styles
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  emptyStateIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  // 🔧 Transaction Actions Styles
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    padding: 6,
    marginLeft: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  // 📝 Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  saveButton: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginHorizontal: 20,
    marginTop: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginHorizontal: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#2563eb',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  // 🗑️ Confirm Modal Styles
  confirmModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 16,
  },
  recurringInfo: {
    fontSize: 14,
    color: '#f59e0b',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  confirmActions: {
    flexDirection: 'column',
    width: '100%',
    gap: 8,
  },
  confirmButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  deleteConfirmButton: {
    backgroundColor: '#dc2626',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
    color: '#374151',
    flex: 1,
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  dateInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
  },
  // Novos estilos para reorganização do modal
  sectionLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    fontWeight: '500',
  },
  typeButtonEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  paymentSelector: {
    marginBottom: 20,
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentButton: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  paymentButtonEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  paymentButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  paymentButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // Estilos para seleção de categoria
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '80%',
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // 🎨 NOVOS ESTILOS MODERNOS
  modernHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  modernHeaderSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavigationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthTextContainer: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  yearText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  modernSearchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modernSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  clearSearchButton: {
    padding: 4,
  },
  quickSummary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValuePositive: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  summaryValueNegative: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ef4444',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
  },
  modernEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modernTransactionsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  modernTransactionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernTransactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  incomeIconModern: {
    backgroundColor: '#ecfdf5',
  },
  expenseIconModern: {
    backgroundColor: '#fef2f2',
  },
  creditIconModern: {
    backgroundColor: '#fffbeb',
  },
  transactionInfo: {
    flex: 1,
  },
  modernTransactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  modernTransactionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  modernTransactionMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modernTransactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4,
  },
  positiveAmount: {
    color: '#10b981',
  },
  negativeAmount: {
    color: '#ef4444',
  },
  modernTransactionActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  modernActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernFab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryItemActive: {
    backgroundColor: '#eff6ff',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#374151',
  },
  categoryItemTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  // Estilos para input de moeda
  currencyInputContainer: {
    backgroundColor: '#fff',
    height: 54,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  currencySymbol: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    fontWeight: '700',
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  currencyInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  // Estilos modernos para Settings
  modernProfileSection: {
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modernSettingsItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  settingsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingsSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#10b981',
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
  // Modals
  helpModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  helpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  helpContent: {
    padding: 20,
  },
  helpSection: {
    marginBottom: 24,
  },
  helpSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  helpCloseButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    alignItems: 'center',
  },
  helpCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  aboutModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aboutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  aboutContent: {
    padding: 20,
    alignItems: 'center',
  },
  appIconContainer: {
    marginBottom: 16,
  },
  appIcon: {
    fontSize: 64,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  featuresContainer: {
    alignSelf: 'stretch',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 6,
  },
  aboutCloseButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    alignItems: 'center',
  },
  aboutCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
