import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-card border border-border border-dashed rounded-xl shadow-sm min-h-[300px]">
      <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button>{actionLabel}</Button>
        </Link>
      )}
      {actionLabel && actionOnClick && (
        <Button onClick={actionOnClick}>{actionLabel}</Button>
      )}
    </div>
  );
};
