import React from 'react';
import { Transaction, TransactionType } from '../../types/transaction';
import { Category } from '../../types/category';
import { Account } from '../../types/account';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  showDeleted?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  accounts,
  onEdit,
  onDelete,
  onRestore,
  showDeleted = false
}) => {
  // Filter transactions by deleted status if specified
  const filteredTransactions = showDeleted
    ? transactions.filter(t => t.isDeleted)
    : transactions.filter(t => !t.isDeleted);
  
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(c => c._id === categoryId);
    return category ? category.name : 'Unknown Category';
  };
  
  const getCategoryColor = (categoryId: string): string => {
    const category = categories.find(c => c._id === categoryId);
    return category ? category.color : '#cccccc';
  };
  
  const getAccountName = (accountId: string): string => {
    const account = accounts.find(a => a._id === accountId);
    return account ? account.name : 'Unknown Account';
  };
  
  const getTypeStyles = (type: TransactionType): { textColor: string } => {
    return type === 'income'
      ? { textColor: 'text-green-600' }
      : { textColor: 'text-red-600' };
  };
  
  if (filteredTransactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        {showDeleted ? 'No deleted transactions found.' : 'No transactions found.'}
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Account
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredTransactions.map(transaction => {
            const { textColor } = getTypeStyles(transaction.type);
            
            return (
              <tr key={transaction._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: getCategoryColor(transaction.category) }}
                    ></span>
                    {getCategoryName(transaction.category)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getAccountName(transaction.account)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${textColor}`}>
                  {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {!transaction.isDeleted ? (
                    <>
                      <button
                        onClick={() => onEdit(transaction)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(transaction._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </>
                  ) : onRestore ? (
                    <button
                      onClick={() => onRestore(transaction._id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Restore
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList;
