import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFinance } from "@/context/FinanceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { formatMonth, getCurrentMonthStr } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const DEFAULT_CATEGORIES = [
  { name: "Rent", color: "#3b82f6" },
  { name: "Food", color: "#10b981" },
  { name: "Travel", color: "#f59e0b" },
  { name: "Personal", color: "#8b5cf6" },
  { name: "Savings", color: "#22c55e" },
  { name: "Emergency", color: "#ef4444" },
  { name: "Other", color: "#6b7280" },
];

type BudgetStyle = "simple" | "detailed";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function Setup() {
  const { addBudget, addCategory, updateSettings, settings } = useFinance();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [income, setIncome] = useState("");
  const [budgetStyle, setBudgetStyle] = useState<BudgetStyle>("simple");
  const [creating, setCreating] = useState(false);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const handleFinish = async () => {
    setCreating(true);
    const inc = parseFloat(income) || 0;
    const budget = addBudget({ month: getCurrentMonthStr(), salaryIncome: inc });
    DEFAULT_CATEGORIES.forEach(cat =>
      addCategory({ name: cat.name, color: cat.color, allocatedAmount: 0, budgetId: budget.id })
    );
    updateSettings({ hasCompletedSetup: true, budgetStyle });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Progress bar (steps 2-4) */}
      {step > 1 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-border z-50">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${((step - 1) / 3) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: "easeInOut" }}
          className="flex-1 flex flex-col"
        >
          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-primary/25"
              >
                <Wallet className="w-10 h-10 text-primary-foreground" />
              </motion.div>

              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <h1 className="text-4xl font-bold text-primary mb-2 tracking-tight">
                  {settings.appName}
                </h1>
                <p className="text-lg text-foreground font-medium mb-3">
                  Your personal financial companion
                </p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Track income, manage expenses, grow savings — all in one calm, simple place.
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="mt-12 w-full max-w-xs"
              >
                <Button size="lg" className="w-full h-14 text-base" onClick={() => go(2)}>
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>

              <p className="mt-6 text-xs text-muted-foreground">
                All data stays on your device. No account required.
              </p>
            </div>
          )}

          {/* ── Step 2: Income ── */}
          {step === 2 && (
            <div className="flex-1 flex flex-col px-6 pt-12 pb-8 max-w-md mx-auto w-full">
              <button
                onClick={() => go(1)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground mb-10 self-start hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex-1 flex flex-col justify-center">
                <div className="mb-8">
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest">Step 1 of 3</span>
                  <h2 className="text-3xl font-bold mt-2 mb-2">What's your monthly income?</h2>
                  <p className="text-muted-foreground text-sm">
                    Enter your salary or primary income for {formatMonth(getCurrentMonthStr())}.
                  </p>
                </div>

                <div className="relative mb-3">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground pointer-events-none">
                    {settings.currencySymbol}
                  </span>
                  <Input
                    data-testid="input-setup-income"
                    type="number"
                    inputMode="decimal"
                    placeholder="15000"
                    value={income}
                    onChange={e => setIncome(e.target.value)}
                    className="pl-10 h-16 text-2xl font-bold"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You can update this anytime. Additional income can be added later.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-base mt-8"
                onClick={() => {
                  if (!income || parseFloat(income) <= 0) return;
                  go(3);
                }}
                disabled={!income || parseFloat(income) <= 0}
              >
                Continue <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}

          {/* ── Step 3: Budget Style ── */}
          {step === 3 && (
            <div className="flex-1 flex flex-col px-6 pt-12 pb-8 max-w-md mx-auto w-full">
              <button
                onClick={() => go(2)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground mb-10 self-start hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex-1 flex flex-col justify-center">
                <div className="mb-8">
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest">Step 2 of 3</span>
                  <h2 className="text-3xl font-bold mt-2 mb-2">How do you want to budget?</h2>
                  <p className="text-muted-foreground text-sm">
                    You can always switch this later in Settings.
                  </p>
                </div>

                <div className="space-y-4">
                  <StyleCard
                    selected={budgetStyle === "simple"}
                    onClick={() => setBudgetStyle("simple")}
                    title="Simple Budget"
                    badge="Recommended"
                    description="Set your income, add expenses, see your remaining balance. Perfect for getting started."
                    features={["Income tracking", "Expense logging", "Category overview", "Savings goals"]}
                  />
                  <StyleCard
                    selected={budgetStyle === "detailed"}
                    onClick={() => setBudgetStyle("detailed")}
                    title="Detailed Budget"
                    description="Full control with carry forwards, additional income entries, account management, and rollovers."
                    features={["Everything in Simple", "Carry forward", "Account transfers", "Month-end rollover"]}
                  />
                </div>
              </div>

              <Button size="lg" className="w-full h-14 text-base mt-8" onClick={() => go(4)}>
                Continue <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}

          {/* ── Step 4: Ready ── */}
          {step === 4 && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-md mx-auto w-full">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/30"
              >
                <Check className="w-10 h-10 text-white" strokeWidth={3} />
              </motion.div>

              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
              >
                <h2 className="text-3xl font-bold mb-3">You're all set!</h2>
                <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">
                  Your budget for {formatMonth(getCurrentMonthStr())} is ready. 7 default categories have been set up for you.
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="w-full max-w-xs space-y-3"
              >
                <div className="bg-secondary/60 rounded-xl p-4 text-left space-y-2.5">
                  <SummaryRow label="Monthly Income" value={`${settings.currencySymbol}${parseFloat(income).toLocaleString("en-IN")}`} />
                  <SummaryRow label="Budget Style" value={budgetStyle === "simple" ? "Simple" : "Detailed"} />
                  <SummaryRow label="Categories" value="7 default" />
                </div>

                <Button
                  size="lg"
                  className="w-full h-14 text-base"
                  onClick={handleFinish}
                  disabled={creating}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {creating ? "Setting up..." : "Start Tracking"}
                </Button>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StyleCard({
  selected,
  onClick,
  title,
  badge,
  description,
  features,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  badge?: string;
  description: string;
  features: string[];
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border-2 p-5 transition-all",
        selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-border/80"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5", selected ? "border-primary" : "border-border")}>
            {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <span className="font-semibold text-base">{title}</span>
        </div>
        {badge && (
          <span className="text-[10px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-3 ml-6">{description}</p>
      <div className="ml-6 space-y-1">
        {features.map(f => (
          <div key={f} className="flex items-center gap-1.5">
            <Check className="w-3 h-3 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">{f}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
