const { MongoClient } = require('mongodb');

async function finalCleanup() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('🔌 Conectado ao MongoDB');
    
    const db = client.db('financial-app');
    const transactions = db.collection('transactions');
    
    // 1. Contar todas as transações
    const totalCount = await transactions.countDocuments();
    console.log(`📊 Total de transações: ${totalCount}`);
    
    // 2. Encontrar templates
    const templates = await transactions.find({ isRecurring: true }).toArray();
    console.log(`📋 Templates encontrados: ${templates.length}`);
    
    // 3. Remover TODAS as instâncias (não-templates)
    const deleteResult = await transactions.deleteMany({ 
      $or: [
        { isRecurring: { $ne: true } },
        { isRecurring: false }
      ]
    });
    
    console.log(`🗑️  Instâncias removidas: ${deleteResult.deletedCount}`);
    
    // 4. Contar o que sobrou
    const remainingCount = await transactions.countDocuments();
    console.log(`📊 Transações restantes: ${remainingCount}`);
    
    // 5. Mostrar templates que sobraram
    const remainingTemplates = await transactions.find({ isRecurring: true }).toArray();
    console.log('📋 Templates restantes:');
    remainingTemplates.forEach(template => {
      console.log(`   - ${template.description} (ID: ${template._id}) - Dia: ${template.recurringDay}`);
    });
    
    console.log('✅ Limpeza concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
  }
}

finalCleanup();
