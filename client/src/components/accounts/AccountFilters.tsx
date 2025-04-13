import React, { useState } from 'react';
import { AccountFilters } from '../../types/account.filter';

interface AccountFiltersComponentProps {
  onFilter: (filters: AccountFilters) => void;
}

const AccountFiltersComponent: React.FC<AccountFiltersComponentProps> = ({ onFilter }) => {
  const [filters, setFilters] = useState<AccountFilters>({
    name: '',
    type: ''
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
      name: '',
      type: ''
    };
    setFilters(emptyFilters);
    onFilter(emptyFilters);
  };

  return (
    <div className="mb-8 bg-gray-900 rounded-lg p-4 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-white">Filter Accounts</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Account Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={filters.name || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white 
                        placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name"
            />
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
              Account Type
            </label>
            <select
              id="type"
              name="type"
              value={filters.type || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white 
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="bank">Bank</option>
              <option value="credit">Credit Card</option>
              <option value="investment">Investment</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountFiltersComponent;
