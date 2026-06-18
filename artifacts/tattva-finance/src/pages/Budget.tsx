import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, formatMonth, getCurrentMonthStr } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Save,
  Wallet,
  RefreshCw,
  CirclePlus,
  X,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const {
    budgets,
    currentMonthBudget,
    addBudget,
    updateBudget,
    currentMonthCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    currentMonthAdditionalIncome,
    addAdditionalIncome,
    deleteAdditionalIncome,
    currentMonthExpenses,
    getAdditionalIncomeTotal,
    getTotalIncome,
    closeMonth,
    rollovers,
    settings,
  } = useFinance();

  const currentMonth = getCurrentMonthStr();

  // Create budget form state
  const [newSalary, setNewSalary] = useState("");

  // Edit salary state
  const [editSalary, setEditSalary] = useState(currentMonthBudget?.salaryIncome.toString() ?? "");
  React.useEffect(() => {
    setEditSalary(currentMonthBudget?.salaryIncome.toString() ?? "");
  }, [currentMonthBudget?.id]);

  // Additional income form
  const [addIncomeDesc, setAddIncomeDesc] = useState("");
  const [addIncomeAmt, setAddIncomeAmt] = useState("");

  // Close month dialog
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeOpts, setCloseOpts] = useState({
    savingsTransfer: "",
    investmentTransfer: "",
    carryForward: "",
    note: "",
  });

  // Previous month's rollover (to show carry-forward source)
  const prevMonthStr = React.useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [currentMonth]);

  const prevRollover = rollovers.find(r => r.fromMonth === prevMonthStr);

  // Computed values
  const additionalTotal = currentMonthBudget
    ? getAdditionalIncomeTotal(currentMonthBudget.id)
    : 0;
  const totalIncome = currentMonthBudget ? getTotalIncome(currentMonthBudget) : 0;
  const totalExpenses = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBalance = totalIncome - totalExpenses;

  const totalAllocated = currentMonthCategories.reduce((s, c) => s + c.allocatedAmount, 0);
  const isOverAllocated = currentMonthBudget && totalAllocated > totalIncome;

  // Close month dialog helpers
  const closeAllocated =
    parseFloat(closeOpts.savingsTransfer || "0") +
    parseFloat(closeOpts.investmentTransfer || "0") +
    parseFloat(closeOpts.carryForward || "0");
  const closeRemaining = remainingBalance - closeAllocated;
  const closeBalanced = Math.abs(closeRemaining) < 0.01;

  // ── Handlers ──

  const handleCreateBudget = () => {
    const inc = parseFloat(newSalary);
    if (!newSalary.trim() || isNaN(inc) || inc <= 0) {
      toast.error("Please enter a valid salary amount");
      return;
    }
    const budget = addBudget({ month: currentMonth, salaryIncome: inc });
    DEFAULT_CATEGORIES.forEach(cat =>
      addCategory({ name: cat.name, color: cat.color, allocatedAmount: 0, budgetId: budget.id })
    );
    toast.success(`Budget created for ${formatMonth(currentMonth)}`);
    setNewSalary("");
  };

  const handleSaveSalary = () => {
    if (!currentMonthBudget) return;
    const inc = parseFloat(editSalary);
    if (isNaN(inc) || inc <= 0) {
      toast.error("Enter a valid salary amount");
      return;
    }
    updateBudget(currentMonthBudget.id, { salaryIncome: inc });
    toast.success("Salary updated");
  };

  const handleAddAdditionalIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMonthBudget) return;
    const amt = parseFloat(addIncomeAmt);
    if (!addIncomeDesc.trim() || isNaN(amt) || amt <= 0) {
      toast.error("Enter a description and valid amount");
      return;
    }
    addAdditionalIncome({ description: addIncomeDesc, amount: amt, budgetId: currentMonthBudget.id });
    setAddIncomeDesc("");
    setAddIncomeAmt("");
    toast.success("Additional income added");
  };

  const handleCategoryChange = (id: string, field: string, value: string) => {
    const parsed = field === "allocatedAmount" ? parseFloat(value) || 0 : value;
    updateCategory(id, { [field]: parsed });
  };

  const handleAddCategory = () => {
    if (!currentMonthBudget) return;
    addCategory({ name: "New Category", color: "#6b7280", allocatedAmount: 0, budgetId: currentMonthBudget.id });
  };

  const handleCloseMonth = () => {
    if (!currentMonthBudget) return;
    const savings = parseFloat(closeOpts.savingsTransfer || "0");
    const investment = parseFloat(closeOpts.investmentTransfer || "0");
    const carry = parseFloat(closeOpts.carryForward || "0");
    if (!closeBalanced) {
      toast.error("Allocated amounts must equal the remaining balance");
      return;
    }
    closeMonth(currentMonthBudget.id, {
      savingsTransfer: savings,
      investmentTransfer: investment,
      carryForward: carry,
      note: closeOpts.note || undefined,
    });
    setCloseDialogOpen(false);
    toast.success(`${formatMonth(currentMonth)} closed successfully`);
  };

  const isClosed = currentMonthBudget?.status === "closed";

  // ── No budget state ──
  if (!currentMonthBudget) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Budget Setup</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{formatMonth(currentMonth)}</p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Set Up This Month's Budget</CardTitle>
                <CardDescription>Enter your salary to get started</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {prevRollover && prevRollover.carryForward > 0 && (
              <Alert>
                <RefreshCw className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">{formatCurrency(prevRollover.carryForward, settings.currencySymbol)}</span> will be automatically carried forward from {formatMonth(prevMonthStr)}.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="salary-input">
                Monthly Salary / Income ({settings.currencySymbol})
              </Label>
              <Input
                id="salary-input"
                data-testid="input-salary"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 15000"
                value={newSalary}
                onChange={e => setNewSalary(e.target.value)}
                className="w-full text-base"
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Your primary salary/income for {formatMonth(currentMonth)}.
                You can add extra income entries after setup.
              </p>
            </div>

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

        {budgets.length > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            Historical budgets are available in{" "}
            <a href="/reports" className="text-primary underline underline-offset-2">Reports</a>.
          </p>
        )}
      </div>
    );
  }

  // ── Active / Closed budget ──
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Budget Setup</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{formatMonth(currentMonth)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isClosed ? (
            <Badge variant="secondary" className="gap-1">
              <Lock className="w-3 h-3" /> Closed
            </Badge>
          ) : (
            <Button
              data-testid="button-close-month"
              variant="outline"
              size="sm"
              onClick={() => setCloseDialogOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              Close Month
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Income column */}
        <div className="lg:col-span-1 space-y-4">

          {/* Salary card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Salary Income
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isClosed ? (
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(currentMonthBudget.salaryIncome, settings.currencySymbol)}
                </p>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                      {settings.currencySymbol}
                    </span>
                    <Input
                      data-testid="input-edit-salary"
                      type="number"
                      inputMode="decimal"
                      value={editSalary}
                      onChange={e => setEditSalary(e.target.value)}
                      className="pl-7 text-base"
                      min="0"
                    />
                  </div>
                  <Button
                    data-testid="button-save-salary"
                    onClick={handleSaveSalary}
                    variant="secondary"
                    size="icon"
                    title="Save salary"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional income card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Additional Income
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentMonthAdditionalIncome.length > 0 && (
                <div className="space-y-2 mb-3">
                  {currentMonthAdditionalIncome.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between gap-2 bg-secondary/50 px-3 py-2 rounded-md">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{entry.description}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          +{formatCurrency(entry.amount, settings.currencySymbol)}
                        </p>
                      </div>
                      {!isClosed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => deleteAdditionalIncome(entry.id)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-medium px-1">
                    <span>Total additional</span>
                    <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{formatCurrency(additionalTotal, settings.currencySymbol)}
                    </span>
                  </div>
                </div>
              )}

              {!isClosed && (
                <form onSubmit={handleAddAdditionalIncome} className="space-y-2">
                  <Input
                    placeholder="Description (e.g. Freelance)"
                    value={addIncomeDesc}
                    onChange={e => setAddIncomeDesc(e.target.value)}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">
                        {settings.currencySymbol}
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={addIncomeAmt}
                        onChange={e => setAddIncomeAmt(e.target.value)}
                        className="pl-6 text-sm"
                        min="0"
                      />
                    </div>
                    <Button type="submit" size="sm" variant="outline" className="shrink-0">
                      <CirclePlus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                </form>
              )}

              {currentMonthAdditionalIncome.length === 0 && isClosed && (
                <p className="text-xs text-muted-foreground">No additional income recorded.</p>
              )}
            </CardContent>
          </Card>

          {/* Carry forward card */}
          {currentMonthBudget.carryForward > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <RefreshCw className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Carry Forward
                  </span>
                </div>
                <p className="text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                  +{formatCurrency(currentMonthBudget.carryForward, settings.currencySymbol)}
                </p>
                {prevRollover && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Rolled over from {formatMonth(prevMonthStr)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Total available summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Available Budget</p>
              <p className="text-3xl font-bold tabular-nums text-primary">
                {formatCurrency(totalIncome, settings.currencySymbol)}
              </p>
              <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t border-primary/10">
                <div className="flex justify-between">
                  <span>Salary</span>
                  <span className="tabular-nums">{formatCurrency(currentMonthBudget.salaryIncome, settings.currencySymbol)}</span>
                </div>
                {additionalTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Additional</span>
                    <span className="tabular-nums text-emerald-600 dark:text-emerald-400">+{formatCurrency(additionalTotal, settings.currencySymbol)}</span>
                  </div>
                )}
                {currentMonthBudget.carryForward > 0 && (
                  <div className="flex justify-between">
                    <span>Carry Forward</span>
                    <span className="tabular-nums text-blue-600 dark:text-blue-400">+{formatCurrency(currentMonthBudget.carryForward, settings.currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-primary/10 font-medium text-foreground">
                  <span>Spent</span>
                  <span className="tabular-nums text-destructive">-{formatCurrency(totalExpenses, settings.currencySymbol)}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Remaining</span>
                  <span className={`tabular-nums ${remainingBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    {formatCurrency(remainingBalance, settings.currencySymbol)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Fund allocation */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle>Fund Allocation</CardTitle>
                  <CardDescription>Distribute your income across categories</CardDescription>
                </div>
                {!isClosed && (
                  <Button
                    data-testid="button-add-category"
                    onClick={handleAddCategory}
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                )}
              </div>

              {isOverAllocated && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2 mt-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Allocated {formatCurrency(totalAllocated, settings.currencySymbol)} exceeds available {formatCurrency(totalIncome, settings.currencySymbol)}.
                </div>
              )}

              <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                <span>Allocated: {formatCurrency(totalAllocated, settings.currencySymbol)}</span>
                <span className={totalIncome - totalAllocated < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}>
                  Unallocated: {formatCurrency(totalIncome - totalAllocated, settings.currencySymbol)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {currentMonthCategories.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No categories yet. {!isClosed && `Tap "Add" to create one.`}
                </p>
              ) : (
                <div className="space-y-3">
                  {currentMonthCategories.map(cat => {
                    const spent = currentMonthExpenses
                      .filter(e => e.categoryId === cat.id)
                      .reduce((sum, e) => sum + e.amount, 0);
                    const progress = cat.allocatedAmount > 0 ? (spent / cat.allocatedAmount) * 100 : 0;

                    return (
                      <div key={cat.id} data-testid={`category-row-${cat.id}`}>
                        <div className="flex items-center gap-2 bg-secondary/50 p-3 rounded-lg">
                          {!isClosed ? (
                            <Input
                              type="color"
                              value={cat.color}
                              onChange={e => handleCategoryChange(cat.id, "color", e.target.value)}
                              className="w-9 h-9 p-1 cursor-pointer shrink-0 rounded"
                              title="Category color"
                            />
                          ) : (
                            <div
                              className="w-9 h-9 rounded shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                          )}
                          <Input
                            value={cat.name}
                            onChange={e => handleCategoryChange(cat.id, "name", e.target.value)}
                            placeholder="Category Name"
                            className="flex-1 min-w-0 text-sm"
                            readOnly={isClosed}
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
                              readOnly={isClosed}
                            />
                          </div>
                          {!isClosed && (
                            <Button
                              data-testid={`button-delete-category-${cat.id}`}
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteCategory(cat.id)}
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        {cat.allocatedAmount > 0 && (
                          <div className="px-1 mt-1.5">
                            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                              <span>Spent: {formatCurrency(spent, settings.currencySymbol)}</span>
                              <span className={progress > 80 ? "text-destructive" : ""}>
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(progress, 100)}%`,
                                  backgroundColor: progress > 80 ? "hsl(var(--destructive))" : cat.color,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Close Month Dialog ── */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Close {formatMonth(currentMonth)}</DialogTitle>
            <DialogDescription>
              Allocate your remaining balance to savings, investments, or carry it forward to next month.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Income</p>
                <p className="font-bold text-sm tabular-nums mt-1">
                  {formatCurrency(totalIncome, settings.currencySymbol)}
                </p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Expenses</p>
                <p className="font-bold text-sm tabular-nums mt-1 text-destructive">
                  {formatCurrency(totalExpenses, settings.currencySymbol)}
                </p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 text-center border border-primary/20">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Remaining</p>
                <p className="font-bold text-sm tabular-nums mt-1 text-primary">
                  {formatCurrency(remainingBalance, settings.currencySymbol)}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Allocate the remaining {formatCurrency(remainingBalance, settings.currencySymbol)} below. All three fields must sum to this amount.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Transfer to Savings Account ({settings.currencySymbol})</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={closeOpts.savingsTransfer}
                  onChange={e => setCloseOpts(p => ({ ...p, savingsTransfer: e.target.value }))}
                  min="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Transfer to Investment Account ({settings.currencySymbol})</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={closeOpts.investmentTransfer}
                  onChange={e => setCloseOpts(p => ({ ...p, investmentTransfer: e.target.value }))}
                  min="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Carry Forward to Next Month ({settings.currencySymbol})</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={closeOpts.carryForward}
                  onChange={e => setCloseOpts(p => ({ ...p, carryForward: e.target.value }))}
                  min="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Note (optional)</Label>
                <Input
                  placeholder="e.g. Good month, saved extra"
                  value={closeOpts.note}
                  onChange={e => setCloseOpts(p => ({ ...p, note: e.target.value }))}
                />
              </div>
            </div>

            {/* Balance check */}
            <div className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${closeBalanced ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
              <span>Allocated</span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(closeAllocated, settings.currencySymbol)} / {formatCurrency(remainingBalance, settings.currencySymbol)}
                {closeBalanced ? " ✓" : ` (${formatCurrency(Math.abs(closeRemaining), settings.currencySymbol)} ${closeRemaining > 0 ? "remaining" : "over"})`}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCloseMonth} disabled={!closeBalanced || remainingBalance < 0}>
              <Lock className="w-4 h-4 mr-2" /> Close Month
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
