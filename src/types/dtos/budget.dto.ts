export type BudgetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

// DTO for filtering budget queries
export interface BudgetQueryFiltersDto {
    category?: string; // Category ID
    period?: BudgetPeriod;
    startDate?: string; // ISO Date string
    endDate?: string;   // ISO Date string
    sort?: string;
    fields?: string;
    page?: number;
    limit?: number;
    user?: string; // For admin filtering
}

// DTO for creating a new budget
export interface CreateBudgetDto {
    category: string; // Category ID
    amount: number;
    period: BudgetPeriod;
    startDate: string; // ISO Date string
    endDate?: string;  // ISO Date string (required for custom period)
    // user ID will be injected by the service/controller
}

// DTO for updating an existing budget
export interface UpdateBudgetDto {
    category?: string;
    amount?: number;
    period?: BudgetPeriod;
    startDate?: string;
    endDate?: string;
}

// DTO for creating a budget as an admin (includes user)
export interface CreateBudgetAdminDto extends CreateBudgetDto {
    user: string; // User ID
}

// DTO for updating a budget as an admin
export interface UpdateBudgetAdminDto extends UpdateBudgetDto {
    user?: string; // Allow changing the associated user
} 