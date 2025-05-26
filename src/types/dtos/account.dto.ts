import { type ACCOUNT_TYPES, type BALANCE_OPERATIONS } from '../../utils/constants.ts';

export type AccountType = typeof ACCOUNT_TYPES[number];
export type BalanceOperation = typeof BALANCE_OPERATIONS[number];


export interface AccountQueryFiltersDto {
    type?: string;
    name?: string;
    sort?: string;
    fields?: string;
    page?: number;
    limit?: number;
    numericFilters?: string;
    user?: string;
}

export interface CreateAccountDto {
    name: string;
    type: AccountType;
    description?: string;
    isActive?: boolean;
    user?: string;
}

// DTO for updating an existing account
export interface UpdateAccountDto {
    name?: string;
    type?: AccountType;
    description?: string;
    isActive?: boolean;
}

// DTO for admin updates (might include more fields)
export interface UpdateAccountAdminDto extends UpdateAccountDto {
    balance?: number;
    user?: string;
}


// DTO for updating account balance
export interface UpdateBalanceDto {
    amount: number;
    operation: BalanceOperation;
}

// DTO for the response of the updateBalance operation
export interface UpdateBalanceResponseDto {
    balance: number;
    name: string;
    operation: BalanceOperation;
    amount: number;
    timestamp: Date;
}

