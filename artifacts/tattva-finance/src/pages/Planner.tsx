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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ChevronRight,
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

type CloseOption = "carry-forward" | "goal" | "custom";

export default function Planner() {
  const {
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
    goals,
    addFundsToGoal,
    settings,
  } = useFinance();

  const isDetailed = settings.budgetStyle === "detailed";
  const currentMonth = getCurrentMonthStr();
  const isClosed = currentMonthBudget?.status === "closed";

  // Create form
  const [newSalary, setNewSalary] = useState("");

  // Edit salary
  const [editSalary, setEditSalary] = useState(currentMonthBudget?.salaryIncome.toString() ?? "");
  React.useEffect(() => {
    setEditSalary(currentMonthBudget?.salaryIncome.toString() ?? "");
  }, [currentMonthBudget?.id]);

  // Additional income
  const [addIncomeDesc, setAddIncomeDesc] = useState("");
  const [addIncomeAmt, setAddIncomeAmt] = useState("");

  // Close month dialog
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeOption, setCloseOption] = useState<CloseOption>("carry-forward");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [goalFundAmount, setGoalFundAmount] = useState("");
  // Custom split fields
  const [customSavings, setCustomSavings] = useState("");
  const [customInvestment, setCustomInvestment] = useState("");
  const [customCarry, setCustomCarry] = useState("");
  const [closeNote, setCloseNote] = useState("");

  // Previous month rollover
  const prevMonthStr = React.useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [currentMonth]);
  const prevRollover = rollovers.find(r => r.fromMonth === prevMonthStr);

  const additionalTotal = currentMonthBudget ? getAdditionalIncomeTotal(currentMonthBudget.id) : 0;
  const totalIncome = currentMonthBudget ? getTotalIncome(currentMonthBudget) : 0;
  const totalExpenses = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalIncome - totalExpenses;
  const totalAllocated = currentMonthCategories.reduce((s, c) => s + c.allocatedAmount, 0);
  const isOverAllocated = totalAllocated > totalIncome;

  const activeGoals = goals.filter(g => !g.completedAt);

  // ── Handlers ──

  const handleCreate = () => {
    const inc = parseFloat(newSalary);
    if (!newSalary.trim() || isNaN(inc) || inc <= 0) {
      toast.error("Enter a valid salary amount");
      return;
    }
    const budget = addBudget({ month: currentMonth, salaryIncome: inc });
    DEFAULT_CATEGORIES.forEach(cat =>
      addCategory({ name: cat.name, color: cat.color, allocatedAmount: 0, budgetId: budget.id })
    );
    toast.success(`Budget created for ${formatMonth(currentMonth)}`);
  };

  const handleSaveSalary = () => {
    if (!currentMonthBudget) return;
    const inc = parseFloat(editSalary);
    if (isNaN(inc) || inc <= 0) { toast.error("Enter a valid amount"); return; }
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
    setAddIncomeDesc(""); setAddIncomeAmt("");
    toast.success("Income added");
  };

  const handleCategoryChange = (id: string, field: string, value: string) => {
    updateCategory(id, { [field]: field === "allocatedAmount" ? parseFloat(value) || 0 : value });
  };

  const openCloseDialog = () => {
    setCloseOption("carry-forward");
    setSelectedGoalId(activeGoals[0]?.id ?? "");
    setGoalFundAmount(remaining > 0 ? remaining.toString() : "");
    setCustomSavings(""); setCustomInvestment(""); setCustomCarry(""); setCloseNote("");
    setCloseOpen(true);
  };

  const handleCloseMonth = () => {
    if (!currentMonthBudget) return;

    if (closeOption === "carry-forward") {
      closeMonth(currentMonthBudget.id, { savingsTransfer: 0, investmentTransfer: 0, carryForward: Math.max(remaining, 0), note: closeNote || undefined });
      setCloseOpen(false);
      toast.success("Month closed — balance carried forward");

    } else if (closeOption === "goal") {
      const goalAmt = parseFloat(goalFundAmount) || 0;
      if (goalAmt > 0 && selectedGoalId) addFundsToGoal(selectedGoalId, goalAmt);
      const leftover = Math.max(remaining - goalAmt, 0);
      closeMonth(currentMonthBudget.id, { savingsTransfer: 0, investmentTransfer: 0, carryForward: leftover, note: closeNote || undefined });
      setCloseOpen(false);
      toast.success("Month closed — funds added to goal");

    } else {
      // custom
      const sv = parseFloat(customSavings) || 0;
      const inv = parseFloat(customInvestment) || 0;
      const carry = parseFloat(customCarry) || 0;
      const sum = sv + inv + carry;
      if (Math.abs(sum - remaining) > 0.01) {
        toast.error("Amounts must sum to the remaining balance");
        return;
      }
      closeMonth(currentMonthBudget.id, { savingsTransfer: sv, investmentTransfer: inv, carryForward: carry, note: closeNote || undefined });
      setCloseOpen(false);
      toast.success("Month closed");
    }
  };

  // ── No budget state ──
  if (!currentMonthBudget) {
    return (
      <div className="space-y-6 max-w-md mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Month Planner</h1>
          <p className="text-sm text-muted-foreground">{formatMonth(currentMonth)}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Set Up This Month</CardTitle>
                <CardDescription>Enter your salary to begin</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {prevRollover && prevRollover.carryForward > 0 && (
              <Alert>
                <RefreshCw className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <span className="font-semibold">{formatCurrency(prevRollover.carryForward, settings.currencySymbol)}</span> will be carried forward from {formatMonth(prevMonthStr)}.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="salary-create">Monthly Salary ({settings.currencySymbol})</Label>
              <Input
                id="salary-create"
                data-testid="input-salary"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 15000"
                value={newSalary}
                onChange={e => setNewSalary(e.target.value)}
                className="h-12 text-lg"
                min="0"
              />
            </div>
            <Button data-testid="button-create-budget" onClick={handleCreate} className="w-full h-12" size="lg">
              <Plus className="w-4 h-4 mr-2" /> Create Budget
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Active / Closed budget ──
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Month Planner</h1>
          <p className="text-sm text-muted-foreground">{formatMonth(currentMonth)}</p>
        </div>
        {isClosed ? (
          <Badge variant="secondary" className="gap-1 shrink-0"><Lock className="w-3 h-3" /> Closed</Badge>
        ) : (
          <Button variant="outline" size="sm" onClick={openCloseDialog} className="gap-1.5 shrink-0">
            <Lock className="w-3.5 h-3.5" /> Close Month
          </Button>
        )}
      </div>

      {/* Income + Summary */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Salary row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Monthly Salary</p>
              {isClosed ? (
                <p className="text-xl font-bold tabular-nums">{formatCurrency(currentMonthBudget.salaryIncome, settings.currencySymbol)}</p>
              ) : (
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                      {settings.currencySymbol}
                    </span>
                    <Input
                      type="number" inputMode="decimal"
                      value={editSalary} onChange={e => setEditSalary(e.target.value)}
                      className="pl-7" min="0"
                    />
                  </div>
                  <Button onClick={handleSaveSalary} variant="secondary" size="icon" title="Save">
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Additional income (detailed mode) */}
          {isDetailed && (
            <div className="border-t border-border/50 pt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Additional Income</p>
              {currentMonthAdditionalIncome.map(entry => (
                <div key={entry.id} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.description}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">+{formatCurrency(entry.amount, settings.currencySymbol)}</p>
                  </div>
                  {!isClosed && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => deleteAdditionalIncome(entry.id)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {!isClosed && (
                <form onSubmit={handleAddAdditionalIncome} className="flex gap-2">
                  <Input placeholder="Description" value={addIncomeDesc} onChange={e => setAddIncomeDesc(e.target.value)} className="flex-1 text-sm h-9" />
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">{settings.currencySymbol}</span>
                    <Input type="number" inputMode="decimal" placeholder="0" value={addIncomeAmt} onChange={e => setAddIncomeAmt(e.target.value)} className="pl-5 text-sm h-9" min="0" />
                  </div>
                  <Button type="submit" size="sm" variant="outline" className="h-9 shrink-0"><CirclePlus className="w-4 h-4" /></Button>
                </form>
              )}
            </div>
          )}

          {/* Carry forward (detailed) */}
          {isDetailed && currentMonthBudget.carryForward > 0 && (
            <div className="flex items-center justify-between border-t border-border/50 pt-3 text-sm">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-muted-foreground">Carry Forward</span>
              </div>
              <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">+{formatCurrency(currentMonthBudget.carryForward, settings.currencySymbol)}</span>
            </div>
          )}

          {/* Total summary */}
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Available</span>
              <span className="font-bold text-primary tabular-nums">{formatCurrency(totalIncome, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Spent</span>
              <span className="text-destructive tabular-nums">-{formatCurrency(totalExpenses, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-primary/10 pt-2">
              <span>Remaining</span>
              <span className={`tabular-nums ${remaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                {formatCurrency(remaining, settings.currencySymbol)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fund Allocation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Fund Allocation</CardTitle>
              <CardDescription className="text-xs mt-0.5">Allocate your budget to categories</CardDescription>
            </div>
            {!isClosed && (
              <Button onClick={() => addCategory({ name: "New Category", color: "#6b7280", allocatedAmount: 0, budgetId: currentMonthBudget.id })}
                size="sm" variant="outline" className="shrink-0 h-8 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            )}
          </div>

          {isOverAllocated && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 mt-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Over-allocated by {formatCurrency(totalAllocated - totalIncome, settings.currencySymbol)}
            </div>
          )}

          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Allocated: {formatCurrency(totalAllocated, settings.currencySymbol)}</span>
            <span className={totalIncome - totalAllocated < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}>
              Free: {formatCurrency(totalIncome - totalAllocated, settings.currencySymbol)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {currentMonthCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No categories. {!isClosed && `Tap "Add" above.`}</p>
          ) : (
            <div className="space-y-3">
              {currentMonthCategories.map(cat => {
                const spent = currentMonthExpenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0);
                const pct = cat.allocatedAmount > 0 ? (spent / cat.allocatedAmount) * 100 : 0;
                return (
                  <div key={cat.id} data-testid={`category-row-${cat.id}`} className="bg-secondary/40 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {!isClosed ? (
                        <Input type="color" value={cat.color}
                          onChange={e => handleCategoryChange(cat.id, "color", e.target.value)}
                          className="w-8 h-8 p-0.5 cursor-pointer shrink-0 rounded-lg border-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: cat.color }} />
                      )}
                      <Input value={cat.name}
                        onChange={e => handleCategoryChange(cat.id, "name", e.target.value)}
                        className="flex-1 h-8 text-sm bg-transparent border-0 shadow-none p-0 font-medium focus-visible:ring-0"
                        readOnly={isClosed} />
                      <div className="relative w-24 shrink-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">{settings.currencySymbol}</span>
                        <Input type="number" inputMode="decimal"
                          value={cat.allocatedAmount || ""}
                          onChange={e => handleCategoryChange(cat.id, "allocatedAmount", e.target.value)}
                          className="pl-6 h-8 text-sm" placeholder="0" min="0" readOnly={isClosed} />
                      </div>
                      {!isClosed && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteCategory(cat.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    {cat.allocatedAmount > 0 && (
                      <div>
                        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                          <span>Spent {formatCurrency(spent, settings.currencySymbol)}</span>
                          <span className={pct > 80 ? "text-destructive font-medium" : ""}>{pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-background overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 80 ? "hsl(var(--destructive))" : cat.color }} />
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

      {/* ── Close Month Dialog ── */}
      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Close {formatMonth(currentMonth)}</DialogTitle>
            <DialogDescription>
              You have <span className="font-semibold text-primary">{formatCurrency(remaining, settings.currencySymbol)}</span> remaining. What would you like to do with it?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Options */}
            {[
              { id: "carry-forward" as CloseOption, label: "Carry forward to next month", icon: <RefreshCw className="w-4 h-4" /> },
              { id: "goal" as CloseOption, label: "Add to a Savings Goal", icon: <PiggyBankIcon /> },
              { id: "custom" as CloseOption, label: "Custom split", icon: <Split /> },
            ].map(opt => (
              <button key={opt.id} onClick={() => setCloseOption(opt.id)}
                className={`w-full flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${closeOption === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-border/80"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${closeOption === opt.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {opt.icon}
                </div>
                <span className={`text-sm font-medium ${closeOption === opt.id ? "text-primary" : ""}`}>{opt.label}</span>
              </button>
            ))}

            {/* Goal selection */}
            {closeOption === "goal" && (
              <div className="space-y-3 pl-2 border-l-2 border-primary/20 ml-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Select Goal</Label>
                  <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Choose a goal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeGoals.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount ({settings.currencySymbol})</Label>
                  <Input type="number" inputMode="decimal" value={goalFundAmount}
                    onChange={e => setGoalFundAmount(e.target.value)} placeholder={remaining.toString()} className="h-9 text-sm" />
                  <p className="text-xs text-muted-foreground">Leftover will be carried forward automatically.</p>
                </div>
              </div>
            )}

            {/* Custom split */}
            {closeOption === "custom" && (
              <div className="space-y-2.5 pl-2 border-l-2 border-primary/20 ml-4">
                {[
                  { label: "To Savings Account", val: customSavings, set: setCustomSavings },
                  { label: "To Investment Account", val: customInvestment, set: setCustomInvestment },
                  { label: "Carry Forward", val: customCarry, set: setCustomCarry },
                ].map(f => (
                  <div key={f.label} className="space-y-1">
                    <Label className="text-xs">{f.label}</Label>
                    <Input type="number" inputMode="decimal" value={f.val} onChange={e => f.set(e.target.value)} placeholder="0" className="h-9 text-sm" />
                  </div>
                ))}
                {(() => {
                  const sum = (parseFloat(customSavings) || 0) + (parseFloat(customInvestment) || 0) + (parseFloat(customCarry) || 0);
                  const balanced = Math.abs(sum - remaining) < 0.01;
                  return (
                    <p className={`text-xs ${balanced ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                      {balanced ? "Balanced ✓" : `${formatCurrency(sum, settings.currencySymbol)} / ${formatCurrency(remaining, settings.currencySymbol)}`}
                    </p>
                  );
                })()}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Note (optional)</Label>
              <Input placeholder="How was this month?" value={closeNote} onChange={e => setCloseNote(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleCloseMonth} className="flex-1" disabled={remaining < 0}>
              <Lock className="w-4 h-4 mr-2" /> Close Month
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PiggyBankIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z" />
      <path d="M2 9v1a2 2 0 0 0 2 2h1" />
      <path d="M16 11h0" />
    </svg>
  );
}

function Split() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" /><path d="m15 9 6-6" />
    </svg>
  );
}
