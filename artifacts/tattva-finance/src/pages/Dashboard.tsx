import React from "react";
import { Link } from "wouter";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, formatMonth } from "@/utils/formatters";
import {
  ArrowRight,
  TrendingDown,
  PiggyBank,
  Target,
  AlertCircle,
  CirclePlus,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Dashboard() {
  const {
    currentMonthBudget,
    currentMonthCategories,
    currentMonthExpenses,
    goals,
    rollovers,
    getTotalIncome,
    settings,
  } = useFinance();

  if (!currentMonthBudget) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <PiggyBank className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">No budget this month</h2>
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

  // ── Intelligent status message using real data ──
  const prevRates = rollovers.map(r => (r.totalIncome > 0 ? r.totalExpenses / r.totalIncome : 0));
  const avgRate = prevRates.length > 0
    ? prevRates.reduce((s, r) => s + r, 0) / prevRates.length
    : null;
  const currentRate = totalIncome > 0 ? totalSpent / totalIncome : 0;

  const statusMessage = (() => {
    if (isOverspent) return { text: "Over budget — review your spending", icon: "⚠️", ok: false };
    if (currentRate > 0.9) return { text: "Almost at the limit — tread carefully", icon: "🔴", ok: false };
    if (currentRate > 0.75) {
      if (avgRate !== null && currentRate > avgRate * 1.15) return { text: "Spending above your average this month", icon: "📈", ok: false };
      return { text: "Spending is picking up — keep an eye on it", icon: "🟡", ok: null };
    }
    if (avgRate !== null && currentRate < avgRate * 0.9) return { text: "You're spending less than usual — great!", icon: "✨", ok: true };
    if (totalSaved > 0 && goals.some(g => !g.completedAt)) return { text: "Building your savings nicely", icon: "🌱", ok: true };
    if (currentRate < 0.4) return { text: "Excellent start — well within budget", icon: "🎯", ok: true };
    if (currentRate < 0.6) return { text: "You're right on track this month", icon: "✅", ok: true };
    return { text: "Managing well — keep it up", icon: "👍", ok: true };
  })();

  const recentExpenses = [...currentMonthExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const activeGoals = goals.filter(g => !g.completedAt).slice(0, 3);

  return (
    <div className="space-y-5">
      {/* Month + status */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          {formatMonth(currentMonthBudget.month)}
        </p>
        {currentMonthBudget.status === "closed" && (
          <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-medium uppercase tracking-wide">
            Closed
          </span>
        )}
      </div>

      {isOverspent && (
        <Alert variant="destructive" className="py-3 rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            You've spent {formatCurrency(totalSpent - totalIncome, settings.currencySymbol)} over budget.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Premium Hero Card ── */}
      <div
        className="relative overflow-hidden rounded-2xl text-white shadow-lg"
        style={{
          background: "linear-gradient(135deg, #5B21B6 0%, #4C1D95 55%, #3B0764 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-14 -left-8 w-36 h-36 rounded-full bg-white/5" />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full bg-white/5" />

        <div className="relative p-5">
          {/* Status message */}
          <div className="flex items-center gap-1.5 mb-4">
            <span className="text-sm">{statusMessage.icon}</span>
            <span className="text-xs font-medium text-white/75">{statusMessage.text}</span>
          </div>

          {/* Main amount */}
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60 mb-1">
            Available Money
          </p>
          <p className="text-5xl font-bold tabular-nums tracking-tight mb-1 leading-none">
            {formatCurrency(available, settings.currencySymbol)}
          </p>
          <p className="text-xs text-white/50 mb-5">
            of {formatCurrency(totalIncome, settings.currencySymbol)} total income
          </p>

          {/* Spending bar */}
          <div className="mb-4">
            <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${spendingPct}%`,
                  background: isOverspent
                    ? "rgba(255,100,100,0.9)"
                    : spendingPct > 80
                    ? "rgba(251,191,36,0.9)"
                    : "rgba(255,255,255,0.85)",
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span>0%</span>
              <span>{spendingPct.toFixed(0)}% spent</span>
              <span>100%</span>
            </div>
          </div>

          {/* Three chips */}
          <div className="grid grid-cols-3 gap-2.5">
            <HeroChip
              label="Available"
              value={formatCurrency(available, settings.currencySymbol)}
              positive={available >= 0}
            />
            <HeroChip
              label="Spent"
              value={formatCurrency(totalSpent, settings.currencySymbol)}
              neutral
            />
            <HeroChip
              label="Saved"
              value={formatCurrency(totalSaved, settings.currencySymbol)}
              positive
            />
          </div>
        </div>
      </div>

      {/* ── Category Overview ── */}
      {currentMonthCategories.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Budget Categories</CardTitle>
            <Link href="/planner">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground px-2">
                Edit <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3.5">
            {currentMonthCategories.map(cat => {
              const spent = currentMonthExpenses
                .filter(e => e.categoryId === cat.id)
                .reduce((sum, e) => sum + e.amount, 0);
              const pct = cat.allocatedAmount > 0 ? Math.min((spent / cat.allocatedAmount) * 100, 100) : 0;
              const isWarn = pct > 80;
              const isOver = spent > cat.allocatedAmount && cat.allocatedAmount > 0;
              return (
                <div key={cat.id}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-medium flex-1">{cat.name}</span>
                    <span className={`text-xs tabular-nums ${isOver ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                      {formatCurrency(spent, settings.currencySymbol)}
                      {cat.allocatedAmount > 0 && ` / ${formatCurrency(cat.allocatedAmount, settings.currencySymbol)}`}
                    </span>
                  </div>
                  {cat.allocatedAmount > 0 && (
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isWarn ? "hsl(var(--destructive))" : cat.color,
                        }}
                      />
                    </div>
                  )}
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
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
                  <TrendingDown className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">No expenses yet</p>
                <p className="text-xs text-primary font-medium">Tap + to add one</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {recentExpenses.map(e => (
                  <div key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                      style={{ backgroundColor: currentMonthCategories.find(c => c.id === e.categoryId)?.color ?? "hsl(var(--muted))" }}
                    >
                      {e.categoryName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
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
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">No goals yet</p>
                <Link href="/goals">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary mt-1">
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
                        <span className="text-sm font-medium">{g.name}</span>
                        <span className="text-xs font-semibold text-primary tabular-nums">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {formatCurrency(g.currentAmount, settings.currencySymbol)}
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {formatCurrency(g.targetAmount, settings.currencySymbol)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Month trend (only if previous data exists) */}
      {rollovers.length >= 1 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2 pt-4 px-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">This vs Last Month</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {(() => {
              const lastRollover = [...rollovers].sort((a, b) => b.fromMonth.localeCompare(a.fromMonth))[0];
              const lastRate = lastRollover.totalIncome > 0
                ? (lastRollover.totalExpenses / lastRollover.totalIncome * 100)
                : 0;
              const delta = currentRate * 100 - lastRate;
              return (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Last Month</p>
                    <p className="text-lg font-bold tabular-nums">{lastRate.toFixed(0)}%</p>
                    <p className="text-[10px] text-muted-foreground">of income spent</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">This Month</p>
                    <p className="text-lg font-bold tabular-nums">{(currentRate * 100).toFixed(0)}%</p>
                    <div className={`flex items-center justify-center gap-1 text-[10px] font-medium ${delta > 0 ? "text-destructive" : "text-emerald-500"}`}>
                      {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{Math.abs(delta).toFixed(0)}% {delta > 0 ? "more" : "less"}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HeroChip({ label, value, positive, neutral }: { label: string; value: string; positive?: boolean; neutral?: boolean }) {
  return (
    <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-white/55 mb-1">{label}</p>
      <p className="text-sm font-bold tabular-nums leading-tight text-white">{value}</p>
    </div>
  );
}
