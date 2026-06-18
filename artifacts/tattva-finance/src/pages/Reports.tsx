import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, formatMonth, getCurrentMonthStr } from "@/utils/formatters";
import { exportToCSV, exportToJSON } from "@/utils/export";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import { SpendingPieChart } from "@/components/charts/SpendingPieChart";
import { AllocationBarChart } from "@/components/charts/AllocationBarChart";

export default function Reports() {
  const {
    budgets,
    categories,
    expenses,
    additionalIncomeEntries,
    rollovers,
    getTotalIncome,
    settings,
  } = useFinance();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());

  const monthOptions = React.useMemo(() => {
    return budgets
      .map(b => b.month)
      .sort((a, b) => b.localeCompare(a))
      .map(m => ({ value: m, label: formatMonth(m) }));
  }, [budgets]);

  const budget = budgets.find(b => b.month === selectedMonth);
  const monthCategories = budget ? categories.filter(c => c.budgetId === budget.id) : [];
  const monthExpenses = budget ? expenses.filter(e => e.budgetId === budget.id) : [];
  const monthAdditional = budget
    ? additionalIncomeEntries.filter(e => e.budgetId === budget.id)
    : [];

  const totalIncome = budget ? getTotalIncome(budget) : 0;
  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netSavings = totalIncome - totalSpent;
  const savingsPercent = totalIncome > 0 ? Math.max(0, (netSavings / totalIncome) * 100) : 0;

  // ── Month comparison ──
  const sortedMonths = [...budgets].sort((a, b) => b.month.localeCompare(a.month));
  const currentIndex = sortedMonths.findIndex(b => b.month === selectedMonth);
  const prevBudget = sortedMonths[currentIndex + 1] ?? null;
  const prevExpenses = prevBudget ? expenses.filter(e => e.budgetId === prevBudget.id) : [];
  const prevTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
  const prevIncome = prevBudget ? getTotalIncome(prevBudget) : 0;
  const spendingDelta = prevTotal > 0 ? ((totalSpent - prevTotal) / prevTotal) * 100 : null;

  // ── Category insights ──
  const pieData = monthCategories
    .map(cat => ({
      name: cat.name,
      value: monthExpenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0),
      color: cat.color,
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const barData = monthCategories.map(cat => ({
    name: cat.name,
    allocated: cat.allocatedAmount,
    spent: monthExpenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0),
    color: cat.color,
  }));

  const topSpending = pieData[0] ?? null;

  const daysInMonth = new Date(
    parseInt(selectedMonth.split("-")[0]),
    parseInt(selectedMonth.split("-")[1]),
    0
  ).getDate();
  const avgDailySpend = daysInMonth > 0 ? totalSpent / daysInMonth : 0;

  // Categories over budget
  const overBudgetCats = barData.filter(
    d => d.allocated > 0 && d.spent > d.allocated
  );

  const monthRollover = rollovers.find(r => r.fromMonth === selectedMonth);

  const mostTransactionsCatId =
    monthExpenses.length > 0
      ? Object.entries(
          monthExpenses.reduce((acc: Record<string, number>, e) => {
            acc[e.categoryId] = (acc[e.categoryId] || 0) + 1;
            return acc;
          }, {})
        ).sort((a, b) => b[1] - a[1])[0][0]
      : null;
  const mostTransactionsCat = monthCategories.find(c => c.id === mostTransactionsCatId);

  const handleExportCSV = () => {
    const rows = monthExpenses.map(e => ({
      Date: new Date(e.date).toLocaleDateString(),
      Name: e.name,
      Category: e.categoryName,
      Amount: e.amount,
      Notes: e.notes || "",
    }));
    exportToCSV(`tattva_expenses_${selectedMonth}.csv`, rows);
  };

  const handleExportJSON = () => {
    exportToJSON(`tattva_data_${selectedMonth}.json`, {
      budget,
      categories: monthCategories,
      expenses: monthExpenses,
      additionalIncome: monthAdditional,
      rollover: monthRollover,
    });
  };

  if (monthOptions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="text-5xl mb-2">📊</div>
          <p className="font-medium">No budgets yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Create your first budget in the Planner to view reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + month picker */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[160px] h-9 text-sm" data-testid="select-report-month">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!budget ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Select a month to view reports.</div>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              label="Total Income"
              value={formatCurrency(totalIncome, settings.currencySymbol)}
              icon="💰"
              colorClass="text-primary"
              bg="bg-primary/8"
            />
            <SummaryCard
              label="Total Spent"
              value={formatCurrency(totalSpent, settings.currencySymbol)}
              icon="📤"
              colorClass="text-destructive"
              bg="bg-destructive/8"
            />
            <SummaryCard
              label="Net Savings"
              value={formatCurrency(netSavings, settings.currencySymbol)}
              icon={netSavings >= 0 ? "✅" : "⚠️"}
              colorClass={netSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}
              bg={netSavings >= 0 ? "bg-emerald-500/8" : "bg-destructive/8"}
            />
            <SummaryCard
              label="Savings Rate"
              value={`${savingsPercent.toFixed(1)}%`}
              icon="📈"
              colorClass="text-blue-600 dark:text-blue-400"
              bg="bg-blue-500/8"
            />
          </div>

          {/* ── Month-over-Month Comparison ── */}
          {prevBudget && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-2 pt-4 px-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  vs {formatMonth(prevBudget.month)}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-secondary/60 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Last Month</p>
                    <p className="text-sm font-bold tabular-nums">{formatCurrency(prevTotal, settings.currencySymbol)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">spent</p>
                  </div>
                  <div className="bg-secondary/60 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">This Month</p>
                    <p className="text-sm font-bold tabular-nums">{formatCurrency(totalSpent, settings.currencySymbol)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">spent</p>
                  </div>
                  <div className={`rounded-xl p-3 text-center ${spendingDelta !== null && spendingDelta > 0 ? "bg-destructive/10" : "bg-emerald-500/10"}`}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Change</p>
                    <div className={`flex items-center justify-center gap-1 ${spendingDelta !== null && spendingDelta > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {spendingDelta !== null && spendingDelta > 0
                        ? <TrendingUp className="w-3.5 h-3.5" />
                        : <TrendingDown className="w-3.5 h-3.5" />}
                      <span className="text-sm font-bold">
                        {spendingDelta !== null ? `${Math.abs(spendingDelta).toFixed(0)}%` : "—"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {spendingDelta !== null && spendingDelta > 0 ? "more" : "less"}
                    </p>
                  </div>
                </div>

                {/* Savings rate comparison */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground bg-secondary/40 rounded-xl px-3 py-2">
                  <span>Savings rate:</span>
                  <span className="font-semibold text-foreground">
                    {prevIncome > 0 ? `${Math.max(0, ((prevIncome - prevTotal) / prevIncome) * 100).toFixed(0)}%` : "—"} → {savingsPercent.toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Insights ── */}
          {(overBudgetCats.length > 0 || topSpending) && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-2 pt-4 px-4">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">Insights</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {topSpending && (
                  <InsightItem
                    emoji="🏆"
                    text={`Biggest spend: ${topSpending.name} (${formatCurrency(topSpending.value, settings.currencySymbol)} · ${totalSpent > 0 ? ((topSpending.value / totalSpent) * 100).toFixed(0) : 0}% of total)`}
                  />
                )}
                {mostTransactionsCat && (
                  <InsightItem
                    emoji="🔄"
                    text={`Most transactions: ${mostTransactionsCat.name}`}
                  />
                )}
                {overBudgetCats.map(c => (
                  <InsightItem
                    key={c.name}
                    emoji="⚠️"
                    text={`${c.name} is over budget by ${formatCurrency(c.spent - c.allocated, settings.currencySymbol)}`}
                    isWarn
                  />
                ))}
                <InsightItem
                  emoji="📅"
                  text={`Average daily spend: ${formatCurrency(avgDailySpend, settings.currencySymbol)}`}
                />
                {savingsPercent >= 20 && (
                  <InsightItem emoji="🌟" text={`Excellent! You're saving ${savingsPercent.toFixed(0)}% of your income.`} isGood />
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Income breakdown ── */}
          {(budget.carryForward > 0 || monthAdditional.length > 0) && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Income Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2 text-sm">
                  <IncomeRow label="Salary" value={formatCurrency(budget.salaryIncome, settings.currencySymbol)} />
                  {monthAdditional.map(e => (
                    <IncomeRow
                      key={e.id}
                      label={e.description}
                      value={`+${formatCurrency(e.amount, settings.currencySymbol)}`}
                      colorClass="text-emerald-600 dark:text-emerald-400"
                    />
                  ))}
                  {budget.carryForward > 0 && (
                    <IncomeRow
                      label="Carry Forward"
                      value={`+${formatCurrency(budget.carryForward, settings.currencySymbol)}`}
                      colorClass="text-blue-600 dark:text-blue-400"
                    />
                  )}
                  <div className="flex justify-between pt-2 border-t border-border font-semibold">
                    <span>Total Available</span>
                    <span className="tabular-nums">{formatCurrency(totalIncome, settings.currencySymbol)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Charts ── */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <SpendingPieChart data={pieData} currencySymbol={settings.currencySymbol} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Allocated vs Spent</CardTitle>
              <CardDescription className="text-xs">Budget allocation compared to actual spending per category</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-4">
              <AllocationBarChart data={barData} currencySymbol={settings.currencySymbol} />
            </CardContent>
          </Card>

          {/* ── Highlights + Export ── */}
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Export Data</CardTitle>
                <CardDescription className="text-xs">Download {formatMonth(selectedMonth)} data</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 grid grid-cols-2 gap-3">
                <Button onClick={handleExportCSV} variant="outline" className="h-10 text-sm">
                  <Download className="w-3.5 h-3.5 mr-2" /> CSV
                </Button>
                <Button onClick={handleExportJSON} variant="outline" className="h-10 text-sm">
                  <Download className="w-3.5 h-3.5 mr-2" /> JSON
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* ── Rollover History ── */}
          {rollovers.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Month-End Rollover History</CardTitle>
                </div>
                <CardDescription className="text-xs">How each month's remaining balance was allocated</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="divide-y divide-border/50">
                  {[...rollovers]
                    .sort((a, b) => b.fromMonth.localeCompare(a.fromMonth))
                    .map(r => (
                      <div key={r.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-sm">{formatMonth(r.fromMonth)}</span>
                          <Badge
                            variant={r.remainingBalance >= 0 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            Remaining: {formatCurrency(r.remainingBalance, settings.currencySymbol)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <RolloverStat label="Income" value={formatCurrency(r.totalIncome, settings.currencySymbol)} />
                          <RolloverStat label="Expenses" value={formatCurrency(r.totalExpenses, settings.currencySymbol)} colorClass="text-destructive" />
                          <RolloverStat label="To Savings" value={formatCurrency(r.savingsTransfer, settings.currencySymbol)} colorClass="text-emerald-600 dark:text-emerald-400" />
                          <RolloverStat label="To Investment" value={formatCurrency(r.investmentTransfer, settings.currencySymbol)} colorClass="text-violet-600 dark:text-violet-400" />
                          {r.carryForward > 0 && (
                            <RolloverStat label="Carried Forward" value={formatCurrency(r.carryForward, settings.currencySymbol)} colorClass="text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        {r.note && (
                          <p className="text-xs text-muted-foreground italic mt-2">{r.note}</p>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label, value, icon, colorClass, bg,
}: {
  label: string; value: string; icon: string; colorClass: string; bg: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`flex items-center gap-2 mb-2 ${bg} rounded-lg px-2 py-1.5 w-fit`}>
          <span className="text-base">{icon}</span>
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${colorClass}`}>{label}</span>
        </div>
        <p className={`text-xl font-bold tabular-nums ${colorClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function InsightItem({ emoji, text, isWarn, isGood }: { emoji: string; text: string; isWarn?: boolean; isGood?: boolean }) {
  return (
    <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${
      isWarn ? "bg-amber-500/8 text-amber-700 dark:text-amber-400"
      : isGood ? "bg-emerald-500/8 text-emerald-700 dark:text-emerald-400"
      : "bg-secondary/50"
    }`}>
      <span className="mt-0.5 shrink-0">{emoji}</span>
      <span>{text}</span>
    </div>
  );
}

function IncomeRow({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums font-medium ${colorClass ?? ""}`}>{value}</span>
    </div>
  );
}

function RolloverStat({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="bg-secondary/40 rounded-xl p-2.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`font-semibold text-sm tabular-nums mt-0.5 ${colorClass ?? ""}`}>{value}</p>
    </div>
  );
}
