import { DateRangeFilter, Entity, EntityFormData } from "./common";

export enum TransactionType {
    Income = 'income',
    Expense = 'expense'
}

export interface Transaction extends Entity {
    amount: number;
    type: TransactionType;
    description: string;
    date: string;
    category: string;
    account: string;
    user: string;
}

export interface TransactionFormData extends EntityFormData {
    amount: number;
    type: TransactionType;
    description: string;
    date: string;
    category: string;
    account: string;
}

export interface TransactionFilters extends DateRangeFilter {
    type?: TransactionType | '';
    category?: string;
    account?: string;
}

export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

