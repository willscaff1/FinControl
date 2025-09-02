const API_BASE_URL = 'http://192.168.1.110:3001/api';

class ApiService {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro na requisição');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(name, email, password) {
    return await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  // Dashboard
  async getDashboard() {
    return await this.request('/dashboard');
  }

  // Transactions
  async getTransactions() {
    return await this.request('/transactions');
  }

  async createTransaction(transaction) {
    return await this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async updateTransaction(id, transaction) {
    return await this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
  }

  async deleteTransaction(id) {
    return await this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Credit Cards
  async getCreditCards() {
    return await this.request('/credit-cards');
  }

  async createCreditCard(card) {
    return await this.request('/credit-cards', {
      method: 'POST',
      body: JSON.stringify(card),
    });
  }

  // Banks
  async getBanks() {
    return await this.request('/banks');
  }

  async createBank(bank) {
    return await this.request('/banks', {
      method: 'POST',
      body: JSON.stringify(bank),
    });
  }
}

export default new ApiService();
