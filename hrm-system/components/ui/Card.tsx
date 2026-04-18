import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type Elevation = 0 | 1 | 2 | 3;
type Tone = "raised" | "sunken" | "muted" | "inverse";

const elevationClass: Record<Elevation, string> = {
  0: "shadow-none",
  1: "shadow-e1",
  2: "shadow-e2",
  3: "shadow-e3",
};

const toneClass: Record<Tone, string> = {
  raised:  "bg-surface-raised border-line-subtle",
  sunken:  "bg-surface-sunken border-line-subtle",
  muted:   "bg-surface-muted border-line-subtle",
  inverse: "bg-surface-inverse text-ink-inverse border-transparent",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  elevation?: Elevation;
  interactive?: boolean;
  children: ReactNode;
}

export function Card({
  tone = "raised",
  elevation = 1,
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "border rounded-md",
        "transition-[border-color,box-shadow] duration-base ease-out-expo",
        elevationClass[elevation],
        toneClass[tone],
        interactive && "hover:shadow-e2 hover:border-line cursor-pointer",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-b border-line-subtle flex items-center justify-between gap-3",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 py-3 border-t border-line-subtle bg-surface-muted rounded-b-md",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

interface CardTitleProps {
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}

export function CardTitle({ eyebrow, children, className }: CardTitleProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h3 className="text-[15px] font-normal text-ink-primary leading-tight">{children}</h3>
    </div>
  );
}
