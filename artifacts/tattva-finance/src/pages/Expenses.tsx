import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, formatDate, getCurrentMonthStr } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Trash2, Receipt, Filter } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Link } from "wouter";
import { formatMonth } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";

export default function Expenses() {
  const {
    currentMonthBudget,
    currentMonthCategories,
    currentMonthExpenses,
    deleteExpense,
    settings,
  } = useFinance();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const currentMonth = getCurrentMonthStr();

  if (!currentMonthBudget) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Receipt className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">No budget for this month</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Set up a budget for {formatMonth(currentMonth)} before recording expenses.
            </p>
          </div>
          <Link href="/planner">
            <Button>Set Up Budget</Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredExpenses = currentMonthExpenses
    .filter(e => filterCategory === "all" || e.categoryId === filterCategory)
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.categoryName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalAll = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const activeCategory = currentMonthCategories.find(c => c.id === filterCategory);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {formatMonth(currentMonthBudget.month)} · {currentMonthExpenses.length} transaction{currentMonthExpenses.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Spent", value: formatCurrency(totalAll, settings.currencySymbol), color: "text-destructive" },
          { label: "Transactions", value: currentMonthExpenses.length.toString(), color: "text-foreground" },
          { label: "Avg per Day", value: formatCurrency(totalAll / new Date().getDate(), settings.currencySymbol), color: "text-foreground" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</p>
            <p className={`text-sm font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search expenses..."
              className="pl-9 h-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Category filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-10">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {currentMonthCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              {filterCategory !== "all" ? activeCategory?.name ?? "Filtered" : "All Transactions"}
            </CardTitle>
            {(search || filterCategory !== "all") && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{filteredExpenses.length} results</span>
                <Badge variant="secondary" className="text-xs">
                  {formatCurrency(totalFiltered, settings.currencySymbol)}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-medium text-sm mb-1">
                {search || filterCategory !== "all" ? "No matching expenses" : "No expenses yet"}
              </p>
              <p className="text-xs text-muted-foreground">
                {search || filterCategory !== "all"
                  ? "Try adjusting your search or filter"
                  : "Tap the + button to add your first expense"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filteredExpenses.map(expense => {
                const category = currentMonthCategories.find(c => c.id === expense.categoryId);
                return (
                  <div key={expense.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    {/* Category avatar */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold"
                      style={{ backgroundColor: category?.color ?? "hsl(var(--muted))" }}
                    >
                      {expense.categoryName.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{expense.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{formatDate(expense.date)}</span>
                        <div
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                          style={{
                            backgroundColor: (category?.color ?? "#888") + "22",
                            color: category?.color ?? "hsl(var(--muted-foreground))",
                          }}
                        >
                          {expense.categoryName}
                        </div>
                      </div>
                      {expense.notes && (
                        <p className="text-[11px] text-muted-foreground italic mt-0.5 truncate">{expense.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-destructive text-sm tabular-nums">
                        -{formatCurrency(expense.amount, settings.currencySymbol)}
                      </span>
                      <ConfirmDialog
                        title="Delete Expense"
                        description="Are you sure you want to delete this expense? This cannot be undone."
                        onConfirm={() => { deleteExpense(expense.id); toast.success("Expense deleted"); }}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add expense note */}
      <p className="text-xs text-center text-muted-foreground pb-2">
        Tap the <span className="font-semibold text-primary">+</span> button to quickly add an expense
      </p>
    </div>
  );
}
