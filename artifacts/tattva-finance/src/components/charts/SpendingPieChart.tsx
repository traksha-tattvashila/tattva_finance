import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/utils/formatters";

interface SpendingPieChartProps {
  data: { name: string; value: number; color: string }[];
  currencySymbol: string;
}

export const SpendingPieChart: React.FC<SpendingPieChartProps> = ({ data, currencySymbol }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground gap-2">
        <span className="text-3xl">🥧</span>
        <p className="text-sm">No spending data yet</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const item = payload[0].payload;
      const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
      return (
        <div className="bg-popover border border-border p-3 rounded-xl shadow-lg text-sm min-w-[160px]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="font-semibold">{item.name}</span>
          </div>
          <p className="text-lg font-bold tabular-nums">{formatCurrency(item.value, currencySymbol)}</p>
          <p className="text-xs text-muted-foreground">{pct}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Donut chart */}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.55}
                  style={{ cursor: "pointer", transition: "opacity 0.15s" }}
                />
              ))}
            </Pie>
            {/* Centre label */}
            <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[10px]">
              Total
            </text>
            <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: 13, fontWeight: 700, fill: "hsl(var(--foreground))" }}
            >
              {formatCurrency(total, currencySymbol)}
            </text>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom legend — full names, two-column grid */}
      <div className="grid grid-cols-1 gap-1.5 mt-3">
        {data.map((entry, idx) => {
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : "0";
          const isActive = activeIndex === idx;
          return (
            <div
              key={entry.name}
              className="flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors cursor-default"
              style={{ backgroundColor: isActive ? entry.color + "15" : "transparent" }}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-sm flex-1">{entry.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
              <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(entry.value, currencySymbol)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
