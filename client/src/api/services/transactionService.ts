import { GenericApiService } from '../base/apiService';
import { Transaction, TransactionFormData, TransactionFilters } from '../../types/transaction';
import { PaginationData } from '../../types/common';

// Metadata returned from the TransactionService
export interface TransactionResponse {
  transactions: Transaction[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class TransactionService extends GenericApiService<
  Transaction,
  TransactionFormData,
  Partial<TransactionFormData>,
  TransactionFilters
> {
  private lastPaginationData: PaginationData | null = null;

  constructor() {
    super('transactions');
  }
  
  // Add method to get pagination data
  getPaginationData(): PaginationData | null {
    return this.lastPaginationData;
  }

  // Method to get transactions with pagination
  async getAllPaginated(
    filters: TransactionFilters = {}, 
    page: number = 1, 
    limit: number = 10
  ): Promise<TransactionResponse> {
    try {
      const params = this.filtersToQueryParams(filters);
      params.page = String(page);
      params.limit = String(limit);
      
      const response = await this.http.get('', { params });
      const data = response.data;
      
      // Store pagination data
      this.lastPaginationData = {
        count: data.count,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages
      };
      
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
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
    // Store pagination data when it's available
    if (responseData.page !== undefined) {
      this.lastPaginationData = {
        count: responseData.count,
        page: responseData.page,
        limit: responseData.limit,
        totalPages: responseData.totalPages
      };
    }
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
