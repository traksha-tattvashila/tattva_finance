import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, formatDate, getCurrentMonthStr } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Search, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Link } from "wouter";

export default function Expenses() {
  const { currentMonthBudget, currentMonthCategories, currentMonthExpenses, addExpense, deleteExpense, settings } = useFinance();
  
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMonthBudget) return;
    
    const amt = parseFloat(amount);
    if (!name || isNaN(amt) || amt <= 0 || !categoryId) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    const category = currentMonthCategories.find(c => c.id === categoryId);
    if (!category) return;

    addExpense({
      name,
      amount: amt,
      categoryId,
      categoryName: category.name,
      notes,
      budgetId: currentMonthBudget.id
    });

    toast.success("Expense added successfully");
    setName("");
    setAmount("");
    setNotes("");
    // Keep category selected for quick entry
  };

  const filteredExpenses = currentMonthExpenses
    .filter(e => filterCategory === "all" || e.categoryId === filterCategory)
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!currentMonthBudget) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <EmptyState
          icon={<Receipt className="w-8 h-8" />}
          title="No budget set for this month"
          description={`You need a budget for ${getCurrentMonthStr()} before adding expenses.`}
          actionLabel="Set up Budget"
          actionHref="/budget"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
          <CardDescription>Record a new transaction for this month</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2 lg:col-span-1">
              <Label>Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Coffee, Groceries..." />
            </div>
            <div className="space-y-2 lg:col-span-1">
              <Label>Amount ({settings.currencySymbol}) *</Label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2 lg:col-span-1">
              <Label>Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {currentMonthCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-1">
              <Label>Notes</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
            </div>
            <div className="lg:col-span-1">
              <Button type="submit" className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Transaction History</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {currentMonthCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No expenses found.</p>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map(expense => {
                const category = currentMonthCategories.find(c => c.id === expense.categoryId);
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div>
                        <p className="font-medium">{expense.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
                          {category && (
                            <CategoryBadge name={category.name} color={category.color} />
                          )}
                        </div>
                        {expense.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{expense.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-destructive">
                        -{formatCurrency(expense.amount, settings.currencySymbol)}
                      </p>
                      <ConfirmDialog
                        title="Delete Expense"
                        description="Are you sure you want to delete this expense? This action cannot be undone."
                        onConfirm={() => deleteExpense(expense.id)}
                        trigger={
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
