import { Entity } from "./common";
import { Category } from "./category";

export enum BudgetPeriod {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly"
}

export const BUDGET_PERIOD_LABELS: Record<BudgetPeriod, string> = {
  [BudgetPeriod.DAILY]: "Daily",
  [BudgetPeriod.WEEKLY]: "Weekly",
  [BudgetPeriod.MONTHLY]: "Monthly",
  [BudgetPeriod.YEARLY]: "Yearly"
};

export const BUDGET_PERIODS = Object.values(BudgetPeriod).map(period => ({
    value: period,
    label: BUDGET_PERIOD_LABELS[period]
}));

export interface Budget extends Entity {
  amount: number;
  period: BudgetPeriod;
  category: string;
  startDate: string;
  endDate?: string;
  isRecurring: boolean;
  categoryDetails?: Category;
}

export interface BudgetFormData {
  amount: number;
  period: BudgetPeriod;
  category: string;
  startDate: string;
  endDate?: string;
  isRecurring?: boolean;
} 