import React from "react";
import { Link, useLocation } from "wouter";
import { useFinance } from "@/context/FinanceContext";
import {
  LayoutDashboard,
  CalendarDays,
  Receipt,
  PieChart,
  Target,
  Settings,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: CalendarDays,    label: "Planner",   href: "/planner" },
  { icon: Receipt,         label: "Expenses",  href: "/expenses" },
  { icon: Target,          label: "Goals",     href: "/goals" },
  { icon: PieChart,        label: "Reports",   href: "/reports" },
  { icon: Settings,        label: "Settings",  href: "/settings" },
];

export const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const { settings, updateSettings } = useFinance();

  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-border bg-sidebar h-screen sticky top-0 shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 pb-4">
        <h1 className="text-xl font-serif font-bold text-primary tracking-tight leading-tight">
          {settings.appName}
        </h1>
        <p className="text-[10px] text-muted-foreground mt-1 tracking-widest uppercase">
          Personal Finance
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm group ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isActive ? "bg-primary/15" : "group-hover:bg-secondary"
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1 h-4 rounded-full bg-primary shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground/70">by Tattvashila</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => updateSettings({ darkMode: !settings.darkMode })}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Toggle dark mode"
        >
          {settings.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  );
};
