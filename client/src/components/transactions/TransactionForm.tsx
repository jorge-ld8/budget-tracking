import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../../types/transaction';
import { Category } from '../../types/category';
import { Account } from '../../types/account';

interface TransactionFormProps {
  transaction?: Transaction;
  categories: Category[];
  accounts: Account[];
  onSubmit: (formData: Partial<Transaction>) => void;
  onCancel: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  categories,
  accounts,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<Transaction>>({
    amount: 0,
    type: TransactionType.Expense,
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    account: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (transaction) {
      setFormData({
        ...transaction,
        date: new Date(transaction.date).toISOString().split('T')[0]
      });
    }
  }, [transaction]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.account) {
      newErrors.account = 'Account is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
  };

  // Filter categories based on selected transaction type
  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Transaction Type
        </label>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="expense"
              name="type"
              value={TransactionType.Expense}
              checked={formData.type === TransactionType.Expense}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 border-gray-700 bg-gray-800 focus:ring-indigo-500"
            />
            <label htmlFor="expense" className="ml-2 text-gray-300">
              Expense
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="income"
              name="type"
              value={TransactionType.Income}
              checked={formData.type === TransactionType.Income}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 border-gray-700 bg-gray-800 focus:ring-indigo-500"
            />
            <label htmlFor="income" className="ml-2 text-gray-300">
              Income
            </label>
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">
          Amount
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          step="0.01"
          value={formData.amount}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
        />
        {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
        />
        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
      </div>
      
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">
          Date
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
        />
        {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
      </div>
      
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={formData.category as string}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
        >
          <option value="">Select a category</option>
          {filteredCategories.map(category => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
      </div>
      
      <div>
        <label htmlFor="account" className="block text-sm font-medium text-gray-300 mb-1">
          Account
        </label>
        <select
          id="account"
          name="account"
          value={formData.account as string}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
        >
          <option value="">Select an account</option>
          {accounts.map(account => (
            <option key={account._id} value={account._id}>
              {account.name}
            </option>
          ))}
        </select>
        {errors.account && <p className="mt-1 text-sm text-red-500">{errors.account}</p>}
      </div>
      
      <div className="flex justify-end space-x-3">
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
          {transaction ? 'Update' : 'Create'} Transaction
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
