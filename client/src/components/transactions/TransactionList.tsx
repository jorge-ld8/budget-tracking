import React from 'react';
import { Transaction, TransactionType } from '../../types/transaction';
import { Category } from '../../types/category';
import { Account } from '../../types/account';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { PaginationData } from '../../types/common';
import { transactionService } from '../../api/services/transactionService';
import BaseList, { Column } from '../shared/BaseList';

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

  // Handle row click to view details
  const handleViewDetails = async (transaction: Transaction) => {
    return await transactionService.getById(transaction._id);
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

  // Define columns for the BaseList
  const columns: Column<Transaction>[] = [
    {
      key: 'date',
      header: 'Date',
      width: 'w-24',
      render: (transaction) => (
        <span className="whitespace-nowrap">{formatDate(transaction.date)}</span>
      )
    },
    {
      key: 'description',
      header: 'Description',
      width: 'w-60',
      render: (transaction) => (
        <div className="flex items-center truncate max-w-xs" title={transaction.description}>
          {transaction.imgUrl && (
            <span className="mr-2 text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </span>
          )}
          {transaction.description}
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      width: 'w-40',
      render: (transaction) => (
        <div className="flex items-center">
          <span
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: getCategoryColor(transaction.category) }}
          ></span>
          {getCategoryName(transaction.category)}
        </div>
      )
    },
    {
      key: 'account',
      header: 'Account',
      width: 'w-40',
      render: (transaction) => (
        <span className="whitespace-nowrap">{getAccountName(transaction.account)}</span>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      width: 'w-32',
      render: (transaction) => {
        const { textColor } = getTypeStyles(transaction.type);
        return (
          <span className={`whitespace-nowrap font-medium ${textColor}`}>
            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
          </span>
        );
      }
    }
  ];

  // Define the actions column
  const actionsColumn = {
    header: 'Actions',
    width: 'w-28',
    render: (transaction: Transaction, actions: {
      onEdit?: (transaction: Transaction) => void;
      onDelete?: (id: string) => void;
      onRestore?: (id: string) => void;
    }) => {
      if (!transaction.isDeleted) {
        return (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                actions.onEdit?.(transaction);
              }}
              className="text-indigo-400 hover:text-indigo-300 mr-4"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                actions.onDelete?.(transaction._id);
              }}
              className="text-red-500 hover:text-red-400"
            >
              Delete
            </button>
          </>
        );
      } else if (actions.onRestore) {
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              actions.onRestore?.(transaction._id);
            }}
            className="text-green-500 hover:text-green-400"
          >
            Restore
          </button>
        );
      }
      return null;
    }
  };

  // Define the detail modal content
  const detailModalContent = (transaction: Transaction | null, closeModal: () => void) => {
    if (!transaction) {
      return (
        <div className="text-center text-gray-400 py-4">
          Transaction not found
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-400">Type</h3>
            <p className={transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}>
              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400">Amount</h3>
            <p className={transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}>
              {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400">Date</h3>
            <p className="text-gray-300">{formatDate(transaction.date)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400">Category</h3>
            <div className="flex items-center">
              <span
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: getCategoryColor(transaction.category) }}
              ></span>
              <p className="text-gray-300">{getCategoryName(transaction.category)}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400">Account</h3>
            <p className="text-gray-300">{getAccountName(transaction.account)}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-400">Description</h3>
          <p className="text-gray-300 mt-1">{transaction.description}</p>
        </div>
        
        {transaction.imgUrl && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-400">Receipt</h3>
              <button 
                onClick={() => {
                  if (transaction && transaction.imgUrl) {
                    const fileName = `receipt-${transaction._id}${transaction.imgUrl.includes('.') ? transaction.imgUrl.substring(transaction.imgUrl.lastIndexOf('.')) : '.jpg'}`;
                    handleDownloadImage(transaction.imgUrl, fileName);
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
                src={transaction.imgUrl} 
                alt="Receipt" 
                className="max-w-full max-h-[300px] object-contain rounded-md border border-gray-700"
              />
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={closeModal}
            className="px-4 py-2 border border-gray-700 text-gray-300 rounded-md bg-gray-800 hover:bg-gray-700"
          >
            Close
          </button>
          <button
            onClick={() => {
              closeModal();
              onEdit(transaction);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Edit
          </button>
        </div>
      </div>
    );
  };

  return (
    <BaseList
      items={transactions}
      columns={columns}
      paginationData={paginationData}
      onPageChange={onPageChange}
      onEdit={onEdit}
      onDelete={onDelete}
      onRestore={onRestore}
      showDeleted={showDeleted}
      rowClickAction={handleViewDetails}
      detailModalContent={detailModalContent}
      actionsColumn={actionsColumn}
      emptyStateMessage={showDeleted ? 'No deleted transactions found.' : 'No transactions found.'}
    />
  );
};

export default TransactionList;
