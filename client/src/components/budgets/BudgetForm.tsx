import React, { useState, useEffect } from 'react';
import { Budget, BudgetFormData, BudgetPeriod } from '../../types/budget';
import { Category } from '../../types/category';

interface BudgetFormProps {
  budget?: Budget;
  categories: Category[];
  onSubmit: (formData: BudgetFormData) => void;
  onCancel: () => void;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ 
  budget, 
  categories,
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<BudgetFormData>({
    amount: 0,
    period: BudgetPeriod.MONTHLY,
    category: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isRecurring: true
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialize form with budget data if editing
  useEffect(() => {
    if (budget) {
      setFormData({
        amount: budget.amount,
        period: budget.period as BudgetPeriod,
        category: budget.category,
        startDate: new Date(budget.startDate).toISOString().split('T')[0],
        endDate: budget.endDate ? new Date(budget.endDate).toISOString().split('T')[0] : '',
        isRecurring: budget.isRecurring
      });
    }
  }, [budget]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      }));
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.period) {
      newErrors.period = 'Period is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
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
  
  // Filter categories to only show expense categories
  const expenseCategories = categories.filter(category => category.type === 'expense');
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-300 mb-4">
        {budget ? 'Edit' : 'Add'} Budget
      </h2>
      
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
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300 placeholder-gray-500"
          placeholder="0.00"
        />
        {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
      </div>
      
      <div>
        <label htmlFor="period" className="block text-sm font-medium text-gray-300 mb-1">
          Period
        </label>
        <select
          id="period"
          name="period"
          value={formData.period}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
        >
          <option value={BudgetPeriod.DAILY}>Daily</option>
          <option value={BudgetPeriod.WEEKLY}>Weekly</option>
          <option value={BudgetPeriod.MONTHLY}>Monthly</option>
          <option value={BudgetPeriod.YEARLY}>Yearly</option>
        </select>
        {errors.period && <p className="mt-1 text-sm text-red-500">{errors.period}</p>}
      </div>
      
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
        >
          <option value="">Select a category</option>
          {expenseCategories.map(category => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
      </div>
      
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
        />
        {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
      </div>
      
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">
          End Date (Optional)
        </label>
        <input
          type="date"
          id="endDate"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
        />
        {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
        <p className="text-xs text-gray-500 mt-1">Leave empty for recurring budgets with no end date</p>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isRecurring"
          name="isRecurring"
          checked={formData.isRecurring}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 border-gray-700 bg-gray-800 focus:ring-indigo-500 rounded"
        />
        <label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-gray-300">
          Recurring Budget
        </label>
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
          {budget ? 'Update Budget' : 'Create Budget'}
        </button>
      </div>
    </form>
  );
};

export default BudgetForm; 