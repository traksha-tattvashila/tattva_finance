import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, formatMonth, getCurrentMonthStr } from "@/utils/formatters";
import { exportToCSV, exportToJSON } from "@/utils/export";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { SpendingPieChart } from "@/components/charts/SpendingPieChart";
import { AllocationBarChart } from "@/components/charts/AllocationBarChart";

export default function Reports() {
  const { budgets, categories, expenses, additionalIncomeEntries, rollovers, getTotalIncome, settings } = useFinance();
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
  const monthAdditional = budget ? additionalIncomeEntries.filter(e => e.budgetId === budget.id) : [];

  const totalIncome = budget ? getTotalIncome(budget) : 0;
  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netSavings = totalIncome - totalSpent;
  const savingsPercent = totalIncome > 0 ? Math.max(0, (netSavings / totalIncome) * 100) : 0;

  const pieData = monthCategories
    .map(cat => ({
      name: cat.name,
      value: monthExpenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0),
      color: cat.color,
    }))
    .filter(d => d.value > 0);

  const barData = monthCategories.map(cat => ({
    name: cat.name,
    allocated: cat.allocatedAmount,
    spent: monthExpenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0),
    color: cat.color,
  }));

  const topSpending = [...pieData].sort((a, b) => b.value - a.value)[0];
  const mostTransactionsCatId = monthExpenses.length > 0
    ? Object.entries(
        monthExpenses.reduce((acc: Record<string, number>, e) => {
          acc[e.categoryId] = (acc[e.categoryId] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0][0]
    : null;
  const mostTransactionsCat = monthCategories.find(c => c.id === mostTransactionsCatId);
  const daysInMonth = new Date(
    parseInt(selectedMonth.split("-")[0]),
    parseInt(selectedMonth.split("-")[1]),
    0
  ).getDate();
  const avgDailySpend = daysInMonth > 0 ? totalSpent / daysInMonth : 0;

  // Rollover for selected month
  const monthRollover = rollovers.find(r => r.fromMonth === selectedMonth);

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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h1>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground border border-dashed border-border rounded-xl text-sm">
          No budgets created yet. Set up a budget to view reports.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h1>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-report-month">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!budget ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Select a month to view reports.</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <SummaryCard
              label="Total Income"
              value={formatCurrency(totalIncome, settings.currencySymbol)}
              icon={<Wallet className="w-4 h-4" />}
              color="text-primary"
            />
            <SummaryCard
              label="Total Expenses"
              value={formatCurrency(totalSpent, settings.currencySymbol)}
              icon={<TrendingDown className="w-4 h-4" />}
              color="text-destructive"
            />
            <SummaryCard
              label="Net Savings"
              value={formatCurrency(netSavings, settings.currencySymbol)}
              icon={<TrendingUp className="w-4 h-4" />}
              color={netSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}
            />
            <SummaryCard
              label="Savings Rate"
              value={`${savingsPercent.toFixed(1)}%`}
              icon={<RefreshCw className="w-4 h-4" />}
              color="text-blue-600 dark:text-blue-400"
            />
          </div>

          {/* Income breakdown for the month */}
          {(budget.carryForward > 0 || monthAdditional.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Income Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salary</span>
                    <span className="tabular-nums font-medium">{formatCurrency(budget.salaryIncome, settings.currencySymbol)}</span>
                  </div>
                  {monthAdditional.map(e => (
                    <div key={e.id} className="flex justify-between">
                      <span className="text-muted-foreground">{e.description}</span>
                      <span className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">+{formatCurrency(e.amount, settings.currencySymbol)}</span>
                    </div>
                  ))}
                  {budget.carryForward > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Carry Forward</span>
                      <span className="tabular-nums font-medium text-blue-600 dark:text-blue-400">+{formatCurrency(budget.carryForward, settings.currencySymbol)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border font-semibold">
                    <span>Total Available</span>
                    <span className="tabular-nums">{formatCurrency(totalIncome, settings.currencySymbol)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <SpendingPieChart data={pieData} currencySymbol={settings.currencySymbol} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Allocated vs Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <AllocationBarChart data={barData} currencySymbol={settings.currencySymbol} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Month Highlights</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <HighlightItem label="Top Spending" value={topSpending?.name ?? "—"} sub={topSpending ? formatCurrency(topSpending.value, settings.currencySymbol) : ""} />
                <HighlightItem label="Most Transactions" value={mostTransactionsCat?.name ?? "—"} />
                <HighlightItem label="Avg Daily Spend" value={formatCurrency(avgDailySpend, settings.currencySymbol)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Export Data</CardTitle>
                <CardDescription>Download {formatMonth(selectedMonth)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleExportCSV} variant="outline" className="w-full justify-start text-sm">
                  <Download className="w-4 h-4 mr-2" /> Export to CSV
                </Button>
                <Button onClick={handleExportJSON} variant="outline" className="w-full justify-start text-sm">
                  <Download className="w-4 h-4 mr-2" /> Export to JSON
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Rollover History */}
          {rollovers.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">Month-End Rollover History</CardTitle>
                </div>
                <CardDescription>Record of how each month's remaining balance was allocated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border/50">
                  {[...rollovers]
                    .sort((a, b) => b.fromMonth.localeCompare(a.fromMonth))
                    .map(r => (
                      <div key={r.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">{formatMonth(r.fromMonth)}</span>
                          <Badge variant={r.remainingBalance >= 0 ? "secondary" : "destructive"} className="text-xs">
                            Remaining: {formatCurrency(r.remainingBalance, settings.currencySymbol)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <RolloverStat label="Income" value={formatCurrency(r.totalIncome, settings.currencySymbol)} />
                          <RolloverStat label="Expenses" value={formatCurrency(r.totalExpenses, settings.currencySymbol)} color="text-destructive" />
                          <RolloverStat label="To Savings" value={formatCurrency(r.savingsTransfer, settings.currencySymbol)} color="text-emerald-600 dark:text-emerald-400" />
                          <RolloverStat label="To Investment" value={formatCurrency(r.investmentTransfer, settings.currencySymbol)} color="text-violet-600 dark:text-violet-400" />
                          {r.carryForward > 0 && (
                            <RolloverStat label="Carried Forward" value={formatCurrency(r.carryForward, settings.currencySymbol)} color="text-blue-600 dark:text-blue-400" />
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

function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`flex items-center gap-1.5 mb-2 ${color}`}>{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
        <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function HighlightItem({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-secondary/50 p-4 rounded-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-sm">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function RolloverStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-secondary/40 rounded-md p-2.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`font-semibold text-sm tabular-nums ${color ?? ""}`}>{value}</p>
    </div>
  );
}
