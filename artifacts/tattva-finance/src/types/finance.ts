export interface MonthlyBudget {
  id: string;
  month: string;
  income: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  allocatedAmount: number;
  color: string;
  budgetId: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  notes?: string;
  date: string;
  budgetId: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
  completedAt?: string;
}

export interface AppSettings {
  currencySymbol: string;
  darkMode: boolean;
  appName: string;
}
