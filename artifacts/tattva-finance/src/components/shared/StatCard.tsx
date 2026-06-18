import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { useFinance } from "@/context/FinanceContext";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp }) => {
  const { settings } = useFinance();
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1 tracking-tight">
              {formatCurrency(value, settings.currencySymbol)}
            </h3>
            {trend && (
              <p className={`text-xs mt-2 ${trendUp ? "text-green-500" : "text-destructive"}`}>
                {trend}
              </p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
