import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-border/70 bg-gradient-to-b from-surface/50 to-surface/90 shadow-subtle",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-base border border-border/80 text-text-secondary shadow-card mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-base font-bold text-text-primary mb-1.5 tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-text-secondary max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Button asChild variant="default" size="sm">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && !actionHref && onAction && (
        <Button onClick={onAction} variant="default" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
