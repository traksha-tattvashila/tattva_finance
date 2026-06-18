import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Plus, Trash2, PartyPopper, PiggyBank, Bike, Laptop, Plane, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GOAL_TEMPLATES = [
  { name: "Emergency Fund", icon: <ShieldCheck className="w-4 h-4" />, color: "#ef4444", suggested: 50000 },
  { name: "Vacation Fund", icon: <Plane className="w-4 h-4" />, color: "#3b82f6", suggested: 30000 },
  { name: "Bike Fund", icon: <Bike className="w-4 h-4" />, color: "#f59e0b", suggested: 80000 },
  { name: "Laptop Fund", icon: <Laptop className="w-4 h-4" />, color: "#8b5cf6", suggested: 60000 },
  { name: "Savings Goal", icon: <PiggyBank className="w-4 h-4" />, color: "#22c55e", suggested: 10000 },
];

export default function Goals() {
  const {
    goals,
    addGoal,
    deleteGoal,
    addFundsToGoal,
    currentMonthBudget,
    currentMonthExpenses,
    getTotalIncome,
    settings,
  } = useFinance();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [targetAmt, setTargetAmt] = useState("");
  const [startAmt, setStartAmt] = useState("");

  // Fund dialog
  const [fundGoalId, setFundGoalId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");

  const remainingBalance = currentMonthBudget
    ? getTotalIncome(currentMonthBudget) - currentMonthExpenses.reduce((s, e) => s + e.amount, 0)
    : 0;

  const fundingGoal = fundGoalId ? goals.find(g => g.id === fundGoalId) : null;

  const openTemplate = (tpl: typeof GOAL_TEMPLATES[0]) => {
    setGoalName(tpl.name);
    setTargetAmt(tpl.suggested.toString());
    setStartAmt("");
    setIsAddOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmt);
    const start = parseFloat(startAmt) || 0;
    if (!goalName.trim() || isNaN(target) || target <= 0) {
      toast.error("Enter a valid name and target amount");
      return;
    }
    addGoal({ name: goalName.trim(), targetAmount: target, currentAmount: start });
    toast.success("Goal created");
    setGoalName(""); setTargetAmt(""); setStartAmt("");
    setIsAddOpen(false);
  };

  const handleFund = () => {
    if (!fundGoalId) return;
    const amt = parseFloat(fundAmount);
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    addFundsToGoal(fundGoalId, amt);
    toast.success("Funds added to goal");
    setFundGoalId(null);
    setFundAmount("");
  };

  const handleFundFromBalance = (goalId: string) => {
    if (remainingBalance <= 0) { toast.error("No remaining balance this month"); return; }
    setFundGoalId(goalId);
    setFundAmount(remainingBalance.toFixed(0));
  };

  const activeGoals = goals
    .filter(g => !g.completedAt)
    .sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount));

  const completedGoals = goals
    .filter(g => !!g.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-sm text-muted-foreground">
            {goals.length === 0
              ? "Start your first savings goal"
              : `${activeGoals.length} active · ${settings.currencySymbol}${goals.reduce((s, g) => s + g.currentAmount, 0).toLocaleString("en-IN")} saved`}
          </p>
        </div>
        <Button onClick={() => { setGoalName(""); setTargetAmt(""); setStartAmt(""); setIsAddOpen(true); }} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" /> New Goal
        </Button>
      </div>

      {/* Balance hint */}
      {remainingBalance > 0 && activeGoals.length > 0 && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm">
          <PiggyBank className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-emerald-700 dark:text-emerald-400">
            You have <strong>{formatCurrency(remainingBalance, settings.currencySymbol)}</strong> remaining this month. Fund a goal!
          </span>
        </div>
      )}

      {/* Empty state + templates */}
      {goals.length === 0 && (
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">No goals yet</h3>
            <p className="text-sm text-muted-foreground">Create a savings goal to start building your future.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick start templates</p>
            <div className="grid grid-cols-1 gap-2.5">
              {GOAL_TEMPLATES.map(tpl => (
                <button key={tpl.name} onClick={() => openTemplate(tpl)}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: tpl.color }}>
                    {tpl.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground">Suggested: {formatCurrency(tpl.suggested, settings.currencySymbol)}</p>
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          {activeGoals.map(goal => {
            const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const remaining = goal.targetAmount - goal.currentAmount;
            const isNear = pct >= 75;
            return (
              <Card key={goal.id} className="overflow-hidden">
                <div className="h-1 w-full bg-secondary">
                  <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: isNear ? "#22c55e" : "hsl(var(--primary))" }} />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-semibold text-base">{goal.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(goal.currentAmount, settings.currencySymbol)} of {formatCurrency(goal.targetAmount, settings.currencySymbol)} · {pct.toFixed(0)}% done
                      </p>
                    </div>
                    <ConfirmDialog
                      title="Delete Goal"
                      description="Remove this savings goal? Your saved amount won't be affected."
                      onConfirm={() => deleteGoal(goal.id)}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      }
                    />
                  </div>

                  {/* Arc progress visualization */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="relative w-16 h-16 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3.5" />
                        <circle cx="18" cy="18" r="15.9" fill="none"
                          stroke={isNear ? "#22c55e" : "hsl(var(--primary))"}
                          strokeWidth="3.5"
                          strokeDasharray={`${pct} ${100 - pct}`}
                          strokeLinecap="round"
                          style={{ transition: "stroke-dasharray 0.5s ease" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Still needed</p>
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(remaining, settings.currencySymbol)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Saved: {formatCurrency(goal.currentAmount, settings.currencySymbol)}
                      </p>
                    </div>
                  </div>

                  {/* Fund actions */}
                  <div className="flex gap-2 pt-3 border-t border-border/50">
                    <Button size="sm" variant="outline" className="flex-1 h-9 text-xs"
                      onClick={() => { setFundGoalId(goal.id); setFundAmount(""); }}>
                      Add Funds
                    </Button>
                    {remainingBalance > 0 && (
                      <Button size="sm" className="flex-1 h-9 text-xs" onClick={() => handleFundFromBalance(goal.id)}>
                        <PiggyBank className="w-3.5 h-3.5 mr-1.5" />
                        From Balance
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <PartyPopper className="w-4 h-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Completed</h2>
          </div>
          {completedGoals.map(goal => (
            <Card key={goal.id} className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">{goal.name}</h3>
                  <p className="text-sm font-bold tabular-nums mt-0.5">{formatCurrency(goal.targetAmount, settings.currencySymbol)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full font-medium">Goal Reached</span>
                  <ConfirmDialog
                    title="Remove Goal"
                    description="Remove this completed goal?"
                    onConfirm={() => deleteGoal(goal.id)}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Goal Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Savings Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Goal Name</Label>
              <Input value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="Emergency Fund, New Phone..." autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Target Amount ({settings.currencySymbol})</Label>
              <Input type="number" inputMode="decimal" value={targetAmt} onChange={e => setTargetAmt(e.target.value)} placeholder="20000" min="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Already Saved ({settings.currencySymbol}) <span className="text-muted-foreground font-normal">— optional</span></Label>
              <Input type="number" inputMode="decimal" value={startAmt} onChange={e => setStartAmt(e.target.value)} placeholder="0" min="0" />
            </div>
            <Button type="submit" className="w-full h-11">Create Goal</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fund Goal Dialog */}
      <Dialog open={!!fundGoalId} onOpenChange={open => { if (!open) { setFundGoalId(null); setFundAmount(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Funds{fundingGoal ? ` — ${fundingGoal.name}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {remainingBalance > 0 && (
              <button onClick={() => setFundAmount(remainingBalance.toFixed(0))}
                className="w-full flex items-center justify-between bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 text-sm hover:bg-primary/10 transition-colors">
                <span className="text-muted-foreground">Use remaining balance</span>
                <span className="font-semibold text-primary tabular-nums">{formatCurrency(remainingBalance, settings.currencySymbol)}</span>
              </button>
            )}
            <div className="space-y-1.5">
              <Label>Amount ({settings.currencySymbol})</Label>
              <Input type="number" inputMode="decimal" value={fundAmount} onChange={e => setFundAmount(e.target.value)} placeholder="0" min="0" autoFocus className="h-12 text-lg" />
            </div>
            <Button onClick={handleFund} className="w-full h-11">Add to Goal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
