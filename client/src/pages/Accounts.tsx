import React, { useState, useEffect } from 'react';
import { Account } from '../types/account';
import { accountService, AccountFormData } from '../api/services/accountService';
import Modal from '../components/shared/Modal';
import AccountForm from '../components/accounts/AccountForm';
import AccountList from '../components/accounts/AccountList';
import AccountFiltersComponent from '../components/accounts/AccountFilters';
import { AccountFilters } from '../types/account.filter';
import { PaginationData } from '../types/common';

const AccountsPage: React.FC = () => {
  // State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentFilters, setCurrentFilters] = useState<AccountFilters>({});
  const [paginationData, setPaginationData] = useState<PaginationData>({
    page: 1,
    limit: 10,
    count: 0,
    totalPages: 1
  });
  
  useEffect(() => {
    fetchAccountsData(currentFilters, paginationData.page, paginationData.limit);
  }, [paginationData.page, paginationData.limit, currentFilters]);
  
  // Method to fetch accounts with pagination
  const fetchAccountsData = async (
    filters: AccountFilters = {}, 
    page: number = 1, 
    limit: number = 10
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await accountService.getAllPaginated(filters, page, limit);
      
      setAccounts(response.accounts);
      setPaginationData({
        count: response.count,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load accounts';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Method to apply filters
  const applyFilters = async (filters: AccountFilters) => {
    setCurrentFilters(filters);
    // Reset to page 1 when applying new filters
    fetchAccountsData(filters, 1, paginationData.limit);
  };
  
  // Method to handle page change
  const handlePageChange = (page: number) => {
    fetchAccountsData(currentFilters, page, paginationData.limit);
  };
  
  // Modal control methods
  const handleOpenModal = (account: Account | null = null) => {
    setCurrentAccount(account);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentAccount(null);
  };
  
  // CRUD operations
  const handleSubmit = async (formData: AccountFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (currentAccount) {
        // Update existing account
        await accountService.update(currentAccount._id, formData);
      } else {
        // Create new account
        await accountService.create(formData);
      }
      
      // Refresh the accounts list
      fetchAccountsData(currentFilters, paginationData.page, paginationData.limit);
      
      // Close the modal
      handleCloseModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save account';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await accountService.delete(id);
      
      // Refresh the accounts list after delete
      fetchAccountsData(currentFilters, paginationData.page, paginationData.limit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add Account
        </button>
      </div>
      
      <AccountFiltersComponent
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
        <AccountList
          accounts={accounts}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          paginationData={paginationData}
          onPageChange={handlePageChange}
        />
      )}
      
      <Modal
        isOpen={isModalOpen}
        title={currentAccount ? 'Edit Account' : 'Add Account'}
        onClose={handleCloseModal}
      >
        <AccountForm
          account={currentAccount ?? undefined}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}

export default AccountsPage;
