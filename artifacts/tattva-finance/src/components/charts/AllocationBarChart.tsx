import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency } from "@/utils/formatters";

interface AllocationBarChartProps {
  data: { name: string; allocated: number; spent: number; color: string }[];
  currencySymbol: string;
}

export const AllocationBarChart: React.FC<AllocationBarChartProps> = ({ data, currencySymbol }) => {
  if (!data || data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No category data</div>;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = data.find(d => d.name === label);
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-md min-w-[150px]">
          <p className="font-medium text-sm flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dataPoint?.color }} />
            {label}
          </p>
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex justify-between items-center text-sm mb-1 gap-4">
              <span className="text-muted-foreground">{p.name}:</span>
              <span className="font-bold">{formatCurrency(p.value, currencySymbol)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={(value) => `${currencySymbol}${value}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.5)" }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="allocated" name="Allocated" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-alloc-${index}`} fill={entry.color} />
            ))}
          </Bar>
          <Bar dataKey="spent" name="Spent" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
