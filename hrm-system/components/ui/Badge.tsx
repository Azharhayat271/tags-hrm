import type { ReactNode } from "react";
import { cn } from "./cn";

export type BadgeVariant =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent"
  | "ghost";

export type BadgeSize = "sm" | "md";

const variantStyles: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--neutral-tint)] text-[var(--neutral-text)] border-[var(--neutral-border)]",
  success: "bg-[var(--success-tint)] text-[var(--success-text)] border-[var(--success-border)]",
  warning: "bg-[var(--warning-tint)] text-[var(--warning-text)] border-[var(--warning-border)]",
  danger:  "bg-[var(--danger-tint)] text-[var(--danger-text)] border-[var(--danger-border)]",
  info:    "bg-[var(--info-tint)] text-[var(--info-text)] border-[var(--info-border)]",
  accent:  "bg-[var(--accent-tint)] text-[var(--accent-deep)] border-[var(--accent-wash)]",
  ghost:   "bg-transparent text-ink-secondary border-line-subtle",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-[10px] leading-none py-0.5 px-1.5 gap-1",
  md: "text-[11px] leading-[1.4] py-0.5 px-2 gap-1",
};

const dotSize: Record<BadgeSize, string> = {
  sm: "w-1 h-1",
  md: "w-1.5 h-1.5",
};

const dotColor: Record<BadgeVariant, string> = {
  neutral: "bg-stone-500",
  success: "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  danger:  "bg-[var(--danger)]",
  info:    "bg-[var(--info)]",
  accent:  "bg-accent",
  ghost:   "bg-stone-400",
};

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  mono?: boolean;
  title?: string;
}

export function Badge({
  variant = "neutral",
  size = "md",
  dot = false,
  icon,
  children,
  className,
  mono = false,
  title,
}: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center border rounded-sm whitespace-nowrap",
        "font-medium tracking-wide",
        mono && "font-mono tabular-nums",
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
    >
      {dot && <span className={cn("rounded-pill", dotSize[size], dotColor[variant])} />}
      {icon}
      {children}
    </span>
  );
}
