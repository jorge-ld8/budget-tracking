import React, { useState, useEffect } from 'react';
import { Budget, BudgetFormData } from '../types/budget';
import { Category } from '../types/category';
import { budgetService } from '../api/services/budgetService';
import { categoryService } from '../api/services/categoryService';
import Modal from '../components/shared/Modal';
import BudgetForm from '../components/budgets/BudgetForm';
import BudgetList from '../components/budgets/BudgetList';
import BudgetFiltersComponent from '../components/budgets/BudgetFilters';
import { BudgetFilters } from '../types/budget.filter';
import { PaginationData } from '../types/common';

const BudgetsPage: React.FC = () => {
  // State
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentFilters, setCurrentFilters] = useState<BudgetFilters>({});
  const [paginationData, setPaginationData] = useState<PaginationData>({
    page: 1,
    limit: 10,
    count: 0,
    totalPages: 1
  });
  
  // Load categories once when component mounts
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await categoryService.getAll();
        setCategories(categoriesData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
        setError(errorMessage);
      }
    };
    
    loadCategories();
  }, []);
  
  // Load budgets when pagination or filters change
  useEffect(() => {
    fetchBudgetsData(currentFilters, paginationData.page, paginationData.limit);
  }, [paginationData.page, paginationData.limit]);
  
  // Method to fetch budgets with pagination
  const fetchBudgetsData = async (
    filters: BudgetFilters = {}, 
    page: number = 1, 
    limit: number = 10
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await budgetService.getAllPaginated(filters, page, limit);
      
      setBudgets(response.budgets);
      setPaginationData({
        count: response.count,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load budgets';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Method to apply filters
  const applyFilters = async (filters: BudgetFilters) => {
    setCurrentFilters(filters);
    // Reset to page 1 when applying new filters
    fetchBudgetsData(filters, 1, paginationData.limit);
  };
  
  // Method to handle page change
  const handlePageChange = (page: number) => {
    fetchBudgetsData(currentFilters, page, paginationData.limit);
  };
  
  // Modal control methods
  const handleOpenModal = (budget: Budget | null = null) => {
    setCurrentBudget(budget);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentBudget(null);
  };
  
  // CRUD operations
  const handleSubmit = async (formData: BudgetFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (currentBudget) {
        // Update existing budget
        await budgetService.update(currentBudget._id, formData);
      } else {
        // Create new budget
        await budgetService.create(formData);
      }
      
      // Refresh the budgets list
      fetchBudgetsData(currentFilters, paginationData.page, paginationData.limit);
      
      // Close the modal
      handleCloseModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save budget';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await budgetService.delete(id);
      
      // Refresh the budgets list after delete
      fetchBudgetsData(currentFilters, paginationData.page, paginationData.limit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete budget';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRestore = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await budgetService.restore(id);
      
      // Refresh the budgets list after restore
      fetchBudgetsData(currentFilters, paginationData.page, paginationData.limit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore budget';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add Budget
        </button>
      </div>
      
      <BudgetFiltersComponent
        categories={categories}
        onFilter={applyFilters}
      />
      
      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-800 rounded-md text-red-200">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <BudgetList
          budgets={budgets}
          categories={categories}
          paginationData={paginationData}
          onPageChange={handlePageChange}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          onRestore={handleRestore}
        />
      )}
      
      <Modal
        isOpen={isModalOpen}
        title={currentBudget ? 'Edit Budget' : 'Add Budget'}
        onClose={handleCloseModal}
      >
        <BudgetForm
          budget={currentBudget ?? undefined}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default BudgetsPage; 