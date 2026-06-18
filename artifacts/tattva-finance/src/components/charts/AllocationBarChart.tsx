import React from "react";
import { formatCurrency } from "@/utils/formatters";

interface AllocationBarChartProps {
  data: { name: string; allocated: number; spent: number; color: string }[];
  currencySymbol: string;
}

export const AllocationBarChart: React.FC<AllocationBarChartProps> = ({ data, currencySymbol }) => {
  if (!data || data.length === 0) {
    return (
      <div className="px-4 h-[200px] flex flex-col items-center justify-center text-muted-foreground gap-2">
        <span className="text-3xl">📊</span>
        <p className="text-sm">No category data</p>
      </div>
    );
  }

  // Filter out categories with 0 allocated and 0 spent
  const visibleData = data.filter(d => d.allocated > 0 || d.spent > 0);

  if (visibleData.length === 0) {
    return (
      <div className="px-4 h-[200px] flex items-center justify-center text-muted-foreground text-sm">
        Set category budgets in the Planner to see allocation vs spending.
      </div>
    );
  }

  return (
    <div className="px-4 space-y-3.5">
      {visibleData.map(cat => {
        const spentPct = cat.allocated > 0 ? Math.min((cat.spent / cat.allocated) * 100, 100) : 0;
        const isOver = cat.spent > cat.allocated && cat.allocated > 0;
        const isUnbudgeted = cat.allocated === 0 && cat.spent > 0;

        return (
          <div key={cat.name}>
            {/* Label row */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-sm font-medium flex-1">{cat.name}</span>
              <div className="text-right shrink-0">
                <span className={`text-sm font-semibold tabular-nums ${isOver ? "text-destructive" : ""}`}>
                  {formatCurrency(cat.spent, currencySymbol)}
                </span>
                {cat.allocated > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums ml-1">
                    / {formatCurrency(cat.allocated, currencySymbol)}
                  </span>
                )}
              </div>
            </div>

            {/* Dual-bar: allocated (ghost) + spent (fill) */}
            {cat.allocated > 0 ? (
              <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                {/* Allocated background fill */}
                <div className="absolute inset-0 rounded-full" style={{ backgroundColor: cat.color + "30" }} />
                {/* Spent fill */}
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all"
                  style={{
                    width: `${spentPct}%`,
                    backgroundColor: isOver ? "hsl(var(--destructive))" : cat.color,
                  }}
                />
                {/* Over-budget overflow indicator */}
                {isOver && (
                  <div
                    className="absolute right-0 top-0 h-full w-1 rounded-r-full bg-destructive animate-pulse"
                  />
                )}
              </div>
            ) : (
              /* Unbudgeted: just show the spent bar in full */
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: "100%", backgroundColor: cat.color + "80" }}
                />
              </div>
            )}

            {/* Status tags */}
            <div className="flex justify-between mt-1">
              {isOver && (
                <span className="text-[10px] font-medium text-destructive">
                  Over by {formatCurrency(cat.spent - cat.allocated, currencySymbol)}
                </span>
              )}
              {isUnbudgeted && (
                <span className="text-[10px] text-muted-foreground">No budget set</span>
              )}
              {!isOver && !isUnbudgeted && cat.allocated > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {(100 - spentPct).toFixed(0)}% remaining
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
