export enum AccountType {
  CHECKING = "checking",
  SAVINGS = "savings",
  CREDIT = "credit",
  INVESTMENT = "investment",
  CASH = "cash",
  OTHER = "other"
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.CHECKING]: "Checking",
  [AccountType.SAVINGS]: "Savings",
  [AccountType.CREDIT]: "Credit Card",
  [AccountType.INVESTMENT]: "Investment",
  [AccountType.CASH]: "Cash",
  [AccountType.OTHER]: "Other"
};

export const ACCOUNT_TYPES = Object.values(AccountType).map(type => ({
  value: type,
  label: ACCOUNT_TYPE_LABELS[type]
}));

export const API_ENDPOINTS = {
  TRANSACTIONS: '/transactions',
  ACCOUNTS: '/accounts',
  CATEGORIES: '/categories',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout'
  }
};

export const UI_CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50
  },
  MODAL_SIZES: {
    SMALL: 'sm',
    MEDIUM: 'md',
    LARGE: 'lg'
  },
  DATE_FORMATS: {
    DISPLAY: 'MMM dd, yyyy',
    API: 'yyyy-MM-dd'
  }
};
