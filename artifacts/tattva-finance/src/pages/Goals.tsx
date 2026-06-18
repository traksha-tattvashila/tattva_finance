import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Target, Plus, Trash2, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";

export default function Goals() {
  const { goals, addGoal, deleteGoal, addFundsToGoal, settings } = useFinance();
  
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [fundAmounts, setFundAmounts] = useState<Record<string, string>>({});

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;

    if (!name || isNaN(target) || target <= 0) {
      toast.error("Please provide a valid name and target amount");
      return;
    }

    addGoal({
      name,
      targetAmount: target,
      currentAmount: current
    });

    toast.success("Goal created successfully");
    setName("");
    setTargetAmount("");
    setCurrentAmount("");
    setIsAddOpen(false);
  };

  const handleAddFunds = (id: string) => {
    const amt = parseFloat(fundAmounts[id]);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    addFundsToGoal(id, amt);
    setFundAmounts({ ...fundAmounts, [id]: "" });
    toast.success("Funds added to goal");
  };

  const activeGoals = goals.filter(g => !g.completedAt).sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount));
  const completedGoals = goals.filter(g => g.completedAt).sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGoal} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Goal Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Emergency Fund, Vacation..." />
              </div>
              <div className="space-y-2">
                <Label>Target Amount ({settings.currencySymbol})</Label>
                <Input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="10000" />
              </div>
              <div className="space-y-2">
                <Label>Initial Saved Amount ({settings.currencySymbol})</Label>
                <Input type="number" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} placeholder="0" />
              </div>
              <Button type="submit" className="w-full">Create Goal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-8 h-8" />}
          title="No savings goals"
          description="Create a goal to start tracking your savings progress."
        />
      ) : (
        <div className="space-y-8">
          {activeGoals.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b border-border pb-2">Active Goals</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeGoals.map(goal => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  const remaining = goal.targetAmount - goal.currentAmount;
                  
                  return (
                    <Card key={goal.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{goal.name}</CardTitle>
                          <ConfirmDialog
                            title="Delete Goal"
                            description="Are you sure you want to delete this goal? Your savings will not be affected, but tracking will be removed."
                            onConfirm={() => deleteGoal(goal.id)}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive -mt-2 -mr-2">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            }
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-bold">{formatCurrency(goal.currentAmount, settings.currencySymbol)}</span>
                          <span className="text-muted-foreground">of {formatCurrency(goal.targetAmount, settings.currencySymbol)}</span>
                        </div>
                        <ProgressBar progress={progress} color="var(--chart-3)" height="lg" />
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{progress.toFixed(1)}% complete</span>
                          <span>{formatCurrency(remaining, settings.currencySymbol)} left</span>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-border/50">
                          <Input 
                            type="number" 
                            placeholder="Amount" 
                            value={fundAmounts[goal.id] || ""}
                            onChange={(e) => setFundAmounts({...fundAmounts, [goal.id]: e.target.value})}
                            className="h-8"
                          />
                          <Button size="sm" className="h-8 shrink-0" onClick={() => handleAddFunds(goal.id)}>Add Funds</Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="space-y-4 opacity-80">
              <h2 className="text-xl font-semibold border-b border-border pb-2 flex items-center gap-2 text-green-600 dark:text-green-500">
                <PartyPopper className="w-5 h-5" /> Completed
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {completedGoals.map(goal => (
                  <Card key={goal.id} className="bg-secondary/30 border-green-500/20">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg text-green-700 dark:text-green-400">{goal.name}</CardTitle>
                        <ConfirmDialog
                          title="Delete Goal"
                          description="Are you sure you want to remove this completed goal?"
                          onConfirm={() => deleteGoal(goal.id)}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive -mt-2 -mr-2">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          }
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">{formatCurrency(goal.targetAmount, settings.currencySymbol)}</span>
                        <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full font-medium">Goal Reached!</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
