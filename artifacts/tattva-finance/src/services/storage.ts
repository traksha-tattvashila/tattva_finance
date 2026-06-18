import { MonthlyBudget } from "@/types/finance";

export const STORAGE_KEYS = {
  BUDGETS: "tattva_budgets",
  CATEGORIES: "tattva_categories",
  EXPENSES: "tattva_expenses",
  GOALS: "tattva_goals",
  SETTINGS: "tattva_settings",
  ACCOUNTS: "tattva_accounts",
  ACCOUNT_TRANSFERS: "tattva_account_transfers",
  MONTH_ROLLOVERS: "tattva_month_rollovers",
  ADDITIONAL_INCOME: "tattva_additional_income",
};

export const storageService = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // silent
    }
  },
};

// Migrate legacy budget format (income → salaryIncome) to current schema
export const migrateBudget = (b: MonthlyBudget & { income?: number }): MonthlyBudget => ({
  id: b.id,
  month: b.month,
  salaryIncome: b.salaryIncome ?? b.income ?? 0,
  carryForward: b.carryForward ?? 0,
  createdAt: b.createdAt,
  status: b.status ?? "active",
});
