        ) : (
          transactions.map(transaction => {
            const getTransactionIcon = (category, type) => {
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
                'venda': '💵',
                'compras': '🛍️',
                'restaurante': '🍽️',
                'combustivel': '⛽',
                'farmacia': '💊',
                'cinema': '🎬',
                'academia': '💪',
                'streaming': '📺',
                'internet': '📡',
                'celular': '📱'
              };
              return icons[category?.toLowerCase()] || (type === 'income' ? '💰' : '💳');
            };

            return (
              <div key={transaction._id} className="transaction-item">
                <div className="transaction-info">
                  <div className={`transaction-icon ${transaction.type}`}>
                    <span className="icon-emoji">
                      {getTransactionIcon(transaction.category, transaction.type)}
                    </span>
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
                        setShowDeleteModal(true);
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
        )
