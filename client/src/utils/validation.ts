import { TransactionFormData } from '../types/transaction';

export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

export const validateTransactionForm = (formData: TransactionFormData): ValidationErrors<TransactionFormData> => {
  const errors: ValidationErrors<TransactionFormData> = {};
  
  if (formData.amount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }
  
  if (!formData.description.trim()) {
    errors.description = 'Description is required';
  }
  
  if (!formData.category) {
    errors.category = 'Category is required';
  }
  
  if (!formData.account) {
    errors.account = 'Account is required';
  }
  
  return errors;
};