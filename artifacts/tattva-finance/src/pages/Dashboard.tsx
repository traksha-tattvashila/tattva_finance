import React, { useState } from "react";
import { Link } from "wouter";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, formatMonth, formatDate } from "@/utils/formatters";
import {
  ArrowRight,
  Wallet,
  TrendingDown,
  PiggyBank,
  Target,
  AlertCircle,
  CirclePlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Dashboard() {
  const {
    currentMonthBudget,
    currentMonthCategories,
    currentMonthExpenses,
    currentMonthAdditionalIncome,
    goals,
    getTotalIncome,
    settings,
  } = useFinance();

  if (!currentMonthBudget) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Wallet className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-1">No budget this month</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Set up your budget for {formatMonth(new Date().toISOString().slice(0, 7))} to start tracking.
          </p>
        </div>
        <Link href="/planner">
          <Button size="lg" className="w-full max-w-xs">
            Set Up Budget <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  const totalIncome = getTotalIncome(currentMonthBudget);
  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const available = totalIncome - totalSpent;
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const isOverspent = totalSpent > totalIncome;
  const spendingPct = totalIncome > 0 ? Math.min((totalSpent / totalIncome) * 100, 100) : 0;

  const recentExpenses = [...currentMonthExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const activeGoals = goals.filter(g => !g.completedAt).slice(0, 3);

  const availableMsg =
    available < 0
      ? "Overspent this month"
      : available < totalIncome * 0.1
      ? "Almost at your limit"
      : available < totalIncome * 0.3
      ? "Spending well"
      : "You're on track";

  return (
    <div className="space-y-5">
      {/* Month label */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{formatMonth(currentMonthBudget.month)}</p>
        {currentMonthBudget.status === "closed" && (
          <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">Month closed</span>
        )}
      </div>

      {isOverspent && (
        <Alert variant="destructive" className="py-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            You've spent {formatCurrency(totalSpent - totalIncome, settings.currencySymbol)} over budget this month.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Hero Card ── */}
      <Card className="bg-primary text-primary-foreground overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-white" />
        </div>
        <CardContent className="p-6 relative">
          <p className="text-sm font-medium opacity-80 mb-1">Available Money</p>
          <p className={`text-4xl font-bold tabular-nums mb-1 ${isOverspent ? "opacity-80" : ""}`}>
            {formatCurrency(available, settings.currencySymbol)}
          </p>
          <p className="text-xs opacity-70">{availableMsg}</p>

          {/* Spending bar */}
          <div className="mt-5 mb-4">
            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOverspent ? "bg-red-300" : "bg-white"}`}
                style={{ width: `${spendingPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs opacity-70 mt-1">
              <span>0</span>
              <span>{formatCurrency(totalIncome, settings.currencySymbol)}</span>
            </div>
          </div>

          {/* Three chips */}
          <div className="grid grid-cols-3 gap-3">
            <StatChip
              label="Available"
              value={formatCurrency(available, settings.currencySymbol)}
              subtle
            />
            <StatChip
              label="Spent"
              value={formatCurrency(totalSpent, settings.currencySymbol)}
              subtle
            />
            <StatChip
              label="Saved"
              value={formatCurrency(totalSaved, settings.currencySymbol)}
              subtle
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Category Overview ── */}
      {currentMonthCategories.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Categories</CardTitle>
            <Link href="/planner">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground px-2">
                Manage <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {currentMonthCategories.map(cat => {
              const spent = currentMonthExpenses
                .filter(e => e.categoryId === cat.id)
                .reduce((sum, e) => sum + e.amount, 0);
              const pct = cat.allocatedAmount > 0 ? Math.min((spent / cat.allocatedAmount) * 100, 100) : 0;
              const isWarn = pct > 80;
              return (
                <div key={cat.id}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums ml-2 shrink-0">
                      {formatCurrency(spent, settings.currencySymbol)} / {formatCurrency(cat.allocatedAmount, settings.currencySymbol)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isWarn ? "hsl(var(--destructive))" : cat.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
            <Link href="/expenses">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground px-2">
                All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recentExpenses.length === 0 ? (
              <div className="text-center py-6">
                <TrendingDown className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No expenses yet</p>
                <p className="text-xs text-muted-foreground">Use the + button to add one</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {recentExpenses.map(e => (
                  <div key={e.id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-medium truncate">{e.name}</p>
                      <p className="text-xs text-muted-foreground">{e.categoryName}</p>
                    </div>
                    <span className="text-sm font-semibold text-destructive tabular-nums shrink-0">
                      -{formatCurrency(e.amount, settings.currencySymbol)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals Snapshot */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Savings Goals</CardTitle>
            <Link href="/goals">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground px-2">
                All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {activeGoals.length === 0 ? (
              <div className="text-center py-6">
                <PiggyBank className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No goals yet</p>
                <Link href="/goals">
                  <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs text-primary">
                    <CirclePlus className="w-3.5 h-3.5 mr-1" /> Create a goal
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {activeGoals.map(g => {
                  const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
                  return (
                    <div key={g.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-sm font-medium truncate mr-2">{g.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatChip({ label, value, subtle }: { label: string; value: string; subtle?: boolean }) {
  return (
    <div className={`rounded-xl p-3 text-center ${subtle ? "bg-white/10" : "bg-white/15"}`}>
      <p className="text-[10px] font-medium opacity-70 mb-0.5 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold tabular-nums leading-tight">{value}</p>
    </div>
  );
}
