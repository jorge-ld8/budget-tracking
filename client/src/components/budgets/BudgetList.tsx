import React, { useState } from 'react';
import { Budget, BudgetPeriod } from '../../types/budget';
import { Category } from '../../types/category';
import { PaginationData } from '../../types/common';
import BaseList, { Column } from '../shared/BaseList';
import { formatCurrency } from '../../utils/formatters';

interface BudgetListProps {
  budgets: Budget[];
  categories: Category[];
  paginationData: PaginationData;
  onPageChange: (page: number) => void;
  onEdit?: (budget: Budget) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
}

const BudgetList: React.FC<BudgetListProps> = ({
  budgets,
  categories,
  paginationData,
  onPageChange,
  onEdit,
  onDelete,
  onRestore,
}) => {
//   const [showDeleted, setShowDeleted] = useState(false);

  // Helper function to get category name
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((cat) => cat._id === categoryId);
    return category ? category.name : 'Unknown';
  };

  // Helper function to get category color
  const getCategoryColor = (categoryId: string): string => {
    const category = categories.find((cat) => cat._id === categoryId);
    return category ? category.color : '#808080';
  };

  // Helper to format period string to be more readable
  const formatPeriod = (period: BudgetPeriod): string => {
    switch (period) {
      case BudgetPeriod.DAILY:
        return 'Daily';
      case BudgetPeriod.WEEKLY:
        return 'Weekly';
      case BudgetPeriod.MONTHLY:
        return 'Monthly';
      case BudgetPeriod.YEARLY:
        return 'Yearly';
      default:
        return 'Unknown';
    }
  };

  // Define columns for the budget list
  const columns: Column<Budget>[] = [
    {
      key: 'category',
      header: 'Category',
      render: (budget) => (
        <div className="flex items-center">
          <div 
            className="w-4 h-4 mr-2 rounded-full" 
            style={{ backgroundColor: getCategoryColor(budget.category) }}
          ></div>
          <span>{getCategoryName(budget.category)}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (budget) => (
        <span className="font-semibold">{formatCurrency(budget.amount)}</span>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      render: (budget) => (
        <span>{formatPeriod(budget.period)}</span>
      ),
    },
    {
      key: 'dates',
      header: 'Date Range',
      render: (budget) => (
        <span>
          {new Date(budget.startDate).toLocaleDateString()} 
          {budget.endDate ? ` - ${new Date(budget.endDate).toLocaleDateString()}` : ''}
        </span>
      ),
    },
    {
      key: 'recurring',
      header: 'Recurring',
      render: (budget) => (
        <span>{budget.isRecurring ? 'Yes' : 'No'}</span>
      ),
    }
  ];

  // Get detail content for the modal
  const detailModalContent = (budget: Budget | null, closeModal: () => void) => {
    if (!budget) return <div>No budget selected</div>;
    
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-300">Category</h3>
          <div className="flex items-center mt-1">
            <div 
              className="w-4 h-4 mr-2 rounded-full" 
              style={{ backgroundColor: getCategoryColor(budget.category) }}
            ></div>
            <p className="text-white">{getCategoryName(budget.category)}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-300">Amount</h3>
          <p className="text-white">{formatCurrency(budget.amount)}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-300">Period</h3>
          <p className="text-white">{formatPeriod(budget.period)}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-300">Start Date</h3>
          <p className="text-white">{new Date(budget.startDate).toLocaleDateString()}</p>
        </div>
        
        {budget.endDate && (
          <div>
            <h3 className="text-lg font-medium text-gray-300">End Date</h3>
            <p className="text-white">{new Date(budget.endDate).toLocaleDateString()}</p>
          </div>
        )}
        
        <div>
          <h3 className="text-lg font-medium text-gray-300">Recurring</h3>
          <p className="text-white">{budget.isRecurring ? 'Yes' : 'No'}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-300">Created At</h3>
          <p className="text-white">{budget.createdAt ? new Date(budget.createdAt).toLocaleString() : 'N/A'}</p>
        </div>
        
        {budget.updatedAt && (
          <div>
            <h3 className="text-lg font-medium text-gray-300">Last Updated</h3>
            <p className="text-white">{new Date(budget.updatedAt).toLocaleString()}</p>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 border border-gray-700 text-gray-300 rounded-md bg-gray-800 hover:bg-gray-700"
          >
            Close
          </button>
          
          {!budget.isDeleted && onEdit && (
            <button
              type="button"
              onClick={() => {
                closeModal();
                onEdit(budget);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* <div className="flex justify-end mb-4">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={showDeleted}
            onChange={() => setShowDeleted(!showDeleted)}
          />
          <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-300">
            Show Deleted Budgets
          </span>
        </label>
      </div> */}

      <BaseList
        items={budgets}
        columns={columns}
        paginationData={paginationData}
        onPageChange={onPageChange}
        onEdit={onEdit}
        onDelete={onDelete}
        onRestore={onRestore}
        // showDeleted={showDeleted}
        detailModalContent={detailModalContent}
        emptyStateMessage="No budgets found"
      />
    </div>
  );
};

export default BudgetList; 