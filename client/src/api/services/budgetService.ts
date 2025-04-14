import { GenericApiService } from '../base/apiService';
import { Budget, BudgetFormData } from '../../types/budget';
import { PaginationData } from '../../types/common';
import { BudgetFilters } from '../../types/budget.filter';

// Metadata returned from the BudgetService
export interface BudgetResponse {
  budgets: Budget[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Response data type definitions to fix any usage
interface BudgetListResponse {
  budgets: Budget[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface BudgetItemResponse {
  budget: Budget;
  message?: string;
}

export class BudgetService extends GenericApiService<
  Budget,
  BudgetFormData,
  Partial<BudgetFormData>,
  BudgetFilters
> {
  private lastPaginationData: PaginationData | null = null;

  constructor() {
    super('budgets');
  }
  
  // Add method to get pagination data
  getPaginationData(): PaginationData | null {
    return this.lastPaginationData;
  }

  // Method to get budgets with pagination
  async getAllPaginated(
    filters: BudgetFilters = {}, 
    page: number = 1, 
    limit: number = 10
  ): Promise<BudgetResponse> {
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
  
  async restore(id: string): Promise<Budget> {
    try {
      const response = await this.http.patch(`/${id}/restore`);
      return this.extractItem(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get budgets by period (daily, weekly, monthly, yearly)
  async getByPeriod(period: string): Promise<Budget[]> {
    try {
      const response = await this.http.get(`/period/${period}`);
      return response.data.budgets || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get currently active budgets
  async getCurrentBudgets(): Promise<Budget[]> {
    try {
      const response = await this.http.get('/current');
      return response.data.budgets || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get budgets by category type (income or expense)
  async getByCategoryType(type: string): Promise<Budget[]> {
    try {
      const response = await this.http.get(`/category-type/${type}`);
      return response.data.budgets || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected extractData(responseData: BudgetListResponse): Budget[] {
    // Store pagination data when it's available
    if (responseData.page !== undefined) {
      this.lastPaginationData = {
        count: responseData.count,
        page: responseData.page,
        limit: responseData.limit,
        totalPages: responseData.totalPages
      };
    }
    return responseData.budgets || [];
  }
  
  protected extractItem(responseData: BudgetItemResponse): Budget {
    return responseData.budget;
  }
  
  protected filtersToQueryParams(filters: BudgetFilters): Record<string, string> {
    const params: Record<string, string> = {};
    
    if (filters.period) params.period = filters.period;
    if (filters.category) params.category = filters.category;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    
    return params;
  }
}

// Create a singleton instance
export const budgetService = new BudgetService(); 