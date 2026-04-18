import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "./cn";

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  meta,
  back,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      {back && (
        <Link
          href={back.href}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs mb-4",
            "text-ink-tertiary hover:text-ink-accent",
            "transition-colors duration-fast ease-out-expo",
          )}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {back.label}
        </Link>
      )}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="min-w-0 flex-1">
          {eyebrow && <span className="eyebrow block mb-2">{eyebrow}</span>}
          <h1 className="text-[2rem] leading-[1.1] font-light tracking-[-0.025em] text-ink-primary text-balance">
            {title}
          </h1>
          {subtitle && <p className="text-[15px] text-ink-secondary mt-2 leading-relaxed">{subtitle}</p>}
          {meta && (
            <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap mt-3 text-xs text-ink-tertiary">
              {meta}
            </div>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
