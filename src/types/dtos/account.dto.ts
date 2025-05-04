// src/types/dtos/account.dto.ts

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
    type: string;
    description?: string;
    isActive?: boolean;
    user?: string;
}

// DTO for updating an existing account
export interface UpdateAccountDto {
    name?: string;
    type?: string;
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
    operation: 'add' | 'subtract';
}

// DTO for the response of the updateBalance operation
export interface UpdateBalanceResponseDto {
    balance: number;
    name: string;
    operation: 'add' | 'subtract';
    amount: number;
    timestamp: Date;
}

