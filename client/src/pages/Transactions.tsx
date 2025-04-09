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
import { PaginationData } from '../types/common';

const TransactionsPage: React.FC = () => {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentFilters, setCurrentFilters] = useState<TransactionFilters>({});
  const [paginationData, setPaginationData] = useState<PaginationData>({
    page: 1,
    limit: 10,
    count: 0,
    totalPages: 1
  });
  

  useEffect(() => {
    fetchTransactionsData(currentFilters, paginationData.page, paginationData.limit);
  }, [paginationData.page, paginationData.limit]);
  
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [categoriesData, accountsData] = await Promise.all([
          categoryService.getAll(),
          accountService.getAll()
        ]);
        
        setCategories(categoriesData);
        setAccounts(accountsData);
        console.log("accounts", accountsData);
        
        // Initial transactions fetch is handled by the other useEffect
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Method to fetch transactions with pagination
  const fetchTransactionsData = async (
    filters: TransactionFilters = {}, 
    page: number = 1, 
    limit: number = 10
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await transactionService.getAllPaginated(filters, page, limit);
      
      setTransactions(response.transactions);
      setPaginationData({
        count: response.count,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load transactions';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Method to apply filters
  const applyFilters = async (filters: TransactionFilters) => {
    setCurrentFilters(filters);
    // Reset to page 1 when applying new filters
    fetchTransactionsData(filters, 1, paginationData.limit);
  };
  
  // Method to handle page change
  const handlePageChange = (page: number) => {
    fetchTransactionsData(currentFilters, page, paginationData.limit);
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
        
        // Refresh the transactions list after update
        fetchTransactionsData(currentFilters, paginationData.page, paginationData.limit);
      } else {
        // Create new transaction
        await transactionService.create(formData);
        
        // Refresh the transactions list after create
        fetchTransactionsData(currentFilters, paginationData.page, paginationData.limit);
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
      
      // Refresh the transactions list after delete
      fetchTransactionsData(currentFilters, paginationData.page, paginationData.limit);
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
          paginationData={paginationData}
          onPageChange={handlePageChange}
        />
      )}
      
      <Modal
        isOpen={isModalOpen}
        title={currentTransaction ? 'Edit Transaction' : 'Add Transaction'}
        onClose={handleCloseModal}
      >
        <TransactionForm
          transaction={currentTransaction ?? undefined}
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
