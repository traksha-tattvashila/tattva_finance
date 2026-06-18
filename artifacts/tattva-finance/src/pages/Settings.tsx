import React, { useState, useRef } from "react";
import { Link } from "wouter";
import { useFinance } from "@/context/FinanceContext";
import { exportToJSON } from "@/utils/export";
import { getCurrentMonthStr, formatMonth } from "@/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Download, Upload, Trash2, RotateCcw, Wrench, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Settings() {
  const {
    settings,
    updateSettings,
    clearMonthlyExpenses,
    clearAllData,
    importData,
    budgets,
    categories,
    expenses,
    goals,
    additionalIncomeEntries,
    accounts,
    accountTransfers,
    rollovers,
  } = useFinance();

  const [appName, setAppName] = useState(settings.appName);
  const [currency, setCurrency] = useState(settings.currencySymbol);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentMonth = getCurrentMonthStr();

  const handleSave = () => {
    updateSettings({
      appName: appName.trim() || "Tattva Finance",
      currencySymbol: currency.trim() || "₹",
    });
    toast.success("Settings saved");
  };

  const handleBackup = () => {
    exportToJSON(`tattva_backup_${new Date().toISOString().split("T")[0]}.json`, {
      settings,
      budgets,
      additionalIncomeEntries,
      categories,
      expenses,
      goals,
      accounts,
      accountTransfers,
      rollovers,
    });
    toast.success("Backup downloaded");
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        importData(data);
        toast.success("Data restored successfully");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch {
        toast.error("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      {/* General */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">General</CardTitle>
          <CardDescription>Customise your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>App Name</Label>
              <Input value={appName} onChange={e => setAppName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency Symbol</Label>
              <Input value={currency} onChange={e => setCurrency(e.target.value)} className="w-24" />
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-border/50">
            <div>
              <Label className="text-sm font-medium">Dark Mode</Label>
              <p className="text-xs text-muted-foreground">Switch to a darker theme</p>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={checked => updateSettings({ darkMode: checked })}
            />
          </div>

          <Button onClick={handleSave} className="w-full">Save Settings</Button>
        </CardContent>
      </Card>

      {/* Budget Style */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Budget Mode</CardTitle>
          <CardDescription>Choose how much detail you want to see</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(["simple", "detailed"] as const).map(style => (
            <button
              key={style}
              onClick={() => updateSettings({ budgetStyle: style })}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all",
                settings.budgetStyle === style ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                settings.budgetStyle === style ? "border-primary" : "border-muted-foreground"
              )}>
                {settings.budgetStyle === style && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <div>
                <p className="text-sm font-semibold capitalize">{style} Budget</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {style === "simple"
                    ? "Income, expenses, balance. Clean and focused."
                    : "Carry forward, additional income, month-end rollovers, accounts."}
                </p>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Advanced Tools link */}
      <Link href="/advanced">
        <Card className="hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Advanced Finance Tools</p>
              <p className="text-xs text-muted-foreground mt-0.5">Accounts, transfers, rollover history, financial records</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardContent>
        </Card>
      </Link>

      {/* Data Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Data Management</CardTitle>
          <CardDescription>Backup, restore, or reset your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleBackup} className="h-11">
              <Download className="w-4 h-4 mr-2" /> Backup
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="h-11">
              <Upload className="w-4 h-4 mr-2" /> Restore
            </Button>
          </div>
          <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleRestore} />

          <div className="space-y-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between p-3 border border-destructive/20 bg-destructive/5 rounded-xl">
              <div>
                <p className="text-sm font-medium text-destructive">Reset This Month</p>
                <p className="text-xs text-muted-foreground">Clear expenses for {formatMonth(currentMonth)}</p>
              </div>
              <ConfirmDialog
                title={`Reset ${formatMonth(currentMonth)}?`}
                description="This deletes all expenses for the current month. Budget and categories stay intact."
                onConfirm={() => { clearMonthlyExpenses(currentMonth); toast.success("Month expenses cleared"); }}
                trigger={
                  <Button variant="destructive" size="sm" className="shrink-0">
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
                  </Button>
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border border-destructive/20 bg-destructive/10 rounded-xl">
              <div>
                <p className="text-sm font-medium text-destructive">Erase Everything</p>
                <p className="text-xs text-muted-foreground">Permanently delete all data</p>
              </div>
              <ConfirmDialog
                title="ARE YOU ABSOLUTELY SURE?"
                description="This permanently deletes your entire financial history. This cannot be undone."
                onConfirm={() => { clearAllData(); toast.success("All data cleared"); window.location.href = "/"; }}
                trigger={
                  <Button variant="destructive" size="sm" className="shrink-0">
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Erase
                  </Button>
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
