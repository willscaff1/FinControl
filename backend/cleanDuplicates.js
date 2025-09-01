const mongoose = require('mongoose');

// Schema dos modelos
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  type: String,
  category: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  isRecurring: { type: Boolean, default: false },
  recurringDay: { type: Number },
  recurringParentId: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

async function cleanDuplicateTransactions() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect('mongodb://localhost:27017/financial-control');
    console.log('Conectado ao MongoDB');

    // Buscar o usuário
    const user = await User.findOne({ email: 'willian.scaff@gmail.com' });
    
    if (!user) {
      console.log('Usuário não encontrado');
      return;
    }

    console.log(`Usuário encontrado: ${user.name} (${user.email})`);

    // Buscar todas as transações do usuário
    const transactions = await Transaction.find({ 
      userId: user._id,
      isRecurring: false // Apenas transações reais, não templates
    }).sort({ date: 1, createdAt: 1 });

    console.log(`Total de transações encontradas: ${transactions.length}`);

    // Agrupar transações por descrição, tipo e data (mesmo dia)
    const groups = {};
    let duplicatesRemoved = 0;

    for (const transaction of transactions) {
      const dateKey = transaction.date.toISOString().split('T')[0]; // YYYY-MM-DD
      const key = `${transaction.description}_${transaction.type}_${dateKey}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(transaction);
    }

    // Remover duplicatas (manter apenas a primeira de cada grupo)
    for (const [key, groupTransactions] of Object.entries(groups)) {
      if (groupTransactions.length > 1) {
        console.log(`Duplicatas encontradas para: ${key} (${groupTransactions.length} transações)`);
        
        // Manter a primeira, remover as demais
        const toRemove = groupTransactions.slice(1);
        for (const transaction of toRemove) {
          await Transaction.findByIdAndDelete(transaction._id);
          duplicatesRemoved++;
          console.log(`  - Removida: ${transaction.description} - R$ ${transaction.amount}`);
        }
      }
    }

    console.log(`✅ Limpeza concluída! ${duplicatesRemoved} duplicatas removidas.`);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    // Fechar conexão
    await mongoose.connection.close();
    console.log('Conexão fechada');
  }
}

// Executar o script
cleanDuplicateTransactions();
