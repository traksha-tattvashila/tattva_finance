import React, { createContext, useContext, useEffect, useState } from "react";
import {
  MonthlyBudget,
  AdditionalIncomeEntry,
  Category,
  Expense,
  Account,
  AccountTransfer,
  MonthRollover,
  SavingsGoal,
  AppSettings,
} from "@/types/finance";
import { STORAGE_KEYS, storageService, migrateBudget } from "@/services/storage";
import { getCurrentMonthStr } from "@/utils/formatters";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_ACCOUNTS: Account[] = [
  { id: "acc-cash", name: "Cash", type: "cash", balance: 0, color: "#f59e0b" },
  { id: "acc-bank", name: "Bank", type: "bank", balance: 0, color: "#3b82f6" },
  { id: "acc-savings", name: "Savings", type: "savings", balance: 0, color: "#22c55e" },
  { id: "acc-investment", name: "Investment", type: "investment", balance: 0, color: "#8b5cf6" },
  { id: "acc-emergency", name: "Emergency Fund", type: "emergency", balance: 0, color: "#ef4444" },
];

const defaultSettings: AppSettings = {
  currencySymbol: "₹",
  darkMode: false,
  appName: "Tattva Finance",
  hasCompletedSetup: false,
  budgetStyle: "simple",
};

interface CloseMonthOptions {
  savingsTransfer: number;
  investmentTransfer: number;
  carryForward: number;
  note?: string;
}

interface FinanceContextType {
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;

  budgets: MonthlyBudget[];
  currentMonthBudget: MonthlyBudget | null;
  addBudget: (data: { month: string; salaryIncome: number }) => MonthlyBudget;
  updateBudget: (id: string, updates: Partial<MonthlyBudget>) => void;

  additionalIncomeEntries: AdditionalIncomeEntry[];
  currentMonthAdditionalIncome: AdditionalIncomeEntry[];
  addAdditionalIncome: (data: Omit<AdditionalIncomeEntry, "id" | "date">) => void;
  deleteAdditionalIncome: (id: string) => void;
  getAdditionalIncomeTotal: (budgetId: string) => number;
  getTotalIncome: (budget: MonthlyBudget) => number;

  categories: Category[];
  currentMonthCategories: Category[];
  addCategory: (c: Omit<Category, "id">) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  expenses: Expense[];
  currentMonthExpenses: Expense[];
  addExpense: (e: Omit<Expense, "id" | "date">) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  accounts: Account[];
  addAccount: (a: Omit<Account, "id">) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;

  accountTransfers: AccountTransfer[];
  transferBetweenAccounts: (fromId: string, toId: string, amount: number, note?: string) => void;

  rollovers: MonthRollover[];
  closeMonth: (budgetId: string, opts: CloseMonthOptions) => void;

  goals: SavingsGoal[];
  addGoal: (g: Omit<SavingsGoal, "id" | "createdAt" | "completedAt">) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  addFundsToGoal: (id: string, amount: number) => void;

  clearMonthlyExpenses: (month: string) => void;
  importData: (data: unknown) => void;
  clearAllData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [additionalIncomeEntries, setAdditionalIncomeEntries] = useState<AdditionalIncomeEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTransfers, setAccountTransfers] = useState<AccountTransfer[]>([]);
  const [rollovers, setRollovers] = useState<MonthRollover[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  useEffect(() => {
    const rawBudgets = storageService.get<(MonthlyBudget & { income?: number })[]>(STORAGE_KEYS.BUDGETS, []);
    const migratedBudgets = rawBudgets.map(migrateBudget);
    setBudgets(migratedBudgets);

    const savedSettings = storageService.get<Partial<AppSettings>>(STORAGE_KEYS.SETTINGS, {});
    const mergedSettings: AppSettings = { ...defaultSettings, ...savedSettings };

    // Auto-mark setup complete for existing users who already have data
    if (!mergedSettings.hasCompletedSetup && migratedBudgets.length > 0) {
      mergedSettings.hasCompletedSetup = true;
      mergedSettings.budgetStyle = "detailed"; // existing users get detailed mode
    }
    setSettings(mergedSettings);

    setAdditionalIncomeEntries(storageService.get(STORAGE_KEYS.ADDITIONAL_INCOME, []));
    setCategories(storageService.get(STORAGE_KEYS.CATEGORIES, []));
    setExpenses(storageService.get(STORAGE_KEYS.EXPENSES, []));
    setGoals(storageService.get(STORAGE_KEYS.GOALS, []));
    setRollovers(storageService.get(STORAGE_KEYS.MONTH_ROLLOVERS, []));
    setAccountTransfers(storageService.get(STORAGE_KEYS.ACCOUNT_TRANSFERS, []));

    const savedAccounts = storageService.get<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
    setAccounts(savedAccounts.length > 0 ? savedAccounts : DEFAULT_ACCOUNTS);

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    storageService.set(STORAGE_KEYS.SETTINGS, settings);
    storageService.set(STORAGE_KEYS.BUDGETS, budgets);
    storageService.set(STORAGE_KEYS.ADDITIONAL_INCOME, additionalIncomeEntries);
    storageService.set(STORAGE_KEYS.CATEGORIES, categories);
    storageService.set(STORAGE_KEYS.EXPENSES, expenses);
    storageService.set(STORAGE_KEYS.GOALS, goals);
    storageService.set(STORAGE_KEYS.ACCOUNTS, accounts);
    storageService.set(STORAGE_KEYS.ACCOUNT_TRANSFERS, accountTransfers);
    storageService.set(STORAGE_KEYS.MONTH_ROLLOVERS, rollovers);
  }, [settings, budgets, additionalIncomeEntries, categories, expenses, goals, accounts, accountTransfers, rollovers, isLoaded]);

  // Derived state
  const currentMonth = getCurrentMonthStr();
  const currentMonthBudget = budgets.find(b => b.month === currentMonth) || null;
  const currentMonthCategories = currentMonthBudget
    ? categories.filter(c => c.budgetId === currentMonthBudget.id)
    : [];
  const currentMonthExpenses = currentMonthBudget
    ? expenses.filter(e => e.budgetId === currentMonthBudget.id)
    : [];
  const currentMonthAdditionalIncome = currentMonthBudget
    ? additionalIncomeEntries.filter(e => e.budgetId === currentMonthBudget.id)
    : [];

  const getAdditionalIncomeTotal = (budgetId: string) =>
    additionalIncomeEntries
      .filter(e => e.budgetId === budgetId)
      .reduce((sum, e) => sum + e.amount, 0);

  const getTotalIncome = (budget: MonthlyBudget) =>
    budget.salaryIncome + getAdditionalIncomeTotal(budget.id) + budget.carryForward;

  const getNextMonthStr = (month: string): string => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  // ── Settings ──
  const updateSettings = (s: Partial<AppSettings>) =>
    setSettings(prev => ({ ...prev, ...s }));

  // ── Budgets ──
  const addBudget = (data: { month: string; salaryIncome: number }): MonthlyBudget => {
    const prevMonth = (() => {
      const [y, m] = data.month.split("-").map(Number);
      const d = new Date(y, m - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    })();
    const prevRollover = rollovers.find(r => r.fromMonth === prevMonth);
    const carryForward = prevRollover?.carryForward ?? 0;

    const newBudget: MonthlyBudget = {
      id: uuidv4(),
      month: data.month,
      salaryIncome: data.salaryIncome,
      carryForward,
      createdAt: new Date().toISOString(),
      status: "active",
    };
    setBudgets(prev => [...prev, newBudget]);
    return newBudget;
  };

  const updateBudget = (id: string, updates: Partial<MonthlyBudget>) =>
    setBudgets(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)));

  // ── Additional Income ──
  const addAdditionalIncome = (data: Omit<AdditionalIncomeEntry, "id" | "date">) => {
    const entry: AdditionalIncomeEntry = { ...data, id: uuidv4(), date: new Date().toISOString() };
    setAdditionalIncomeEntries(prev => [entry, ...prev]);
  };

  const deleteAdditionalIncome = (id: string) =>
    setAdditionalIncomeEntries(prev => prev.filter(e => e.id !== id));

  // ── Categories ──
  const addCategory = (c: Omit<Category, "id">) =>
    setCategories(prev => [...prev, { ...c, id: uuidv4() }]);

  const updateCategory = (id: string, updates: Partial<Category>) =>
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setExpenses(prev => prev.filter(e => e.categoryId !== id));
  };

  // ── Expenses ──
  const addExpense = (e: Omit<Expense, "id" | "date">) =>
    setExpenses(prev => [{ ...e, id: uuidv4(), date: new Date().toISOString() }, ...prev]);

  const updateExpense = (id: string, updates: Partial<Expense>) =>
    setExpenses(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));

  const deleteExpense = (id: string) =>
    setExpenses(prev => prev.filter(e => e.id !== id));

  // ── Accounts ──
  const addAccount = (a: Omit<Account, "id">) =>
    setAccounts(prev => [...prev, { ...a, id: uuidv4() }]);

  const updateAccount = (id: string, updates: Partial<Account>) =>
    setAccounts(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));

  // ── Transfers ──
  const transferBetweenAccounts = (fromId: string, toId: string, amount: number, note?: string) => {
    const from = accounts.find(a => a.id === fromId);
    const to = accounts.find(a => a.id === toId);
    if (!from || !to) return;

    setAccounts(prev =>
      prev.map(a => {
        if (a.id === fromId) return { ...a, balance: a.balance - amount };
        if (a.id === toId) return { ...a, balance: a.balance + amount };
        return a;
      })
    );

    const transfer: AccountTransfer = {
      id: uuidv4(),
      fromAccountId: fromId,
      fromAccountName: from.name,
      toAccountId: toId,
      toAccountName: to.name,
      amount,
      note,
      date: new Date().toISOString(),
    };
    setAccountTransfers(prev => [transfer, ...prev]);
  };

  // ── Close Month ──
  const closeMonth = (budgetId: string, opts: CloseMonthOptions) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) return;

    const additionalTotal = getAdditionalIncomeTotal(budgetId);
    const totalIncome = budget.salaryIncome + additionalTotal + budget.carryForward;
    const totalExpenses = expenses
      .filter(e => e.budgetId === budgetId)
      .reduce((sum, e) => sum + e.amount, 0);
    const remainingBalance = totalIncome - totalExpenses;

    const rollover: MonthRollover = {
      id: uuidv4(),
      fromMonth: budget.month,
      totalIncome,
      totalExpenses,
      remainingBalance,
      savingsTransfer: opts.savingsTransfer,
      investmentTransfer: opts.investmentTransfer,
      carryForward: opts.carryForward,
      note: opts.note,
      createdAt: new Date().toISOString(),
    };
    setRollovers(prev => [...prev, rollover]);

    if (opts.savingsTransfer > 0 || opts.investmentTransfer > 0) {
      setAccounts(prev =>
        prev.map(a => {
          if (a.type === "savings" && opts.savingsTransfer > 0)
            return { ...a, balance: a.balance + opts.savingsTransfer };
          if (a.type === "investment" && opts.investmentTransfer > 0)
            return { ...a, balance: a.balance + opts.investmentTransfer };
          return a;
        })
      );
    }

    setBudgets(prev => prev.map(b => (b.id === budgetId ? { ...b, status: "closed" } : b)));

    if (opts.carryForward > 0) {
      const nextMonth = getNextMonthStr(budget.month);
      setBudgets(prev =>
        prev.map(b =>
          b.month === nextMonth ? { ...b, carryForward: b.carryForward + opts.carryForward } : b
        )
      );
    }
  };

  // ── Goals ──
  const addGoal = (g: Omit<SavingsGoal, "id" | "createdAt" | "completedAt">) => {
    const newGoal: SavingsGoal = { ...g, id: uuidv4(), createdAt: new Date().toISOString() };
    if (newGoal.currentAmount >= newGoal.targetAmount) {
      newGoal.completedAt = new Date().toISOString();
    }
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (id: string, updates: Partial<SavingsGoal>) =>
    setGoals(prev =>
      prev.map(g => {
        if (g.id !== id) return g;
        const updated = { ...g, ...updates };
        if (updated.currentAmount >= updated.targetAmount && !updated.completedAt)
          updated.completedAt = new Date().toISOString();
        else if (updated.currentAmount < updated.targetAmount && updated.completedAt)
          updated.completedAt = undefined;
        return updated;
      })
    );

  const deleteGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));

  const addFundsToGoal = (id: string, amount: number) =>
    setGoals(prev =>
      prev.map(g => {
        if (g.id !== id) return g;
        const newAmount = g.currentAmount + amount;
        return {
          ...g,
          currentAmount: newAmount,
          completedAt:
            newAmount >= g.targetAmount && !g.completedAt
              ? new Date().toISOString()
              : g.completedAt,
        };
      })
    );

  // ── Data Management ──
  const clearMonthlyExpenses = (month: string) => {
    const budget = budgets.find(b => b.month === month);
    if (budget) setExpenses(prev => prev.filter(e => e.budgetId !== budget.id));
  };

  const importData = (data: unknown) => {
    const d = data as Record<string, unknown>;
    if (d.settings) setSettings({ ...defaultSettings, ...(d.settings as Partial<AppSettings>) });
    if (d.budgets) setBudgets((d.budgets as (MonthlyBudget & { income?: number })[]).map(migrateBudget));
    if (d.additionalIncomeEntries) setAdditionalIncomeEntries(d.additionalIncomeEntries as AdditionalIncomeEntry[]);
    if (d.categories) setCategories(d.categories as Category[]);
    if (d.expenses) setExpenses(d.expenses as Expense[]);
    if (d.goals) setGoals(d.goals as SavingsGoal[]);
    if (d.accounts) setAccounts(d.accounts as Account[]);
    if (d.accountTransfers) setAccountTransfers(d.accountTransfers as AccountTransfer[]);
    if (d.rollovers) setRollovers(d.rollovers as MonthRollover[]);
  };

  const clearAllData = () => {
    setSettings(defaultSettings);
    setBudgets([]);
    setAdditionalIncomeEntries([]);
    setCategories([]);
    setExpenses([]);
    setGoals([]);
    setAccounts(DEFAULT_ACCOUNTS);
    setAccountTransfers([]);
    setRollovers([]);
    localStorage.clear();
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  return (
    <FinanceContext.Provider
      value={{
        settings,
        updateSettings,
        budgets,
        currentMonthBudget,
        addBudget,
        updateBudget,
        additionalIncomeEntries,
        currentMonthAdditionalIncome,
        addAdditionalIncome,
        deleteAdditionalIncome,
        getAdditionalIncomeTotal,
        getTotalIncome,
        categories,
        currentMonthCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        expenses,
        currentMonthExpenses,
        addExpense,
        updateExpense,
        deleteExpense,
        accounts,
        addAccount,
        updateAccount,
        accountTransfers,
        transferBetweenAccounts,
        rollovers,
        closeMonth,
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        addFundsToGoal,
        clearMonthlyExpenses,
        importData,
        clearAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within a FinanceProvider");
  return ctx;
};
