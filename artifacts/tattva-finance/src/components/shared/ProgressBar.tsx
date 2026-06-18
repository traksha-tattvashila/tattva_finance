import React from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  height?: "sm" | "md" | "lg";
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color = "var(--primary)", height = "md", className = "" }) => {
  const heights = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4"
  };

  const isOver100 = progress > 100;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full bg-secondary overflow-hidden rounded-full ${heights[height]} ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clampedProgress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`h-full rounded-full`}
        style={{ backgroundColor: isOver100 ? "var(--destructive)" : color }}
      />
    </div>
  );
};
