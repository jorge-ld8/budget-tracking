import { GenericApiService } from '../base/apiService';
import { Transaction, TransactionFormData, TransactionFilters } from '../../types/transaction';

export class TransactionService extends GenericApiService<
  Transaction,
  TransactionFormData,
  Partial<TransactionFormData>,
  TransactionFilters
> {
  constructor() {
    super('transactions');
  }
  
  async restore(id: string): Promise<Transaction> {
    try {
      const response = await this.http.patch(`/${id}/restore`);
      return this.extractItem(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  protected extractData(responseData: any): Transaction[] {
    return responseData.transactions || [];
  }
  
  protected extractItem(responseData: any): Transaction {
    return responseData.transaction;
  }
  
  protected filtersToQueryParams(filters: TransactionFilters): Record<string, string> {
    const params: Record<string, string> = {};
    
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.type) params.type = filters.type;
    if (filters.category) params.category = filters.category;
    if (filters.account) params.account = filters.account;
    
    return params;
  }
}

// Create a singleton instance
export const transactionService = new TransactionService();
