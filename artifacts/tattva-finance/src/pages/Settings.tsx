import React, { useState, useRef } from "react";
import { useFinance } from "@/context/FinanceContext";
import { exportToJSON } from "@/utils/export";
import { getCurrentMonthStr, formatMonth } from "@/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Download, Upload, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { 
    settings, 
    updateSettings, 
    clearMonthlyExpenses, 
    clearAllData, 
    importData,
    budgets, categories, expenses, goals 
  } = useFinance();

  const [appName, setAppName] = useState(settings.appName);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentMonth = getCurrentMonthStr();

  const handleSaveGeneral = () => {
    updateSettings({
      appName: appName.trim() || "Tattva Finance",
      currencySymbol: currencySymbol.trim() || "₹"
    });
    toast.success("Settings saved");
  };

  const handleBackup = () => {
    const data = {
      settings,
      budgets,
      categories,
      expenses,
      goals
    };
    exportToJSON(`tattva_backup_${new Date().toISOString().split('T')[0]}.json`, data);
    toast.success("Backup downloaded");
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        importData(data);
        toast.success("Data restored successfully");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (error) {
        toast.error("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Customize your application experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>App Name</Label>
              <Input value={appName} onChange={e => setAppName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Currency Symbol</Label>
              <Input value={currencySymbol} onChange={e => setCurrencySymbol(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border/50 pt-6">
            <div>
              <Label className="text-base">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Toggle application theme</p>
            </div>
            <Switch 
              checked={settings.darkMode} 
              onCheckedChange={(checked) => updateSettings({ darkMode: checked })} 
            />
          </div>
          <Button onClick={handleSaveGeneral}>Save General Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Backup, restore, or reset your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex-1" onClick={handleBackup}>
              <Download className="w-4 h-4 mr-2" /> Backup Data
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Restore Backup
            </Button>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleRestore} 
            />
          </div>

          <div className="pt-6 border-t border-border/50 space-y-4">
            <div className="flex items-center justify-between p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
              <div>
                <p className="font-medium text-destructive">Reset Current Month</p>
                <p className="text-sm text-muted-foreground">Delete all expenses for {formatMonth(currentMonth)} (keeps categories)</p>
              </div>
              <ConfirmDialog
                title={`Reset ${formatMonth(currentMonth)}?`}
                description="This will delete all expenses for the current month. Categories and budget will remain intact."
                onConfirm={() => {
                  clearMonthlyExpenses(currentMonth);
                  toast.success("Month expenses cleared");
                }}
                trigger={<Button variant="destructive" size="sm"><RotateCcw className="w-4 h-4 mr-2" /> Reset Month</Button>}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
              <div>
                <p className="font-medium text-destructive">Clear All Data</p>
                <p className="text-sm text-muted-foreground">Permanently delete everything (budgets, expenses, goals)</p>
              </div>
              <ConfirmDialog
                title="ARE YOU ABSOLUTELY SURE?"
                description="This action cannot be undone. This will permanently delete your entire financial history from this browser."
                onConfirm={() => {
                  clearAllData();
                  toast.success("All data cleared");
                  window.location.href = "/";
                }}
                trigger={<Button variant="destructive" size="sm"><Trash2 className="w-4 h-4 mr-2" /> Erase Everything</Button>}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
