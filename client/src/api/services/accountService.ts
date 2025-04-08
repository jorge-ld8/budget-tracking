import { GenericApiService } from '../base/apiService';
import { Account } from '../../types/account';
import { AxiosRequestConfig } from 'axios';

type AccountFormData = Omit<Account, '_id' | 'createdAt' | 'updatedAt' | 'isDeleted'>;

export class AccountService extends GenericApiService<
  Account,
  AccountFormData,
  Partial<AccountFormData>
> {
  constructor() {
    super('accounts');
  }
  
  protected extractData(responseData: any): Account[] {
    return responseData.accounts || [];
  }
  
  protected extractItem(responseData: any): Account {
    return responseData.account;
  }
  
  protected filtersToQueryParams(filters: any): Record<string, string> {
    return filters || {};
  }

  override async getAll(filters?: {}): Promise<Account[]> {
    try {
        const params = filters ? new URLSearchParams(this.filtersToQueryParams(filters)) : undefined;
        const config: AxiosRequestConfig = { params: { ...params, limit: 100 } };
        const response = await this.http.get('', config);
        return this.extractData(response.data);
    } catch (error) {
        throw this.handleError(error);
    }
  }
}

export const accountService = new AccountService();