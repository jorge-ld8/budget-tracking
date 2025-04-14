import React, { useState } from 'react';
import { BudgetFilters } from '../../types/budget.filter';
import { BUDGET_PERIODS } from '../../types/budget';
import { Category } from '../../types/category';

interface BudgetFiltersComponentProps {
  categories: Category[];
  onFilter: (filters: BudgetFilters) => void;
}

const BudgetFiltersComponent: React.FC<BudgetFiltersComponentProps> = ({ 
  categories, 
  onFilter 
}) => {
  const [filters, setFilters] = useState<BudgetFilters>({
    period: '',
    category: '',
    startDate: '',
    endDate: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter(filters);
  };

  const handleReset = () => {
    const emptyFilters = {
      period: '',
      category: '',
      startDate: '',
      endDate: ''
    };
    setFilters(emptyFilters);
    onFilter(emptyFilters);
  };

  // Get only expense categories
  const expenseCategories = categories.filter(category => category.type === 'expense');

  return (
    <div className="mb-8 bg-gray-900 rounded-lg p-4 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-white">Filter Budgets</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white 
                        focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white 
                        focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="period" className="block text-sm font-medium text-gray-300 mb-1">
              Period
            </label>
            <select
              id="period"
              name="period"
              value={filters.period || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white 
                        focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Periods</option>
              {BUDGET_PERIODS.map((period: { value: string; label: string }) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={filters.category || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white 
                        focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {expenseCategories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
        </div>
        
        <div className="flex justify-end mt-4 space-x-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetFiltersComponent; 