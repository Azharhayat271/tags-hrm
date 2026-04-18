import type { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "./cn";

export type StatTone = "default" | "accent" | "success" | "warning" | "danger";

const toneValueClass: Record<StatTone, string> = {
  default: "text-ink-primary",
  accent:  "text-[var(--accent-deep)]",
  success: "text-[var(--success-text)]",
  warning: "text-[var(--warning-text)]",
  danger:  "text-[var(--danger-text)]",
};

interface StatPillProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: ReactNode;
  tone?: StatTone;
  delta?: {
    value: string;
    direction: "up" | "down" | "flat";
    polarity?: "positive" | "negative" | "neutral";
  };
  className?: string;
  mono?: boolean;
}

export function StatPill({
  label,
  value,
  unit,
  sub,
  tone = "default",
  delta,
  className,
  mono = true,
}: StatPillProps) {
  return (
    <div
      className={cn(
        "relative px-5 py-4 bg-surface-raised border border-line-subtle rounded-md",
        "transition-colors duration-base ease-out-expo hover:border-line",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="stat-label">{label}</span>
        {delta && <DeltaChip {...delta} />}
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className={cn("stat-value", mono && "font-mono", toneValueClass[tone])}>{value}</span>
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {sub && <div className="stat-sub mt-1.5">{sub}</div>}
    </div>
  );
}

function DeltaChip({
  value,
  direction,
  polarity = "positive",
}: {
  value: string;
  direction: "up" | "down" | "flat";
  polarity?: "positive" | "negative" | "neutral";
}) {
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const isGood =
    polarity === "neutral"
      ? null
      : (polarity === "positive" && direction === "up") ||
        (polarity === "negative" && direction === "down");
  const tone =
    direction === "flat"
      ? "text-ink-tertiary"
      : isGood
      ? "text-[var(--success-text)]"
      : "text-[var(--danger-text)]";
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-mono tabular-nums", tone)}>
      <Icon className="w-3 h-3" strokeWidth={2} />
      {value}
    </span>
  );
}

interface StatStripProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function StatStrip({ children, className, ...rest }: StatStripProps) {
  return (
    <div
      className={cn(
        "grid bg-surface-raised border border-line-subtle rounded-md overflow-hidden",
        "divide-x divide-line-subtle",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

interface StatCellProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: ReactNode;
  tone?: StatTone;
  className?: string;
}

export function StatCell({ label, value, unit, sub, tone = "default", className }: StatCellProps) {
  return (
    <div className={cn("px-5 py-4 min-w-0", className)}>
      <span className="stat-label block mb-2">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <span className={cn("stat-value font-mono", toneValueClass[tone])}>{value}</span>
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {sub && <div className="stat-sub mt-1.5 truncate">{sub}</div>}
    </div>
  );
}
