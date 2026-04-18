"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "./cn";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

type ToastInput = Omit<Toast, "id" | "variant"> & { variant?: ToastVariant };

interface ToastContextValue {
  toasts: Toast[];
  show: (t: ToastInput & { variant?: ToastVariant }) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timeouts.current[id]) {
      clearTimeout(timeouts.current[id]);
      delete timeouts.current[id];
    }
  }, []);

  const show = useCallback(
    (t: ToastInput) => {
      const id = Math.random().toString(36).slice(2, 10);
      const toast: Toast = {
        id,
        variant: t.variant ?? "info",
        title: t.title,
        description: t.description,
        duration: t.duration ?? 4500,
      };
      setToasts((prev) => [...prev, toast]);
      if (toast.duration && toast.duration > 0) {
        timeouts.current[id] = setTimeout(() => dismiss(id), toast.duration);
      }
      return id;
    },
    [dismiss],
  );

  const success = useCallback(
    (title: string, description?: string) => show({ variant: "success", title, description }),
    [show],
  );
  const error = useCallback(
    (title: string, description?: string) => show({ variant: "error", title, description, duration: 6000 }),
    [show],
  );
  const warning = useCallback(
    (title: string, description?: string) => show({ variant: "warning", title, description }),
    [show],
  );
  const info = useCallback(
    (title: string, description?: string) => show({ variant: "info", title, description }),
    [show],
  );

  useEffect(() => {
    const snap = timeouts.current;
    return () => {
      Object.values(snap).forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, show, success, error, warning, info, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

const variantStyles: Record<ToastVariant, { icon: ReactNode; accent: string; text: string; ring: string }> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4" strokeWidth={2} />,
    accent: "bg-[var(--success-tint)] border-[var(--success-border)]",
    text: "text-[var(--success-text)]",
    ring: "bg-[var(--success)]",
  },
  error: {
    icon: <AlertCircle className="w-4 h-4" strokeWidth={2} />,
    accent: "bg-[var(--danger-tint)] border-[var(--danger-border)]",
    text: "text-[var(--danger-text)]",
    ring: "bg-[var(--danger)]",
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" strokeWidth={2} />,
    accent: "bg-[var(--warning-tint)] border-[var(--warning-border)]",
    text: "text-[var(--warning-text)]",
    ring: "bg-[var(--warning)]",
  },
  info: {
    icon: <Info className="w-4 h-4" strokeWidth={2} />,
    accent: "bg-[var(--info-tint)] border-[var(--info-border)]",
    text: "text-[var(--info-text)]",
    ring: "bg-[var(--info)]",
  },
};

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="fixed z-[80] bottom-4 right-4 flex flex-col-reverse gap-2 w-full max-w-[380px] pointer-events-none"
    >
      {toasts.map((t) => {
        const styles = variantStyles[t.variant];
        return (
          <div
            key={t.id}
            role={t.variant === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto relative overflow-hidden",
              "bg-surface-raised border border-line-subtle rounded-md shadow-e3",
              "flex items-start gap-3 pl-3.5 pr-2 py-3",
              "animate-[toast-in_220ms_cubic-bezier(0.22,1,0.36,1)]",
            )}
          >
            {/* Left accent rail */}
            <span aria-hidden className={cn("absolute left-0 top-0 bottom-0 w-[3px]", styles.ring)} />
            <span
              className={cn(
                "inline-flex items-center justify-center w-7 h-7 rounded-sm border shrink-0",
                styles.accent,
                styles.text,
              )}
            >
              {styles.icon}
            </span>
            <div className="flex-1 min-w-0 py-0.5">
              <p className="text-[13px] font-medium text-ink-primary leading-tight">{t.title}</p>
              {t.description && (
                <p className="text-[12px] text-ink-tertiary mt-1 leading-relaxed">
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
              className={cn(
                "shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-xs",
                "text-ink-quaternary hover:text-ink-primary hover:bg-surface-muted",
                "transition-colors duration-fast",
              )}
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
