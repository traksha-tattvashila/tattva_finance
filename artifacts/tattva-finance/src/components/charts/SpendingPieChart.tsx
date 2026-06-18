import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/utils/formatters";

interface SpendingPieChartProps {
  data: { name: string; value: number; color: string }[];
  currencySymbol: string;
}

export const SpendingPieChart: React.FC<SpendingPieChartProps> = ({ data, currencySymbol }) => {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No spending data</div>;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-md">
          <p className="font-medium text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
            {data.name}
          </p>
          <p className="text-lg font-bold mt-1">
            {formatCurrency(data.value, currencySymbol)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
