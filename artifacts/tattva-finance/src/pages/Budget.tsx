import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, getCurrentMonthStr, formatMonth } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, Save, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";

const DEFAULT_CATEGORIES = [
  { name: "Rent", color: "#3b82f6" },
  { name: "Food", color: "#10b981" },
  { name: "Travel", color: "#f59e0b" },
  { name: "Personal", color: "#8b5cf6" },
  { name: "Savings", color: "#22c55e" },
  { name: "Emergency", color: "#ef4444" },
  { name: "Other", color: "#6b7280" },
];

export default function Budget() {
  const { budgets, categories, addBudget, updateBudget, addCategory, updateCategory, deleteCategory, settings } = useFinance();
  
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());
  const selectedBudget = budgets.find(b => b.month === selectedMonth);
  const budgetCategories = selectedBudget ? categories.filter(c => c.budgetId === selectedBudget.id) : [];

  const [income, setIncome] = useState(selectedBudget?.income.toString() || "");
  
  // Update local income state when budget changes
  React.useEffect(() => {
    setIncome(selectedBudget?.income.toString() || "");
  }, [selectedBudget?.id]);

  const handleCreateBudget = () => {
    const inc = parseFloat(income);
    if (isNaN(inc) || inc <= 0) {
      toast.error("Please enter a valid income amount");
      return;
    }

    const newBudget = addBudget({ month: selectedMonth, income: inc });
    
    // Auto populate default categories
    DEFAULT_CATEGORIES.forEach(cat => {
      addCategory({
        name: cat.name,
        color: cat.color,
        allocatedAmount: 0,
        budgetId: newBudget.id
      });
    });
    
    toast.success(`Budget created for ${formatMonth(selectedMonth)}`);
  };

  const handleUpdateIncome = () => {
    if (!selectedBudget) return;
    const inc = parseFloat(income);
    if (isNaN(inc) || inc <= 0) {
      toast.error("Please enter a valid income amount");
      return;
    }
    updateBudget(selectedBudget.id, { income: inc });
    toast.success("Income updated");
  };

  const handleAddCategory = () => {
    if (!selectedBudget) return;
    addCategory({
      name: "New Category",
      color: "#6b7280",
      allocatedAmount: 0,
      budgetId: selectedBudget.id
    });
  };

  const handleCategoryChange = (id: string, field: string, value: any) => {
    if (field === "allocatedAmount") {
      value = parseFloat(value) || 0;
    }
    updateCategory(id, { [field]: value });
  };

  // Generate month options (past 6 months, current, next 6 months)
  const monthOptions = React.useMemo(() => {
    const opts = [];
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    for (let i = 0; i < 13; i++) {
      const year = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const val = `${year}-${m}`;
      opts.push({
        value: val,
        label: formatMonth(val)
      });
      date.setMonth(date.getMonth() + 1);
    }
    return opts;
  }, []);

  const totalAllocated = budgetCategories.reduce((sum, c) => sum + c.allocatedAmount, 0);
  const isOverAllocated = selectedBudget && totalAllocated > selectedBudget.income;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Budget Setup</h1>
        <div className="w-full sm:w-48">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
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

      {!selectedBudget ? (
        <EmptyState
          icon={<Wallet className="w-8 h-8" />}
          title={`No budget for ${formatMonth(selectedMonth)}`}
          description="Create a budget to start allocating funds and tracking expenses."
          actionLabel="Create Budget"
          actionOnClick={handleCreateBudget}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Income</CardTitle>
                <CardDescription>Your total expected income for this month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount ({settings.currencySymbol})</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      value={income} 
                      onChange={(e) => setIncome(e.target.value)} 
                    />
                    <Button onClick={handleUpdateIncome} variant="secondary" size="icon">
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-4">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-muted-foreground">Total Income</span>
                    <span className="font-bold">{formatCurrency(selectedBudget.income, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-muted-foreground">Allocated</span>
                    <span className={`font-bold ${isOverAllocated ? 'text-destructive' : ''}`}>
                      {formatCurrency(totalAllocated, settings.currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Unallocated</span>
                    <span className="font-bold">
                      {formatCurrency(selectedBudget.income - totalAllocated, settings.currencySymbol)}
                    </span>
                  </div>
                </div>
                {isOverAllocated && (
                  <p className="text-xs text-destructive mt-2">
                    Warning: You have allocated more than your income.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Fund Allocation</CardTitle>
                  <CardDescription>Distribute your income across categories</CardDescription>
                </div>
                <Button onClick={handleAddCategory} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" /> Add Category
                </Button>
              </CardHeader>
              <CardContent>
                {budgetCategories.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No categories yet. Add one to start budgeting.</p>
                ) : (
                  <div className="space-y-4">
                    {budgetCategories.map(cat => (
                      <div key={cat.id} className="flex items-center gap-3 bg-secondary/50 p-3 rounded-lg">
                        <Input
                          type="color"
                          value={cat.color}
                          onChange={(e) => handleCategoryChange(cat.id, "color", e.target.value)}
                          className="w-10 h-10 p-1 cursor-pointer shrink-0"
                        />
                        <Input
                          value={cat.name}
                          onChange={(e) => handleCategoryChange(cat.id, "name", e.target.value)}
                          placeholder="Category Name"
                          className="flex-1"
                        />
                        <div className="relative w-32 shrink-0">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            {settings.currencySymbol}
                          </span>
                          <Input
                            type="number"
                            value={cat.allocatedAmount || ""}
                            onChange={(e) => handleCategoryChange(cat.id, "allocatedAmount", e.target.value)}
                            className="pl-8"
                            placeholder="0"
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteCategory(cat.id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
