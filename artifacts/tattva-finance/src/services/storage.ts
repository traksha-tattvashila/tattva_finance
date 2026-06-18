export const STORAGE_KEYS = {
  BUDGETS: "tattva_budgets",
  CATEGORIES: "tattva_categories",
  EXPENSES: "tattva_expenses",
  GOALS: "tattva_goals",
  SETTINGS: "tattva_settings",
};

export const storageService = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage`, e);
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage`, e);
    }
  },
};
