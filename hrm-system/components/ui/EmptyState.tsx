import type { ReactNode } from "react";
import { cn } from "./cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "bg-surface-raised border border-line-subtle rounded-md",
        "border-dashed",
        compact ? "py-10 px-6" : "py-16 px-8",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex items-center justify-center mb-4",
            "w-12 h-12 rounded-md bg-surface-sunken border border-line-subtle",
            "text-ink-tertiary",
          )}
        >
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-normal text-ink-primary mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-ink-tertiary max-w-sm leading-relaxed mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
