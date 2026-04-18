"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white border border-accent hover:bg-accent-hover active:bg-accent-deep shadow-e1",
  secondary:
    "bg-surface-raised text-ink-primary border border-line hover:bg-surface-muted hover:border-line-strong",
  ghost:
    "bg-transparent text-ink-secondary border border-transparent hover:bg-surface-muted hover:text-ink-primary",
  danger:
    "bg-[var(--danger)] text-white border border-[var(--danger)] hover:bg-[#b91c1c]",
  link:
    "bg-transparent text-ink-accent border border-transparent hover:underline underline-offset-4 px-0",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 text-xs px-3 gap-1.5 rounded-sm",
  md: "h-9 text-sm px-4 gap-2 rounded-sm",
  lg: "h-11 text-[15px] px-5 gap-2 rounded-md",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    icon,
    iconPosition = "left",
    disabled,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium",
        "transition-[background-color,border-color,color,box-shadow] duration-base ease-out-expo",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:shadow-focus",
        variant !== "link" && sizeStyles[size],
        variantStyles[variant],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        iconPosition === "left" && icon
      )}
      {children}
      {!loading && iconPosition === "right" && icon}
    </button>
  );
});
