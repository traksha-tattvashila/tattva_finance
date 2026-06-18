import React from "react";

interface CategoryBadgeProps {
  name: string;
  color: string;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ name, color, className = "" }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border border-border bg-card text-foreground ${className}`}>
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
};
