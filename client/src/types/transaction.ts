import { DateRangeFilter, Entity } from "./common";

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
    imgUrl?: string;
}

export interface TransactionFormData {
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

