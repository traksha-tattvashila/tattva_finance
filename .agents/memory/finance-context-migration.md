---
name: Finance Context Migration
description: How existing user data is migrated and how setup state is determined
---

## Setup Detection

In `FinanceContext.tsx`, on mount:
1. Load `tattva_budgets` from localStorage
2. Run `migrateBudget()` on each (renames `income` → `salaryIncome`)
3. If `!mergedSettings.hasCompletedSetup && migratedBudgets.length > 0` → auto-mark as completed, set budgetStyle=detailed
4. App.tsx: shows Setup wizard only when `!settings.hasCompletedSetup && budgets.length === 0`

**Why:** Users who set up the app before the wizard was added must not be forced through setup again.

**How to apply:** Any new settings fields should have sensible defaults in `defaultSettings` and be merged with `{ ...defaultSettings, ...savedSettings }`.

## migrateBudget() location

`artifacts/tattva-finance/src/services/storage.ts` — handles field rename from legacy `income` field.
