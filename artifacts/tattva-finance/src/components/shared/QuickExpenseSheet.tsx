import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useLocation } from "wouter";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function QuickExpenseSheet() {
  const [location] = useLocation();
  const { currentMonthBudget, currentMonthCategories, addExpense, settings } = useFinance();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");

  // Don't show FAB on setup page
  if (location === "/setup") return null;

  const handleOpen = () => {
    if (!currentMonthBudget) {
      toast.error("Set up a budget first before adding expenses");
      return;
    }
    // Guard: block adding expenses to a closed month (B6)
    if (currentMonthBudget.status === "closed") {
      toast.error("This month is closed — open a new month in the Planner");
      return;
    }
    // Pre-select first category if none selected
    if (!categoryId && currentMonthCategories.length > 0) {
      setCategoryId(currentMonthCategories[0].id);
    }
    setOpen(true);
  };

  const handleSave = () => {
    if (!currentMonthBudget) return;
    const amt = parseFloat(amount);
    if (!name.trim()) { toast.error("Enter an expense name"); return; }
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (!categoryId) { toast.error("Select a category"); return; }

    const category = currentMonthCategories.find(c => c.id === categoryId);
    if (!category) return;

    addExpense({
      name: name.trim(),
      amount: amt,
      categoryId,
      categoryName: category.name,
      notes: notes.trim() || undefined,
      budgetId: currentMonthBudget.id,
    });

    toast.success(`${name} added`);
    setName("");
    setAmount("");
    setNotes("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) handleSave();
  };

  return (
    <>
      {/* FAB */}
      <button
        data-testid="button-fab-add-expense"
        onClick={handleOpen}
        aria-label="Add expense"
        className="fixed bottom-20 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {/* Bottom Sheet */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[90dvh]">
          <DrawerHeader className="flex items-center justify-between pb-2">
            <DrawerTitle>Add Expense</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-4" onKeyDown={handleKeyDown}>
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="qe-name">What did you spend on?</Label>
              <Input
                id="qe-name"
                data-testid="input-quick-name"
                placeholder="Groceries, Coffee, Rent..."
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-12 text-base"
                autoFocus
              />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="qe-amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground pointer-events-none">
                  {settings.currencySymbol}
                </span>
                <Input
                  id="qe-amount"
                  data-testid="input-quick-amount"
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="h-12 pl-9 text-xl font-bold"
                  min="0"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger data-testid="select-quick-category" className="h-12 text-base">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
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
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="qe-notes" className="text-muted-foreground font-normal">
                Notes <span className="text-xs">(optional)</span>
              </Label>
              <Input
                id="qe-notes"
                placeholder="Any details..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="h-11"
              />
            </div>

            <Button
              data-testid="button-quick-save"
              onClick={handleSave}
              className="w-full h-13 text-base font-semibold"
              size="lg"
            >
              Save Expense
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
