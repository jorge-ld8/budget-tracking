import React, { useState, useEffect } from 'react';
import { Account } from '../../types/account';
import { AccountFormData } from '../../api/services/accountService';
import { ACCOUNT_TYPES } from '../../constants/accountTypes';

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
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }
    
    if (!formData.type) {
      newErrors.type = 'Account type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-300 mb-4">
        {account ? 'Edit' : 'Add'} Account
      </h2>
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
          Account Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300 placeholder-gray-500"
          placeholder="e.g. My Checking Account"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>
      
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
          Account Type
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
        >
          <option value="">Select a type</option>
          {ACCOUNT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
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
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300 placeholder-gray-500"
          placeholder="Optional description for this account"
        />
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-700 text-gray-300 rounded-md bg-gray-800 hover:bg-gray-700"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {account ? 'Update Account' : 'Create Account'}
        </button>
      </div>
    </form>
  );
};

export default AccountForm;
