import { GenericApiService } from '../base/apiService';
import { Account } from '../../types/account';
import { PaginationData } from '../../types/common';
import { AccountFilters } from '../../types/account.filter';

// Define form data type
export type AccountFormData = {
  name: string;
  type: string;
  description?: string;
};

// Metadata returned from the AccountService
export interface AccountResponse {
  accounts: Account[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Response data type definitions to fix any usage
interface AccountListResponse {
  accounts: Account[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
  nbHits?: number; // backward compatibility
}

interface AccountItemResponse {
  account: Account;
  message?: string;
}

export class AccountService extends GenericApiService<
  Account,
  AccountFormData,
  Partial<AccountFormData>,
  AccountFilters
> {
  private lastPaginationData: PaginationData | null = null;

  constructor() {
    super('accounts');
  }
  
  // Add method to get pagination data
  getPaginationData(): PaginationData | null {
    return this.lastPaginationData;
  }

  // Method to get accounts with pagination
  async getAllPaginated(
    filters: AccountFilters = {}, 
    page: number = 1, 
    limit: number = 10
  ): Promise<AccountResponse> {
    try {
      const params = this.filtersToQueryParams(filters);
      params.page = String(page);
      params.limit = String(limit);
      
      const response = await this.http.get('', { params });
      const data = response.data;
      
      // Store pagination data
      this.lastPaginationData = {
        count: data.count || data.nbHits,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages
      };
      
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  async restore(id: string): Promise<Account> {
    try {
      const response = await this.http.patch(`/${id}/restore`);
      return this.extractItem(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected extractData(responseData: AccountListResponse): Account[] {
    // Store pagination data when it's available
    if (responseData.page !== undefined) {
      this.lastPaginationData = {
        count: responseData.count || responseData.nbHits || 0,
        page: responseData.page,
        limit: responseData.limit,
        totalPages: responseData.totalPages
      };
    }
    return responseData.accounts || [];
  }
  
  protected extractItem(responseData: AccountItemResponse): Account {
    return responseData.account;
  }
  
  protected filtersToQueryParams(filters: AccountFilters): Record<string, string> {
    const params: Record<string, string> = {};
    
    if (filters.type) params.type = filters.type;
    if (filters.name) params.name = filters.name;
    
    return params;
  }
}

// Create a singleton instance
export const accountService = new AccountService();