export interface MonthlyBudget {
  id: string;
  month: string; // "YYYY-MM"
  salaryIncome: number;
  carryForward: number; // auto-populated from previous month rollover
  createdAt: string;
  status: "active" | "closed";
}

export interface AdditionalIncomeEntry {
  id: string;
  description: string;
  amount: number;
  date: string;
  budgetId: string;
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

export type AccountType = "cash" | "bank" | "savings" | "investment" | "emergency";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
}

export interface AccountTransfer {
  id: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: number;
  note?: string;
  date: string;
}

export interface MonthRollover {
  id: string;
  fromMonth: string;
  totalIncome: number;
  totalExpenses: number;
  remainingBalance: number;
  savingsTransfer: number;
  investmentTransfer: number;
  carryForward: number;
  note?: string;
  createdAt: string;
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
