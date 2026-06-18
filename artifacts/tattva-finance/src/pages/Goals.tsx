import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GOAL_TEMPLATES = [
  { name: "Emergency Fund",  emoji: "🛡️", color: "#EF4444", suggested: 50000 },
  { name: "Vacation Fund",   emoji: "✈️", color: "#3B82F6", suggested: 30000 },
  { name: "Marriage Fund",   emoji: "💍", color: "#EC4899", suggested: 200000 },
  { name: "Vehicle Fund",    emoji: "🚗", color: "#F59E0B", suggested: 100000 },
  { name: "Laptop Fund",     emoji: "💻", color: "#8B5CF6", suggested: 60000 },
  { name: "Home Fund",       emoji: "🏠", color: "#10B981", suggested: 500000 },
];

function getGoalEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("emergency") || n.includes("shield")) return "🛡️";
  if (n.includes("vacation") || n.includes("travel") || n.includes("trip")) return "✈️";
  if (n.includes("marriage") || n.includes("wedding") || n.includes("ring")) return "💍";
  if (n.includes("bike") || n.includes("motorcycle")) return "🏍️";
  if (n.includes("car") || n.includes("vehicle") || n.includes("auto")) return "🚗";
  if (n.includes("laptop") || n.includes("computer") || n.includes("mac")) return "💻";
  if (n.includes("phone") || n.includes("mobile")) return "📱";
  if (n.includes("home") || n.includes("house") || n.includes("flat")) return "🏠";
  if (n.includes("education") || n.includes("study") || n.includes("course")) return "🎓";
  if (n.includes("retirement") || n.includes("pension")) return "🏖️";
  if (n.includes("invest") || n.includes("stock")) return "📈";
  if (n.includes("health") || n.includes("medical")) return "🏥";
  return "🎯";
}

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

  const [fundGoalId, setFundGoalId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

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
    toast.success("Goal created!");
    setGoalName(""); setTargetAmt(""); setStartAmt("");
    setIsAddOpen(false);
  };

  const handleFund = () => {
    if (!fundGoalId) return;
    const amt = parseFloat(fundAmount);
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    const goal = goals.find(g => g.id === fundGoalId);
    const wasComplete = goal ? goal.currentAmount >= goal.targetAmount : false;
    addFundsToGoal(fundGoalId, amt);
    const updatedGoal = goals.find(g => g.id === fundGoalId);
    const nowComplete = updatedGoal ? (updatedGoal.currentAmount + amt) >= updatedGoal.targetAmount : false;
    if (!wasComplete && nowComplete) {
      setJustCompleted(fundGoalId);
      setTimeout(() => setJustCompleted(null), 4000);
    }
    toast.success(`Added ${formatCurrency(amt, settings.currencySymbol)} to goal`);
    setFundGoalId(null);
    setFundAmount("");
  };

  const handleFundFromBalance = (goalId: string) => {
    if (remainingBalance <= 0) { toast.error("No remaining balance this month"); return; }
    setFundGoalId(goalId);
    setFundAmount(remainingBalance.toFixed(0));
  };

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const activeGoals = goals.filter(g => !g.completedAt)
    .sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount));
  const completedGoals = goals.filter(g => !!g.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {goals.length === 0
              ? "Define what you're saving for"
              : `${settings.currencySymbol}${totalSaved.toLocaleString("en-IN")} saved across ${goals.length} goal${goals.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button
          onClick={() => { setGoalName(""); setTargetAmt(""); setStartAmt(""); setIsAddOpen(true); }}
          className="shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Goal
        </Button>
      </div>

      {/* Balance hint */}
      {remainingBalance > 0 && activeGoals.length > 0 && (
        <div className="flex items-center gap-3 bg-primary/8 border border-primary/15 rounded-2xl px-4 py-3">
          <span className="text-xl">💰</span>
          <div>
            <p className="text-sm font-semibold text-primary">
              {formatCurrency(remainingBalance, settings.currencySymbol)} available this month
            </p>
            <p className="text-xs text-muted-foreground">Tap "From Balance" on any goal to allocate it</p>
          </div>
        </div>
      )}

      {/* Empty state with templates */}
      {goals.length === 0 && (
        <div className="space-y-5">
          <div className="text-center py-10">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-lg font-bold mb-1.5">What are you saving for?</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Set a savings goal and track your progress month by month.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Popular Goals
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {GOAL_TEMPLATES.map(tpl => (
                <button
                  key={tpl.name}
                  onClick={() => openTemplate(tpl)}
                  className="flex flex-col items-start gap-2 p-4 rounded-2xl border-2 border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all text-left"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: tpl.color + "20" }}
                  >
                    {tpl.emoji}
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-tight">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {settings.currencySymbol}{(tpl.suggested / 1000).toFixed(0)}K target
                    </p>
                  </div>
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
            const isNearComplete = pct >= 75;
            const emoji = getGoalEmoji(goal.name);
            const isJustCompleted = justCompleted === goal.id;

            return (
              <AnimatePresence key={goal.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`overflow-hidden transition-all ${isJustCompleted ? "ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20" : ""}`}>
                    {/* Colored accent top bar */}
                    <div
                      className="h-1 w-full transition-all"
                      style={{
                        width: "100%",
                        background: `linear-gradient(to right, ${isNearComplete ? "#10B981" : "hsl(var(--primary))"} ${pct}%, hsl(var(--secondary)) ${pct}%)`,
                      }}
                    />

                    {isJustCompleted && (
                      <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-center py-2 text-sm font-semibold flex items-center justify-center gap-2">
                        <span>🎉</span> Goal Reached! Congratulations!
                      </div>
                    )}

                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 mt-0.5"
                          style={{ backgroundColor: isNearComplete ? "#10B98120" : "hsl(var(--primary)/0.1)" }}
                        >
                          {emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h3 className="font-bold text-base leading-tight">{goal.name}</h3>
                            <ConfirmDialog
                              title="Delete Goal"
                              description="Remove this savings goal? Your progress won't be lost from your records."
                              onConfirm={() => deleteGoal(goal.id)}
                              trigger={
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 -mt-1 -mr-1">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              }
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatCurrency(remaining, settings.currencySymbol)} to go
                          </p>
                        </div>
                      </div>

                      {/* Arc progress */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-16 h-16 shrink-0">
                          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                            <circle
                              cx="18" cy="18" r="15.9"
                              fill="none"
                              stroke="hsl(var(--secondary))"
                              strokeWidth="3"
                            />
                            <circle
                              cx="18" cy="18" r="15.9"
                              fill="none"
                              stroke={isNearComplete ? "#10B981" : "hsl(var(--primary))"}
                              strokeWidth="3"
                              strokeDasharray={`${pct} ${100 - pct}`}
                              strokeLinecap="round"
                              style={{ transition: "stroke-dasharray 0.6s ease" }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold">{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Saved</span>
                            <span className="font-semibold tabular-nums">{formatCurrency(goal.currentAmount, settings.currencySymbol)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Target</span>
                            <span className="font-semibold tabular-nums">{formatCurrency(goal.targetAmount, settings.currencySymbol)}</span>
                          </div>
                          {remaining > 0 && remainingBalance > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Months left</span>
                              <span className="font-semibold tabular-nums">
                                ~{Math.ceil(remaining / remainingBalance)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-9 text-xs"
                          onClick={() => { setFundGoalId(goal.id); setFundAmount(""); }}
                        >
                          Add Funds
                        </Button>
                        {remainingBalance > 0 && (
                          <Button
                            size="sm"
                            className="flex-1 h-9 text-xs"
                            onClick={() => handleFundFromBalance(goal.id)}
                          >
                            💰 From Balance
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            );
          })}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-lg">🏆</div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Completed
            </h2>
          </div>
          {completedGoals.map(goal => (
            <Card key={goal.id} className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl shrink-0">
                  {getGoalEmoji(goal.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-400">{goal.name}</h3>
                  <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                    {formatCurrency(goal.targetAmount, settings.currencySymbol)} achieved
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
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
            <DialogTitle>New Savings Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Goal Name</Label>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
                  {goalName ? getGoalEmoji(goalName) : "🎯"}
                </div>
                <Input
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                  placeholder="Emergency Fund, Vacation..."
                  autoFocus
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Target Amount ({settings.currencySymbol})</Label>
              <Input
                type="number" inputMode="decimal"
                value={targetAmt} onChange={e => setTargetAmt(e.target.value)}
                placeholder="50000" min="0"
                className="h-12 text-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground font-normal">
                Already saved ({settings.currencySymbol}) <span className="text-xs">— optional</span>
              </Label>
              <Input
                type="number" inputMode="decimal"
                value={startAmt} onChange={e => setStartAmt(e.target.value)}
                placeholder="0" min="0"
              />
            </div>
            <Button type="submit" className="w-full h-11">Create Goal</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fund Goal Dialog */}
      <Dialog open={!!fundGoalId} onOpenChange={open => { if (!open) { setFundGoalId(null); setFundAmount(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {fundingGoal ? `${getGoalEmoji(fundingGoal.name)} Add to ${fundingGoal.name}` : "Add Funds"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {remainingBalance > 0 && (
              <button
                onClick={() => setFundAmount(remainingBalance.toFixed(0))}
                className="w-full flex items-center justify-between bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 hover:bg-primary/10 transition-colors"
              >
                <span className="text-sm text-muted-foreground">Use this month's remaining balance</span>
                <span className="font-bold text-primary tabular-nums">{formatCurrency(remainingBalance, settings.currencySymbol)}</span>
              </button>
            )}
            <div className="space-y-1.5">
              <Label>Amount ({settings.currencySymbol})</Label>
              <Input
                type="number" inputMode="decimal"
                value={fundAmount} onChange={e => setFundAmount(e.target.value)}
                placeholder="0" min="0"
                className="h-14 text-2xl font-bold"
                autoFocus
              />
            </div>
            <Button onClick={handleFund} className="w-full h-11">Add to Goal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
