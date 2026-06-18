import React from "react";
import { Link, useLocation } from "wouter";
import { navItems } from "./Sidebar";

export const BottomNav: React.FC = () => {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm pb-safe flex items-stretch justify-around z-50">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors min-w-0 ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${isActive ? "bg-primary/10" : ""}`}>
              <Icon className="w-[18px] h-[18px] shrink-0" />
            </div>
            <span className="text-[9px] font-medium leading-tight mt-0.5 truncate w-full text-center px-0.5">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
