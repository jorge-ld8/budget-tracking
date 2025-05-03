import { Types } from 'mongoose';

// DTO for querying transactions
export interface TransactionQueryFiltersDto {
    type?: 'income' | 'expense';
    description?: string;
    category?: string; // Category ID
    account?: string;  // Account ID
    startDate?: string; // ISO Date string or YYYY-MM-DD
    endDate?: string;   // ISO Date string or YYYY-MM-DD
    sort?: string;
    fields?: string;
    page?: number;
    limit?: number;
    numericFilters?: string; // e.g., "amount>100"
    user?: string; // User ID (optional, for admin queries)
}

// DTO for creating a new transaction
export interface CreateTransactionDto {
    amount: number;
    type: 'income' | 'expense';
    description: string;
    date?: string | Date; // Allow string or Date object
    category: string; // Category ID
    account: string;  // Account ID
    // imgUrl might be handled separately if coming from file upload vs. body
}

// DTO for updating a transaction
export interface UpdateTransactionDto {
    amount?: number;
    type?: 'income' | 'expense';
    description?: string;
    date?: string | Date;
    category?: string; // Category ID
    account?: string; // Account ID (potentially for admin updates)
    user?: string;    // User ID (potentially for admin updates)
}

// DTO specifically for admin creation (might differ slightly if needed)
// Often combined with CreateTransactionDto using intersections or optional properties
export interface CreateTransactionAdminDto extends CreateTransactionDto {
    user: string; // User ID is required for admin creation
}

// DTO specifically for admin updates (might differ slightly if needed)
// Can extend UpdateTransactionDto if needed
export interface UpdateTransactionAdminDto extends UpdateTransactionDto {
    // Add any admin-specific updatable fields here if necessary
} 