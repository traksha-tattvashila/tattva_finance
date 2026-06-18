import React, { createContext, useContext, useEffect, useState } from "react";
import {
  MonthlyBudget,
  Category,
  Expense,
  SavingsGoal,
  AppSettings,
} from "@/types/finance";
import { STORAGE_KEYS, storageService } from "@/services/storage";
import { getCurrentMonthStr } from "@/utils/formatters";
import { v4 as uuidv4 } from "uuid";

interface FinanceContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  budgets: MonthlyBudget[];
  currentMonthBudget: MonthlyBudget | null;
  addBudget: (budget: Omit<MonthlyBudget, "id" | "createdAt">) => MonthlyBudget;
  updateBudget: (id: string, updates: Partial<MonthlyBudget>) => void;
  
  categories: Category[];
  currentMonthCategories: Category[];
  addCategory: (category: Omit<Category, "id">) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  expenses: Expense[];
  currentMonthExpenses: Expense[];
  addExpense: (expense: Omit<Expense, "id" | "date">) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  
  goals: SavingsGoal[];
  addGoal: (goal: Omit<SavingsGoal, "id" | "createdAt" | "completedAt">) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  addFundsToGoal: (id: string, amount: number) => void;

  clearMonthlyExpenses: (month: string) => void;
  importData: (data: any) => void;
  clearAllData: () => void;
}

const defaultSettings: AppSettings = {
  currencySymbol: "₹",
  darkMode: false,
  appName: "Tattva Finance",
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  useEffect(() => {
    // Load from localStorage on mount
    setSettings(storageService.get(STORAGE_KEYS.SETTINGS, defaultSettings));
    setBudgets(storageService.get(STORAGE_KEYS.BUDGETS, []));
    setCategories(storageService.get(STORAGE_KEYS.CATEGORIES, []));
    setExpenses(storageService.get(STORAGE_KEYS.EXPENSES, []));
    setGoals(storageService.get(STORAGE_KEYS.GOALS, []));
    setIsLoaded(true);
  }, []);

  // Save to localStorage when state changes (after initial load)
  useEffect(() => {
    if (isLoaded) {
      storageService.set(STORAGE_KEYS.SETTINGS, settings);
      storageService.set(STORAGE_KEYS.BUDGETS, budgets);
      storageService.set(STORAGE_KEYS.CATEGORIES, categories);
      storageService.set(STORAGE_KEYS.EXPENSES, expenses);
      storageService.set(STORAGE_KEYS.GOALS, goals);
    }
  }, [settings, budgets, categories, expenses, goals, isLoaded]);

  // Derived state
  const currentMonth = getCurrentMonthStr();
  const currentMonthBudget =
    budgets.find((b) => b.month === currentMonth) || null;
  const currentMonthCategories = currentMonthBudget
    ? categories.filter((c) => c.budgetId === currentMonthBudget.id)
    : [];
  const currentMonthExpenses = currentMonthBudget
    ? expenses.filter((e) => e.budgetId === currentMonthBudget.id)
    : [];

  // Settings Actions
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Budget Actions
  const addBudget = (budgetData: Omit<MonthlyBudget, "id" | "createdAt">) => {
    const newBudget: MonthlyBudget = {
      ...budgetData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setBudgets((prev) => [...prev, newBudget]);
    return newBudget;
  };

  const updateBudget = (id: string, updates: Partial<MonthlyBudget>) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  // Category Actions
  const addCategory = (categoryData: Omit<Category, "id">) => {
    const newCategory: Category = { ...categoryData, id: uuidv4() };
    setCategories((prev) => [...prev, newCategory]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    // Also delete associated expenses?
    setExpenses((prev) => prev.filter((e) => e.categoryId !== id));
  };

  // Expense Actions
  const addExpense = (expenseData: Omit<Expense, "id" | "date">) => {
    const newExpense: Expense = {
      ...expenseData,
      id: uuidv4(),
      date: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Goal Actions
  const addGoal = (
    goalData: Omit<SavingsGoal, "id" | "createdAt" | "completedAt">
  ) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    if (newGoal.currentAmount >= newGoal.targetAmount) {
      newGoal.completedAt = new Date().toISOString();
    }
    setGoals((prev) => [...prev, newGoal]);
  };

  const updateGoal = (id: string, updates: Partial<SavingsGoal>) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const updated = { ...g, ...updates };
        if (updated.currentAmount >= updated.targetAmount && !updated.completedAt) {
          updated.completedAt = new Date().toISOString();
        } else if (updated.currentAmount < updated.targetAmount && updated.completedAt) {
          updated.completedAt = undefined;
        }
        return updated;
      })
    );
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addFundsToGoal = (id: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => {
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
  };

  // Data Management
  const clearMonthlyExpenses = (month: string) => {
    const budget = budgets.find((b) => b.month === month);
    if (budget) {
      setExpenses((prev) => prev.filter((e) => e.budgetId !== budget.id));
    }
  };

  const importData = (data: any) => {
    if (data.settings) setSettings(data.settings);
    if (data.budgets) setBudgets(data.budgets);
    if (data.categories) setCategories(data.categories);
    if (data.expenses) setExpenses(data.expenses);
    if (data.goals) setGoals(data.goals);
  };

  const clearAllData = () => {
    setSettings(defaultSettings);
    setBudgets([]);
    setCategories([]);
    setExpenses([]);
    setGoals([]);
    localStorage.clear();
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <FinanceContext.Provider
      value={{
        settings,
        updateSettings,
        budgets,
        currentMonthBudget,
        addBudget,
        updateBudget,
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
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
};
