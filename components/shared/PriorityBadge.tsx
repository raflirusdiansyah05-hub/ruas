import React from "react";
import { cn } from "@/lib/utils";
import { SeverityLevel } from "@/types/database";

interface PriorityBadgeProps {
  priorityValue?: number | null;
  level?: SeverityLevel | null;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function getPriorityCategory(priorityValue: number): {
  level: SeverityLevel;
  label: string;
} {
  if (priorityValue >= 75) {
    return { level: "critical", label: "Prioritas Kritis" };
  }
  if (priorityValue >= 50) {
    return { level: "high", label: "Prioritas Tinggi" };
  }
  if (priorityValue >= 25) {
    return { level: "medium", label: "Prioritas Sedang" };
  }
  return { level: "low", label: "Prioritas Rendah" };
}

const PRIORITY_STYLES: Record<
  SeverityLevel,
  { bg: string; text: string; border: string; dot: string; defaultLabel: string }
> = {
  critical: {
    bg: "bg-[#C62828]/15",
    text: "text-[#C62828]",
    border: "border-[#C62828]/30",
    dot: "bg-[#C62828]",
    defaultLabel: "Prioritas Kritis",
  },
  high: {
    bg: "bg-[#EF6C00]/15",
    text: "text-[#EF6C00]",
    border: "border-[#EF6C00]/30",
    dot: "bg-[#EF6C00]",
    defaultLabel: "Prioritas Tinggi",
  },
  medium: {
    bg: "bg-[#F9A825]/15",
    text: "text-[#8D5B00]", // High contrast gold/brown WCAG AA compliant over light yellow
    border: "border-[#F9A825]/35",
    dot: "bg-[#F9A825]",
    defaultLabel: "Prioritas Sedang",
  },
  low: {
    bg: "bg-[#2E7D32]/15",
    text: "text-[#2E7D32]",
    border: "border-[#2E7D32]/30",
    dot: "bg-[#2E7D32]",
    defaultLabel: "Prioritas Rendah",
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priorityValue,
  level,
  className,
  showIcon = true,
  size = "sm",
}) => {
  let resolvedLevel: SeverityLevel = "low";
  let resolvedLabel = "Prioritas Rendah";

  if (typeof priorityValue === "number") {
    const cat = getPriorityCategory(priorityValue);
    resolvedLevel = cat.level;
    resolvedLabel = cat.label;
  } else if (level) {
    resolvedLevel = level;
    resolvedLabel = PRIORITY_STYLES[level]?.defaultLabel ?? "Prioritas Rendah";
  }

  const style = PRIORITY_STYLES[resolvedLevel] || PRIORITY_STYLES.low;

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-[11px]",
    md: "px-3 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm font-bold",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide shadow-subtle",
        sizeClasses,
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      {showIcon && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", style.dot)} />
      )}
      <span>{resolvedLabel}</span>
      {typeof priorityValue === "number" && size === "lg" && (
        <span className="font-mono text-xs opacity-90">({priorityValue})</span>
      )}
    </span>
  );
};
