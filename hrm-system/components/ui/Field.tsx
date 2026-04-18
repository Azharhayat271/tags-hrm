"use client";

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";
import { AlertCircle, ChevronDown, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "./cn";

/* =====================================================================
 * Field — wraps label + control + help/error
 * ===================================================================== */

interface FieldContextValue {
  id: string;
  invalid: boolean;
  describedBy?: string;
}

interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: (ctx: FieldContextValue) => ReactNode;
}

export function Field({ label, hint, error, required, optional, className, children }: FieldProps) {
  const id = useId();
  const helpId = hint || error ? `${id}-help` : undefined;
  const invalid = Boolean(error);
  const ctx: FieldContextValue = { id, invalid, describedBy: helpId };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={id}
          className="flex items-baseline justify-between text-[12px] font-medium text-ink-secondary leading-tight"
        >
          <span>
            {label}
            {required && <span className="text-[var(--danger-text)] ml-0.5">*</span>}
          </span>
          {optional && !required && (
            <span className="text-[10px] font-normal uppercase tracking-[0.08em] text-ink-quaternary">
              Optional
            </span>
          )}
        </label>
      )}
      {children(ctx)}
      {(hint || error) && (
        <p
          id={helpId}
          className={cn(
            "text-[11px] leading-relaxed flex items-start gap-1",
            error ? "text-[var(--danger-text)]" : "text-ink-tertiary",
          )}
        >
          {error && <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={2} />}
          {error || hint}
        </p>
      )}
    </div>
  );
}

/* =====================================================================
 * Input
 * ===================================================================== */

const controlBase = cn(
  "block w-full h-9 px-3 rounded-sm",
  "bg-surface-raised border text-[13px] text-ink-primary",
  "placeholder:text-ink-quaternary",
  "transition-[border-color,box-shadow,background-color] duration-base ease-out-expo",
  "disabled:bg-surface-sunken disabled:text-ink-tertiary disabled:cursor-not-allowed",
);

function borderClass(invalid: boolean) {
  return invalid
    ? "border-[var(--danger-border)] focus:border-[var(--danger)] focus:shadow-focus-danger"
    : "border-line focus:border-accent focus:shadow-focus";
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  invalid?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leftIcon, rightIcon, ...rest },
  ref,
) {
  if (leftIcon || rightIcon) {
    return (
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            controlBase,
            borderClass(Boolean(invalid)),
            "focus:outline-none",
            Boolean(leftIcon) && "pl-9",
            Boolean(rightIcon) && "pr-9",
            className,
          )}
          aria-invalid={invalid || undefined}
          {...rest}
        />
        {rightIcon && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
  return (
    <input
      ref={ref}
      className={cn(controlBase, borderClass(Boolean(invalid)), "focus:outline-none", className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

/* =====================================================================
 * PasswordInput — with visibility toggle
 * ===================================================================== */

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  invalid?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className, invalid, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn(
          controlBase,
          borderClass(Boolean(invalid)),
          "focus:outline-none pr-10",
          visible ? "" : "font-mono tracking-[0.12em]",
          className,
        )}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center rounded-xs",
          "text-ink-tertiary hover:text-ink-primary hover:bg-surface-muted",
          "transition-colors duration-fast",
        )}
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff className="w-3.5 h-3.5" strokeWidth={1.75} />
        ) : (
          <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
});

/* =====================================================================
 * Select — custom chevron
 * ===================================================================== */

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          controlBase,
          borderClass(Boolean(invalid)),
          "appearance-none pr-9 cursor-pointer focus:outline-none",
          className,
        )}
        aria-invalid={invalid || undefined}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary pointer-events-none"
        strokeWidth={1.75}
      />
    </div>
  );
});

/* =====================================================================
 * Textarea
 * ===================================================================== */

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "block w-full px-3 py-2 rounded-sm resize-y min-h-[72px]",
        "bg-surface-raised border text-[13px] text-ink-primary leading-relaxed",
        "placeholder:text-ink-quaternary",
        "transition-[border-color,box-shadow] duration-base ease-out-expo",
        "disabled:bg-surface-sunken disabled:text-ink-tertiary disabled:cursor-not-allowed",
        borderClass(Boolean(invalid)),
        "focus:outline-none",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

/* =====================================================================
 * FormError — top-level banner
 * ===================================================================== */

interface FormErrorProps {
  children: ReactNode;
  className?: string;
  onDismiss?: () => void;
}

export function FormError({ children, className }: FormErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 px-3.5 py-2.5 rounded-sm",
        "bg-[var(--danger-tint)] border border-[var(--danger-border)]",
        "text-[13px] text-[var(--danger-text)] leading-relaxed",
        className,
      )}
    >
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
      <span>{children}</span>
    </div>
  );
}

/* =====================================================================
 * FormSection — groups related fields with an editorial header
 * ===================================================================== */

interface FormSectionProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ eyebrow, title, description, children, className }: FormSectionProps) {
  return (
    <section className={cn("grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 md:gap-10 py-6 border-b border-line-subtle last:border-b-0", className)}>
      <header className="min-w-0">
        {eyebrow && <span className="eyebrow block mb-1.5">{eyebrow}</span>}
        {title && <h3 className="text-[15px] font-medium text-ink-primary leading-snug">{title}</h3>}
        {description && (
          <p className="text-[12px] text-ink-tertiary mt-1.5 leading-relaxed">{description}</p>
        )}
      </header>
      <div className="flex flex-col gap-4 min-w-0">{children}</div>
    </section>
  );
}

/* =====================================================================
 * FormActions — sticky/bottom button row
 * ===================================================================== */

interface FormActionsProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "split";
}

export function FormActions({ children, className, align = "right" }: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 pt-4 border-t border-line-subtle",
        align === "right" && "justify-end",
        align === "left" && "justify-start",
        align === "split" && "justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* Re-export Loader2 for form loading states */
export { Loader2 as FormLoader };
