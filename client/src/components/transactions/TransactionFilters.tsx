import React, { useState } from 'react';
import { TransactionFilters, TransactionType } from '../../types/transaction';
import { Category } from '../../types/category';
import { Account } from '../../types/account';

interface TransactionFiltersProps {
  categories: Category[];
  accounts: Account[];
  onFilter: (filters: TransactionFilters) => void;
}

const TransactionFiltersComponent: React.FC<TransactionFiltersProps> = ({
  categories,
  accounts,
  onFilter
}) => {
  const [filters, setFilters] = useState<TransactionFilters>({
    startDate: '',
    endDate: '',
    type: '',
    category: '',
    account: ''
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
    const resetFilters = {
      startDate: '',
      endDate: '',
      type: '',
      category: '',
      account: ''
    };
    
    setFilters(resetFilters as TransactionFilters);
    onFilter(resetFilters as TransactionFilters);
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow p-4 mb-6 border border-gray-700">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Type
            </label>
            <select
              name="type"
              value={filters.type}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
            >
              <option value="">All Types</option>
              <option value={TransactionType.Income}>Income</option>
              <option value={TransactionType.Expense}>Expense</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Category
            </label>
            <select
              name="category"
              value={filters.category}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
            >
              <option value="">All Categories</option>
              {categories
                .filter(cat => !filters.type || cat.type === filters.type)
                .map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Account
            </label>
            <select
              name="account"
              value={filters.account}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
            >
              <option value="">All Accounts</option>
              {accounts.map(account => (
                <option key={account._id} value={account._id}>
                  {account.name}
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

export default TransactionFiltersComponent;
