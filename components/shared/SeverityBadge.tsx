import React from "react";
import { cn } from "@/lib/utils";
import { SeverityLevel } from "@/types/database";

interface SeverityBadgeProps {
  level: SeverityLevel;
  className?: string;
  showIcon?: boolean;
}

const severityConfig: Record<
  SeverityLevel,
  { label: string; bg: string; text: string; border: string }
> = {
  critical: {
    label: "Kritis",
    bg: "bg-severity-critical/15",
    text: "text-severity-critical",
    border: "border-severity-critical/30",
  },
  high: {
    label: "Tinggi",
    bg: "bg-severity-high/15",
    text: "text-severity-high",
    border: "border-severity-high/30",
  },
  medium: {
    label: "Sedang",
    bg: "bg-severity-medium/15",
    text: "text-[#8D5B00]", // High contrast gold/brown for WCAG AA compliance over light yellow
    border: "border-severity-medium/30",
  },
  low: {
    label: "Rendah",
    bg: "bg-severity-low/15",
    text: "text-severity-low",
    border: "border-severity-low/30",
  },
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  level,
  className,
  showIcon = true,
}) => {
  const conf = severityConfig[level] || severityConfig.low;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide shadow-subtle",
        conf.bg,
        conf.text,
        conf.border,
        className
      )}
    >
      {showIcon && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            level === "critical" && "bg-severity-critical",
            level === "high" && "bg-severity-high",
            level === "medium" && "bg-severity-medium",
            level === "low" && "bg-severity-low"
          )}
        />
      )}
      <span>{conf.label}</span>
    </span>
  );
};
