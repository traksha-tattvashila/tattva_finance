import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, formatMonth, getCurrentMonthStr } from "@/utils/formatters";
import { exportToCSV, exportToJSON } from "@/utils/export";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { SpendingPieChart } from "@/components/charts/SpendingPieChart";
import { AllocationBarChart } from "@/components/charts/AllocationBarChart";

export default function Reports() {
  const { budgets, categories, expenses, settings } = useFinance();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());

  const monthOptions = React.useMemo(() => {
    // Only show months that have a budget
    return budgets
      .map(b => b.month)
      .sort((a, b) => b.localeCompare(a))
      .map(m => ({ value: m, label: formatMonth(m) }));
  }, [budgets]);

  const budget = budgets.find(b => b.month === selectedMonth);
  const monthCategories = budget ? categories.filter(c => c.budgetId === budget.id) : [];
  const monthExpenses = budget ? expenses.filter(e => e.budgetId === budget.id) : [];

  const income = budget?.income || 0;
  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netSavings = income - totalSpent;
  const savingsPercent = income > 0 ? Math.max(0, (netSavings / income) * 100) : 0;

  // Prepare Pie Chart Data
  const pieData = monthCategories.map(cat => ({
    name: cat.name,
    value: monthExpenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0),
    color: cat.color
  })).filter(d => d.value > 0);

  // Prepare Bar Chart Data
  const barData = monthCategories.map(cat => ({
    name: cat.name,
    allocated: cat.allocatedAmount,
    spent: monthExpenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0),
    color: cat.color
  }));

  // Stats
  const topSpendingCategory = [...pieData].sort((a, b) => b.value - a.value)[0];
  const mostTransactionsCategoryId = monthExpenses.length > 0 
    ? Object.entries(monthExpenses.reduce((acc: any, e) => { acc[e.categoryId] = (acc[e.categoryId] || 0) + 1; return acc; }, {}))
      .sort((a: any, b: any) => b[1] - a[1])[0][0]
    : null;
  const mostTransactionsCategory = monthCategories.find(c => c.id === mostTransactionsCategoryId);
  const avgDailySpend = totalSpent / new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0).getDate();

  const handleExportCSV = () => {
    const rows = monthExpenses.map(e => ({
      Date: new Date(e.date).toLocaleDateString(),
      Name: e.name,
      Category: e.categoryName,
      Amount: e.amount,
      Notes: e.notes || ""
    }));
    exportToCSV(`tattva_expenses_${selectedMonth}.csv`, rows);
  };

  const handleExportJSON = () => {
    const data = {
      budget,
      categories: monthCategories,
      expenses: monthExpenses
    };
    exportToJSON(`tattva_data_${selectedMonth}.json`, data);
  };

  if (monthOptions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <div className="flex items-center justify-center h-[400px] text-muted-foreground border border-dashed border-border rounded-xl">
          No budgets created yet to generate reports.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!budget ? (
        <div className="text-center py-12 text-muted-foreground">Select a month to view reports</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Income</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(income, settings.currencySymbol)}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <h3 className="text-2xl font-bold mt-1 text-destructive">{formatCurrency(totalSpent, settings.currencySymbol)}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Net Savings</p>
                <h3 className="text-2xl font-bold mt-1 text-green-500">{formatCurrency(netSavings, settings.currencySymbol)}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Savings Rate</p>
                <h3 className="text-2xl font-bold mt-1">{savingsPercent.toFixed(1)}%</h3>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <SpendingPieChart data={pieData} currencySymbol={settings.currencySymbol} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Allocated vs Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <AllocationBarChart data={barData} currencySymbol={settings.currencySymbol} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Month Highlights</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Top Spending</p>
                  <p className="font-bold">{topSpendingCategory ? topSpendingCategory.name : '-'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {topSpendingCategory ? formatCurrency(topSpendingCategory.value, settings.currencySymbol) : ''}
                  </p>
                </div>
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Most Transactions</p>
                  <p className="font-bold">{mostTransactionsCategory ? mostTransactionsCategory.name : '-'}</p>
                </div>
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Avg Daily Spend</p>
                  <p className="font-bold">{formatCurrency(avgDailySpend, settings.currencySymbol)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>Download data for {formatMonth(selectedMonth)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleExportCSV} variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" /> Export to CSV
                </Button>
                <Button onClick={handleExportJSON} variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" /> Export to JSON
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
