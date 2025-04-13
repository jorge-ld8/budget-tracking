import React, { useState, useEffect } from 'react';
import { Account } from '../../types/account';
import { AccountFormData } from '../../api/services/accountService';

interface AccountFormProps {
  account?: Account;
  onSubmit: (formData: AccountFormData) => void;
  onCancel: () => void;
}

const AccountForm: React.FC<AccountFormProps> = ({ account, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'bank',
    description: ''
  });
  
  const [formError, setFormError] = useState<string | null>(null);
  
  // Initialize form with account data if editing
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        description: account.description || ''
      });
    }
  }, [account]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    console.log("formData", formData);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validate form
    if (!formData.name.trim()) {
      setFormError('Account name is required');
      return;
    }
    
    if (!formData.type) {
      setFormError('Account type is required');
      return;
    }
    
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
          Account Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white 
                    placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. My Checking Account"
        />
      </div>
      
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
          Account Type *
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white 
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
              <option value="bank">Bank</option>
              <option value="credit">Credit Card</option>
              <option value="investment">Investment</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white 
                    placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional description for this account"
        />
      </div>
      
      {formError && (
        <div className="p-3 bg-red-900/50 border border-red-800 rounded-md text-red-200 text-sm">
          {formError}
        </div>
      )}
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 
                    focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {account ? 'Update Account' : 'Create Account'}
        </button>
      </div>
    </form>
  );
};

export default AccountForm;
