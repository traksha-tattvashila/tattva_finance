# Tattva Finance

A single-user personal finance manager — track income, manage expenses, and build savings goals. No backend, no auth, full localStorage persistence.

## Run & Operate

- `pnpm --filter @workspace/tattva-finance run dev` — Vite dev server (auto-assigned port)
- `pnpm --filter @workspace/tattva-finance run typecheck` — TypeScript check
- `pnpm run typecheck` — Full workspace typecheck

## Stack

- React + Vite + TypeScript + Tailwind CSS v4
- shadcn/ui components (Card, Button, Input, Dialog, Select, Drawer, Switch)
- wouter (routing), framer-motion (transitions), sonner (toasts), recharts (charts)
- vaul (bottom drawer for FAB sheet), next-themes (dark mode)
- uuid, zod (not yet heavily used client-side)
- pnpm workspaces monorepo

## Where things live

```
artifacts/tattva-finance/
  src/
    pages/          Dashboard, Planner, Expenses, Goals, Reports, Settings, Accounts,
                    AdvancedTools, Setup, not-found
    components/
      layout/       Sidebar (desktop), BottomNav (mobile), Layout (page wrapper)
      charts/       SpendingPieChart, AllocationBarChart
      shared/       QuickExpenseSheet (FAB + drawer), ConfirmDialog, EmptyState,
                    CategoryBadge, ProgressBar, StatCard
      ui/           shadcn/ui component library
    context/        FinanceContext.tsx — single source of truth for all state
    services/       storage.ts — localStorage helpers + migrateBudget()
    utils/          formatters.ts (formatCurrency, formatMonth, etc.), export.ts
    types/          finance.ts — all TypeScript types
    index.css       Tailwind v4 CSS variables — brand tokens
  index.html        Google Fonts: Inter + Playfair Display
```

## Architecture decisions

- **localStorage only** — no server, no auth. All data lives in the browser.
- **FinanceContext.tsx** is the single state store — no Redux, no Zustand. All mutations happen through context functions.
- **migrateBudget()** in storage.ts handles the `income → salaryIncome` field rename for existing users.
- **Setup Wizard** gates new users (hasCompletedSetup=false && budgets.length===0). Existing users with data are auto-migrated on first load.
- **Detailed vs Simple budget style** toggled in Settings — hides carry-forward, additional income, accounts for Simple mode users.
- **FAB Quick Expense** (bottom-right `+` button) provides fastest path to logging an expense — never requires navigating to another page.

## Brand System

Primary: `#5B21B6` Royal Purple → `hsl(263, 69%, 42%)`
Background: `#F8F7FC` Lavender White
Dark BG: `#0F0B1A` Deep Purple Night
Text: `#1E1B4B` Indigo Dark
Headings: Playfair Display (serif) — applied via `h1, h2, .font-display` in @layer base
Body: Inter

## localStorage Keys

```
tattva_budgets            MonthlyBudget[]
tattva_categories         Category[]
tattva_expenses           Expense[]
tattva_goals              SavingsGoal[]
tattva_settings           AppSettings
tattva_accounts           Account[]
tattva_account_transfers  AccountTransfer[]
tattva_month_rollovers    MonthRollover[]
tattva_additional_income  AdditionalIncomeEntry[]
```

## Routes

`/` Dashboard · `/planner` Month Planner · `/expenses` Expenses · `/goals` Goals
`/reports` Reports · `/settings` Settings · `/accounts` Accounts · `/advanced` Advanced Tools

## User preferences

- Currency symbol default: ₹ (Indian Rupee)
- App tagline: "Your personal financial companion"
- Brand name: Tattva Finance by Tattvashila
- Bottom nav shows 6 items on mobile; sidebar shows same 6 on desktop

## Gotchas

- Do NOT run `pnpm dev` at workspace root — use `restart_workflow` instead.
- `pnpm --filter @workspace/tattva-finance run typecheck` to verify (not `build`).
- Dark mode is managed via `settings.darkMode` → `forcedTheme` on next-themes ThemeProvider. Changing it in Settings saves immediately.
- `BASE_URL` from `import.meta.env.BASE_URL` is injected by Vite; the wouter router uses it as a base.
- Category names must never be truncated — all category displays use wrapping text, not `truncate`.
- The `h1`/`h2` global rule in `@layer base` applies Playfair Display automatically to all page titles.
