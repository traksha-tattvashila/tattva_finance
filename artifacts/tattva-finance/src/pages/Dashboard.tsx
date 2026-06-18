import React from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, getCurrentMonthStr } from "@/utils/formatters";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Wallet, TrendingDown, PiggyBank, Receipt, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Dashboard() {
  const { currentMonthBudget, currentMonthCategories, currentMonthExpenses, goals, settings } = useFinance();

  if (!currentMonthBudget) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <EmptyState
          icon={<Wallet className="w-8 h-8" />}
          title="No budget set for this month"
          description={`Set up your budget for ${getCurrentMonthStr()} to start tracking your finances.`}
          actionLabel="Set up Budget"
          actionHref="/budget"
        />
      </div>
    );
  }

  const income = currentMonthBudget.income;
  const totalAllocated = currentMonthCategories.reduce((sum, c) => sum + c.allocatedAmount, 0);
  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = income - totalSpent;
  const totalSavings = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  const isOverspent = totalSpent > income;
  const recentExpenses = [...currentMonthExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {isOverspent && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Overspending Alert</AlertTitle>
          <AlertDescription>
            You have spent more than your total income for this month.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Income" value={income} icon={<Wallet />} />
        <StatCard title="Total Spent" value={totalSpent} icon={<TrendingDown />} />
        <StatCard title="Remaining Balance" value={remaining} icon={<Receipt />} />
        <StatCard title="Total Savings" value={totalSavings} icon={<PiggyBank />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentMonthCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No categories set up yet.</p>
            ) : (
              currentMonthCategories.map(cat => {
                const spent = currentMonthExpenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0);
                const progress = cat.allocatedAmount > 0 ? (spent / cat.allocatedAmount) * 100 : 0;
                const isWarning = progress > 90;

                return (
                  <div key={cat.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(spent, settings.currencySymbol)} / {formatCurrency(cat.allocatedAmount, settings.currencySymbol)}
                      </span>
                    </div>
                    <ProgressBar progress={progress} color={isWarning ? "var(--destructive)" : cat.color} />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No transactions yet.</p>
            ) : (
              <div className="space-y-4">
                {recentExpenses.map(expense => (
                  <div key={expense.id} className="flex justify-between items-center pb-2 border-b border-border/50 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{expense.name}</p>
                      <p className="text-xs text-muted-foreground">{expense.categoryName}</p>
                    </div>
                    <p className="font-medium">
                      -{formatCurrency(expense.amount, settings.currencySymbol)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
