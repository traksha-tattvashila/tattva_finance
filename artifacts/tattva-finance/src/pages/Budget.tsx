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
  const [newIncome, setNewIncome] = useState("");

  React.useEffect(() => {
    setIncome(selectedBudget?.income.toString() || "");
  }, [selectedBudget?.id]);

  const handleMonthChange = (val: string) => {
    setSelectedMonth(val);
    setNewIncome("");
  };

  const handleCreateBudget = () => {
    const inc = parseFloat(newIncome);
    if (!newIncome.trim() || isNaN(inc) || inc <= 0) {
      toast.error("Please enter a valid income amount before creating the budget");
      return;
    }

    const newBudget = addBudget({ month: selectedMonth, income: inc });

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

  const handleCategoryChange = (id: string, field: string, value: string) => {
    const parsed = field === "allocatedAmount" ? parseFloat(value) || 0 : value;
    updateCategory(id, { [field]: parsed });
  };

  const monthOptions = React.useMemo(() => {
    const opts = [];
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    for (let i = 0; i < 13; i++) {
      const year = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const val = `${year}-${m}`;
      opts.push({ value: val, label: formatMonth(val) });
      date.setMonth(date.getMonth() + 1);
    }
    return opts;
  }, []);

  const totalAllocated = budgetCategories.reduce((sum, c) => sum + c.allocatedAmount, 0);
  const isOverAllocated = selectedBudget && totalAllocated > selectedBudget.income;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Budget Setup</h1>

      {!selectedBudget ? (
        /* ── CREATE BUDGET FORM ── visible on all screen sizes including 360px ── */
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Set Up Monthly Budget</CardTitle>
                <CardDescription>Choose a month and enter your income to get started</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Month selector */}
            <div className="space-y-2">
              <Label htmlFor="month-select">Month</Label>
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger id="month-select" data-testid="select-month" className="w-full">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Income input — always visible, required before submit */}
            <div className="space-y-2">
              <Label htmlFor="income-input">
                Monthly Income ({settings.currencySymbol})
              </Label>
              <Input
                id="income-input"
                data-testid="input-income"
                type="number"
                inputMode="decimal"
                placeholder={`e.g. 15000`}
                value={newIncome}
                onChange={e => setNewIncome(e.target.value)}
                className="w-full text-base"
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Enter your salary or total expected income for {formatMonth(selectedMonth)}.
              </p>
            </div>

            {/* Create button — full width, easy to tap on mobile */}
            <Button
              data-testid="button-create-budget"
              onClick={handleCreateBudget}
              className="w-full"
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* ── EDIT EXISTING BUDGET ── */
        <div className="space-y-6">
          {/* Month selector shown above the edit cards */}
          <div className="w-full sm:w-56">
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger data-testid="select-month-edit" className="w-full">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Income card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Income</CardTitle>
                  <CardDescription>Your total expected income for this month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-income">Amount ({settings.currencySymbol})</Label>
                    <div className="flex gap-2">
                      <Input
                        id="edit-income"
                        data-testid="input-edit-income"
                        type="number"
                        inputMode="decimal"
                        value={income}
                        onChange={e => setIncome(e.target.value)}
                        className="flex-1 text-base"
                        min="0"
                      />
                      <Button
                        data-testid="button-save-income"
                        onClick={handleUpdateIncome}
                        variant="secondary"
                        size="icon"
                        title="Save income"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Total Income</span>
                      <span className="font-bold">{formatCurrency(selectedBudget.income, settings.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Allocated</span>
                      <span className={`font-bold ${isOverAllocated ? "text-destructive" : ""}`}>
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
                    <p className="text-xs text-destructive">
                      Warning: You have allocated more than your income.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Fund allocation card */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-row items-start justify-between gap-2">
                    <div>
                      <CardTitle>Fund Allocation</CardTitle>
                      <CardDescription>Distribute your income across categories</CardDescription>
                    </div>
                    <Button
                      data-testid="button-add-category"
                      onClick={handleAddCategory}
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {budgetCategories.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      No categories yet. Tap "Add" to create one.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {budgetCategories.map(cat => (
                        <div
                          key={cat.id}
                          data-testid={`category-row-${cat.id}`}
                          className="flex items-center gap-2 bg-secondary/50 p-3 rounded-lg"
                        >
                          <Input
                            type="color"
                            value={cat.color}
                            onChange={e => handleCategoryChange(cat.id, "color", e.target.value)}
                            className="w-9 h-9 p-1 cursor-pointer shrink-0 rounded"
                            title="Category color"
                          />
                          <Input
                            value={cat.name}
                            onChange={e => handleCategoryChange(cat.id, "name", e.target.value)}
                            placeholder="Category Name"
                            className="flex-1 min-w-0 text-sm"
                          />
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                              {settings.currencySymbol}
                            </span>
                            <Input
                              type="number"
                              inputMode="decimal"
                              value={cat.allocatedAmount || ""}
                              onChange={e => handleCategoryChange(cat.id, "allocatedAmount", e.target.value)}
                              className="pl-7 text-sm"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                          <Button
                            data-testid={`button-delete-category-${cat.id}`}
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCategory(cat.id)}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            title="Delete category"
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
        </div>
      )}
    </div>
  );
}
