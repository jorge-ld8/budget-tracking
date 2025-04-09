import React from 'react';
import { Transaction, TransactionType } from '../../types/transaction';
import { Category } from '../../types/category';
import { Account } from '../../types/account';
import { formatDate, formatCurrency } from '../../utils/formatters';
import Pagination from '../shared/Pagination';
import { PaginationData } from '../../types/common';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  showDeleted?: boolean;
  paginationData: PaginationData;
  onPageChange: (page: number) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  accounts,
  onEdit,
  onDelete,
  onRestore,
  showDeleted = false,
  paginationData,
  onPageChange
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
      ? { textColor: 'text-green-500' }
      : { textColor: 'text-red-500' };
  };
  
  if (filteredTransactions.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg shadow p-6 text-center text-gray-400 border border-gray-700">
        {showDeleted ? 'No deleted transactions found.' : 'No transactions found.'}
      </div>
    );
  }
  
  return (
    <div className="bg-gray-900 rounded-lg shadow border border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 table-fixed">
          <thead className="bg-gray-800">
            <tr>
              <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="w-60 px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Description
              </th>
              <th className="w-40 px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="w-40 px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Account
              </th>
              <th className="w-32 px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="w-28 px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {filteredTransactions.map(transaction => {
              const { textColor } = getTypeStyles(transaction.type);
              
              return (
                <tr key={transaction._id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 truncate max-w-xs" title={transaction.description}>
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div className="flex items-center">
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: getCategoryColor(transaction.category) }}
                      ></span>
                      {getCategoryName(transaction.category)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
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
                          className="text-indigo-400 hover:text-indigo-300 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(transaction._id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          Delete
                        </button>
                      </>
                    ) : onRestore ? (
                      <button
                        onClick={() => onRestore(transaction._id)}
                        className="text-green-500 hover:text-green-400"
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
      
      {/* Server Pagination */}
      <div className="px-6 py-3 bg-gray-800">
        <Pagination 
          currentPage={paginationData.page}
          totalPages={paginationData.totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};

export default TransactionList;
