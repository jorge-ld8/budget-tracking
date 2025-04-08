import React, { useState, useEffect } from 'react';
import { Transaction, TransactionFormData, TransactionFilters } from '../types/transaction';
import { transactionService } from '../api/services/transactionService';
import { Category } from '../types/category';
import { Account } from '../types/account';
import { categoryService } from '../api/services/categoryService';
import { accountService } from '../api/services/accountService';
import Modal from '../components/shared/Modal';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionList from '../components/transactions/TransactionList';
import TransactionFiltersComponent from '../components/transactions/TransactionFilters';

const TransactionsPage: React.FC = () => {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  // Fetch all data on mount
  useEffect(() => {
    fetchInitialData();
  }, []);
  
  // Method to fetch all required data
  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [transactionsData, categoriesData, accountsData] = await Promise.all([
        transactionService.getAll(),
        categoryService.getAll(),
        accountService.getAll()
      ]);
      
      setTransactions(transactionsData);
      setCategories(categoriesData);
      setAccounts(accountsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Method to apply filters
  const applyFilters = async (filters: TransactionFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filteredTransactions = await transactionService.getAll(filters as TransactionFormData);
      setTransactions(filteredTransactions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter transactions';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Modal control methods
  const handleOpenModal = (transaction: Transaction | null = null) => {
    setCurrentTransaction(transaction);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTransaction(null);
  };
  
  // CRUD operations
  const handleSubmit = async (formData: TransactionFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (currentTransaction) {
        // Update existing transaction
        const updatedTransaction = await transactionService.update(
          currentTransaction._id, 
          formData
        );
        
        // Update the transactions list
        setTransactions(prevTransactions => 
          prevTransactions.map(t => 
            t._id === updatedTransaction._id ? updatedTransaction : t
          )
        );
      } else {
        // Create new transaction
        const newTransaction = await transactionService.create(formData);
        
        // Add to the transactions list
        setTransactions(prevTransactions => [...prevTransactions, newTransaction]);
      }
      
      // Close the modal
      handleCloseModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save transaction';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await transactionService.delete(id);
      
      // Remove from the transactions list
      setTransactions(prevTransactions => 
        prevTransactions.filter(t => t._id !== id)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete transaction';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add Transaction
        </button>
      </div>
      
      <TransactionFiltersComponent
        categories={categories}
        accounts={accounts}
        onFilter={applyFilters}
      />
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <TransactionList
          transactions={transactions}
          categories={categories}
          accounts={accounts}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />
      )}
      
      <Modal
        isOpen={isModalOpen}
        title={currentTransaction ? 'Edit Transaction' : 'Add Transaction'}
        onClose={handleCloseModal}
      >
        <TransactionForm
          transaction={currentTransaction}
          categories={categories}
          accounts={accounts}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}

export default TransactionsPage;
