import React from "react";
import { Link } from "wouter";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, formatMonth } from "@/utils/formatters";
import { ProgressBar } from "@/components/shared/ProgressBar";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  AlertCircle,
  ArrowRight,
  Landmark,
  RefreshCw,
  CirclePlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const {
    currentMonthBudget,
    currentMonthCategories,
    currentMonthExpenses,
    currentMonthAdditionalIncome,
    accounts,
    getTotalIncome,
    getAdditionalIncomeTotal,
    settings,
  } = useFinance();

  if (!currentMonthBudget) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">No budget for this month</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Set up your budget for {formatMonth(new Date().toISOString().slice(0, 7))} to start tracking your finances.
              </p>
            </div>
            <Link href="/budget">
              <Button data-testid="button-setup-budget">
                Set Up Budget <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalIncome = getTotalIncome(currentMonthBudget);
  const additionalTotal = getAdditionalIncomeTotal(currentMonthBudget.id);
  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBalance = totalIncome - totalSpent;
  const isOverspent = totalSpent > totalIncome;

  const recentExpenses = [...currentMonthExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const totalAccountBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const spendingRate = totalIncome > 0 ? (totalSpent / totalIncome) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{formatMonth(currentMonthBudget.month)}</p>
        </div>
        {currentMonthBudget.status === "closed" && (
          <Badge variant="secondary" className="text-xs">Month Closed</Badge>
        )}
      </div>

      {isOverspent && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Overspending Alert</AlertTitle>
          <AlertDescription>
            You have spent {formatCurrency(totalSpent - totalIncome, settings.currencySymbol)} more than your available budget this month.
          </AlertDescription>
        </Alert>
      )}

      {/* Primary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile
          label="Total Available"
          value={formatCurrency(totalIncome, settings.currencySymbol)}
          icon={<Wallet className="w-4 h-4" />}
          color="text-primary"
          sub={`Salary + ${additionalTotal > 0 ? "extras + " : ""}carry fwd`}
        />
        <StatTile
          label="Total Spent"
          value={formatCurrency(totalSpent, settings.currencySymbol)}
          icon={<TrendingDown className="w-4 h-4" />}
          color="text-destructive"
          sub={`${spendingRate.toFixed(0)}% of budget`}
        />
        <StatTile
          label="Remaining"
          value={formatCurrency(remainingBalance, settings.currencySymbol)}
          icon={<TrendingUp className="w-4 h-4" />}
          color={remainingBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}
          sub={remainingBalance >= 0 ? "Available to spend" : "Over budget"}
        />
        <StatTile
          label="Net Worth (Accounts)"
          value={formatCurrency(totalAccountBalance, settings.currencySymbol)}
          icon={<PiggyBank className="w-4 h-4" />}
          color="text-violet-600 dark:text-violet-400"
          sub="All accounts combined"
        />
      </div>

      {/* Income breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Income Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <BreakdownItem
              label="Salary"
              value={formatCurrency(currentMonthBudget.salaryIncome, settings.currencySymbol)}
              icon={<Wallet className="w-4 h-4 text-primary" />}
            />
            <BreakdownItem
              label="Additional Income"
              value={formatCurrency(additionalTotal, settings.currencySymbol)}
              icon={<CirclePlus className="w-4 h-4 text-emerald-500" />}
              sub={`${currentMonthAdditionalIncome.length} entr${currentMonthAdditionalIncome.length === 1 ? "y" : "ies"}`}
            />
            <BreakdownItem
              label="Carry Forward"
              value={formatCurrency(currentMonthBudget.carryForward, settings.currencySymbol)}
              icon={<RefreshCw className="w-4 h-4 text-blue-500" />}
              sub="From last month"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category allocation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Category Allocation</CardTitle>
            <Link href="/budget">
              <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground">
                Manage <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentMonthCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No categories set up yet.
              </p>
            ) : (
              currentMonthCategories.map(cat => {
                const spent = currentMonthExpenses
                  .filter(e => e.categoryId === cat.id)
                  .reduce((sum, e) => sum + e.amount, 0);
                const progress = cat.allocatedAmount > 0 ? (spent / cat.allocatedAmount) * 100 : 0;
                const isWarning = progress > 80;
                return (
                  <div key={cat.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {formatCurrency(spent, settings.currencySymbol)} / {formatCurrency(cat.allocatedAmount, settings.currencySymbol)}
                      </span>
                    </div>
                    <ProgressBar
                      progress={progress}
                      color={isWarning ? "var(--destructive)" : cat.color}
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <Link href="/expenses">
              <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No transactions yet.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {recentExpenses.map(expense => (
                  <div key={expense.id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{expense.name}</p>
                      <p className="text-xs text-muted-foreground">{expense.categoryName}</p>
                    </div>
                    <span className="font-semibold text-destructive tabular-nums text-sm">
                      -{formatCurrency(expense.amount, settings.currencySymbol)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accounts snapshot */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Accounts</CardTitle>
          <Link href="/accounts">
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground">
              Manage <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {accounts.map(account => (
              <div
                key={account.id}
                className="flex flex-col gap-1 p-3 rounded-lg bg-secondary/50"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: account.color }}
                  />
                  <span className="text-xs text-muted-foreground truncate">{account.name}</span>
                </div>
                <span className="font-bold text-sm tabular-nums">
                  {formatCurrency(account.balance, settings.currencySymbol)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={color}>{icon}</span>
          <span className="text-xs text-muted-foreground leading-tight">{label}</span>
        </div>
        <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function BreakdownItem({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40">
      <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}
