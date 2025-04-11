import React, { useState } from 'react';
import { Transaction, TransactionType } from '../../types/transaction';
import { Category } from '../../types/category';
import { Account } from '../../types/account';
import { formatDate, formatCurrency } from '../../utils/formatters';
import Pagination from '../shared/Pagination';
import { PaginationData } from '../../types/common';
import Modal from '../common/Modal';
import { transactionService } from '../../api/services/transactionService';

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
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  const handleViewDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const transaction = await transactionService.getById(id);
      setSelectedTransaction(transaction);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Utility function to handle image downloads
  const handleDownloadImage = async (imageUrl: string, fileName: string) => {
    try {
      // For images that may not support direct download attributes
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      
      // Fallback to direct navigation if fetch fails
      window.open(imageUrl, '_blank');
    }
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
                <tr 
                  key={transaction._id} 
                  className="hover:bg-gray-800 cursor-pointer"
                  onClick={() => handleViewDetails(transaction._id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 truncate max-w-xs" title={transaction.description}>
                    <div className="flex items-center">
                      {transaction.imgUrl && (
                        <span className="mr-2 text-indigo-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                      {transaction.description}
                    </div>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(transaction);
                          }}
                          className="text-indigo-400 hover:text-indigo-300 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(transaction._id);
                          }}
                          className="text-red-500 hover:text-red-400"
                        >
                          Delete
                        </button>
                      </>
                    ) : onRestore ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestore?.(transaction._id);
                        }}
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

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        title="Transaction Details"
        onClose={() => setIsDetailModalOpen(false)}
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : selectedTransaction ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Type</h3>
                <p className={selectedTransaction.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                  {selectedTransaction.type.charAt(0).toUpperCase() + selectedTransaction.type.slice(1)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Amount</h3>
                <p className={selectedTransaction.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                  {selectedTransaction.type === 'income' ? '+' : '-'} {formatCurrency(selectedTransaction.amount)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Date</h3>
                <p className="text-gray-300">{formatDate(selectedTransaction.date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Category</h3>
                <div className="flex items-center">
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: getCategoryColor(selectedTransaction.category) }}
                  ></span>
                  <p className="text-gray-300">{getCategoryName(selectedTransaction.category)}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Account</h3>
                <p className="text-gray-300">{getAccountName(selectedTransaction.account)}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-400">Description</h3>
              <p className="text-gray-300 mt-1">{selectedTransaction.description}</p>
            </div>
            
            {selectedTransaction.imgUrl && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-400">Receipt</h3>
                  <button 
                    onClick={() => {
                      if (selectedTransaction && selectedTransaction.imgUrl) {
                        const fileName = `receipt-${selectedTransaction._id}${selectedTransaction.imgUrl.includes('.') ? selectedTransaction.imgUrl.substring(selectedTransaction.imgUrl.lastIndexOf('.')) : '.jpg'}`;
                        handleDownloadImage(selectedTransaction.imgUrl, fileName);
                      }
                    }}
                    className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
                <div className="flex justify-center">
                  <img 
                    src={selectedTransaction.imgUrl} 
                    alt="Receipt" 
                    className="max-w-full max-h-[300px] object-contain rounded-md border border-gray-700"
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 border border-gray-700 text-gray-300 rounded-md bg-gray-800 hover:bg-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  onEdit(selectedTransaction);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Edit
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4">
            Transaction not found
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionList;
