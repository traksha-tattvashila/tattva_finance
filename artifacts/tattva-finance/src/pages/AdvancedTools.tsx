import React from "react";
import { Link } from "wouter";
import {
  Landmark,
  ArrowRightLeft,
  RefreshCw,
  FileText,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TOOLS = [
  {
    href: "/accounts",
    icon: <Landmark className="w-5 h-5" />,
    color: "bg-blue-500",
    title: "Accounts",
    description: "Manage Cash, Bank, Savings, Investment, and Emergency Fund balances.",
  },
  {
    href: "/accounts",
    icon: <ArrowRightLeft className="w-5 h-5" />,
    color: "bg-violet-500",
    title: "Transfers",
    description: "Move money between your accounts and track transfer history.",
  },
  {
    href: "/reports",
    icon: <RefreshCw className="w-5 h-5" />,
    color: "bg-teal-500",
    title: "Rollover History",
    description: "View how you allocated your remaining balance at the end of each month.",
  },
  {
    href: "/reports",
    icon: <FileText className="w-5 h-5" />,
    color: "bg-amber-500",
    title: "Financial Records",
    description: "Browse all transactions and budgets across past months with export options.",
  },
];

export default function AdvancedTools() {
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Advanced Finance Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Powerful features for detailed financial management.
        </p>
      </div>

      <div className="space-y-3">
        {TOOLS.map(tool => (
          <Link key={tool.title} href={tool.href}>
            <Card className="hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-11 h-11 ${tool.color} rounded-xl flex items-center justify-center text-white shrink-0`}>
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{tool.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tool.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="pt-2">
        <p className="text-xs text-muted-foreground text-center">
          You can also switch to Detailed Budget mode in{" "}
          <Link href="/settings" className="text-primary underline underline-offset-2">Settings</Link>{" "}
          to unlock additional income entries and carry-forward controls.
        </p>
      </div>
    </div>
  );
}
