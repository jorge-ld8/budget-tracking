import { GenericApiService } from '../base/apiService';
import { Account } from '../../types/account';

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
}

export const accountService = new AccountService();