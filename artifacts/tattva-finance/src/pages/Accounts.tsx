import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Banknote, Building2, PiggyBank, TrendingUp, ShieldCheck, ArrowRightLeft, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Account } from "@/types/finance";
import { Badge } from "@/components/ui/badge";

const ACCOUNT_ICONS: Record<Account["type"], React.ReactNode> = {
  cash: <Banknote className="w-5 h-5" />,
  bank: <Building2 className="w-5 h-5" />,
  savings: <PiggyBank className="w-5 h-5" />,
  investment: <TrendingUp className="w-5 h-5" />,
  emergency: <ShieldCheck className="w-5 h-5" />,
};

const ACCOUNT_TYPE_LABELS: Record<Account["type"], string> = {
  cash: "Cash",
  bank: "Bank",
  savings: "Savings",
  investment: "Investment",
  emergency: "Emergency",
};

export default function Accounts() {
  const { accounts, updateAccount, accountTransfers, transferBetweenAccounts, settings } = useFinance();

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");

  // Inline balance editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState("");

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const handleTransfer = () => {
    if (!fromId || !toId || fromId === toId) {
      toast.error("Select two different accounts");
      return;
    }
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const from = accounts.find(a => a.id === fromId);
    if (from && from.balance < amount) {
      toast.error(`Insufficient balance in ${from.name}`);
      return;
    }
    transferBetweenAccounts(fromId, toId, amount, transferNote || undefined);
    toast.success("Transfer recorded");
    setTransferAmount("");
    setTransferNote("");
  };

  const handleStartEdit = (account: Account) => {
    setEditingId(account.id);
    setEditBalance(account.balance.toString());
  };

  const handleSaveBalance = (id: string) => {
    const val = parseFloat(editBalance);
    if (isNaN(val)) {
      toast.error("Enter a valid balance");
      return;
    }
    updateAccount(id, { balance: val });
    setEditingId(null);
    toast.success("Balance updated");
  };

  const recentTransfers = [...accountTransfers]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Accounts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Total net worth: <span className="font-semibold text-foreground">{formatCurrency(totalBalance, settings.currencySymbol)}</span>
        </p>
      </div>

      {/* Account cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(account => (
          <Card key={account.id} className="overflow-hidden">
            <div className="h-1.5 w-full" style={{ backgroundColor: account.color }} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: account.color }}
                  >
                    {ACCOUNT_ICONS[account.type]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{account.name}</p>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 mt-0.5">
                      {ACCOUNT_TYPE_LABELS[account.type]}
                    </Badge>
                  </div>
                </div>
                <Button
                  data-testid={`button-edit-balance-${account.id}`}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => handleStartEdit(account)}
                  title="Edit balance"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>

              {editingId === account.id ? (
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                      {settings.currencySymbol}
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      className="pl-7 h-8 text-sm"
                      value={editBalance}
                      onChange={e => setEditBalance(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <Button
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleSaveBalance(account.id)}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <p className="text-2xl font-bold tabular-nums" style={{ color: account.color }}>
                  {formatCurrency(account.balance, settings.currencySymbol)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transfer form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Transfer Between Accounts</CardTitle>
          </div>
          <CardDescription>Move balance from one account to another</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>From Account</Label>
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger data-testid="select-from-account">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance, settings.currencySymbol)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Account</Label>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger data-testid="select-to-account">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter(a => a.id !== fromId)
                    .map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount ({settings.currencySymbol})</Label>
              <Input
                data-testid="input-transfer-amount"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={transferAmount}
                onChange={e => setTransferAmount(e.target.value)}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Monthly savings"
                  value={transferNote}
                  onChange={e => setTransferNote(e.target.value)}
                  className="flex-1"
                />
                <Button
                  data-testid="button-transfer"
                  onClick={handleTransfer}
                  className="shrink-0"
                >
                  Transfer
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transfer History</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransfers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No transfers yet.</p>
          ) : (
            <div className="divide-y divide-border/50">
              {recentTransfers.map(t => (
                <div key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {t.fromAccountName} → {t.toAccountName}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                        {t.note && (
                          <p className="text-xs text-muted-foreground italic">{t.note}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums text-sm">
                    {formatCurrency(t.amount, settings.currencySymbol)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
