import React from "react";
import { Link, useLocation } from "wouter";
import { useFinance } from "@/context/FinanceContext";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  PieChart,
  Target,
  Settings,
  Moon,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Wallet, label: "Budget", href: "/budget" },
  { icon: Receipt, label: "Expenses", href: "/expenses" },
  { icon: PieChart, label: "Reports", href: "/reports" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const { settings, updateSettings } = useFinance();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-serif font-bold text-primary tracking-tight">
          {settings.appName}
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {settings.appName}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => updateSettings({ darkMode: !settings.darkMode })}
          className="text-muted-foreground hover:text-foreground"
        >
          {settings.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  );
};
