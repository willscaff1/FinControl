/**
 * Script para limpar duplicatas e corrigir templates de transações fixas
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => console.log('❌ Erro:', err.message));

// Schema das transações
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

const Transaction = mongoose.model('Transaction', TransactionSchema);

async function cleanupDatabase() {
  try {
    console.log('🧹 Iniciando limpeza do banco de dados...');
    
    // 1. Encontrar todos os templates duplicados (isRecurring: true)
    const templates = await Transaction.find({ isRecurring: true });
    console.log(`📋 Templates encontrados: ${templates.length}`);
    
    // 2. Agrupar templates por descrição e tipo para identificar duplicatas
    const templateGroups = {};
    templates.forEach(template => {
      const key = `${template.description}-${template.type}-${template.category}`;
      if (!templateGroups[key]) {
        templateGroups[key] = [];
      }
      templateGroups[key].push(template);
    });
    
    // 3. Manter apenas o primeiro template de cada grupo e deletar duplicatas
    for (const [key, group] of Object.entries(templateGroups)) {
      if (group.length > 1) {
        console.log(`🔍 Grupo ${key}: ${group.length} templates duplicados`);
        
        // Manter o primeiro (mais antigo)
        const keepTemplate = group[0];
        const deleteTemplates = group.slice(1);
        
        console.log(`✅ Mantendo template: ${keepTemplate._id}`);
        
        // Deletar templates duplicados e suas transações geradas
        for (const template of deleteTemplates) {
          console.log(`❌ Deletando template: ${template._id}`);
          
          // Deletar todas as transações geradas por este template
          const deletedTransactions = await Transaction.deleteMany({
            recurringParentId: template._id
          });
          console.log(`   └── ${deletedTransactions.deletedCount} transações geradas deletadas`);
          
          // Deletar o template
          await Transaction.deleteOne({ _id: template._id });
        }
        
        // Atualizar transações órfãs para apontar para o template correto
        await Transaction.updateMany(
          { recurringParentId: { $in: deleteTemplates.map(t => t._id) } },
          { recurringParentId: keepTemplate._id }
        );
      }
    }
    
    // 4. Verificar transações duplicadas no mesmo mês
    const allTransactions = await Transaction.find({ 
      isRecurring: false,
      recurringParentId: { $exists: true }
    }).sort({ date: 1 });
    
    const monthlyGroups = {};
    allTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getMonth()}-${date.getFullYear()}-${transaction.recurringParentId}`;
      
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = [];
      }
      monthlyGroups[monthKey].push(transaction);
    });
    
    // Deletar duplicatas mensais (manter apenas a primeira)
    for (const [monthKey, transactions] of Object.entries(monthlyGroups)) {
      if (transactions.length > 1) {
        console.log(`📅 Mês ${monthKey}: ${transactions.length} transações duplicadas`);
        
        const keepTransaction = transactions[0];
        const deleteTransactions = transactions.slice(1);
        
        for (const transaction of deleteTransactions) {
          console.log(`❌ Deletando transação duplicada: ${transaction._id}`);
          await Transaction.deleteOne({ _id: transaction._id });
        }
      }
    }
    
    console.log('✅ Limpeza concluída!');
    
    // 5. Mostrar estatísticas finais
    const finalTemplates = await Transaction.countDocuments({ isRecurring: true });
    const finalTransactions = await Transaction.countDocuments({ isRecurring: false });
    
    console.log(`📊 Estatísticas finais:`);
    console.log(`   Templates: ${finalTemplates}`);
    console.log(`   Transações: ${finalTransactions}`);
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  } finally {
    mongoose.disconnect();
  }
}

cleanupDatabase();
