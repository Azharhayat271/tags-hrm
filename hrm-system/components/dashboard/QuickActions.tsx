"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Clock,
  Calendar,
  FileText,
  Users,
  TrendingUp,
  Settings,
  ShieldCheck,
  UploadCloud,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/components/ui";

interface QuickActionsProps {
  role: string;
  employeeId?: string;
}

type Intent = "log" | "review" | "manage" | "configure";

interface Action {
  href: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  intent: Intent;
}

const intentStyles: Record<Intent, { chip: string; hint: string }> = {
  log: {
    chip: "bg-[var(--success-tint)] text-[var(--success-text)] border-[var(--success-border)]",
    hint: "Log",
  },
  review: {
    chip: "bg-[var(--warning-tint)] text-[var(--warning-text)] border-[var(--warning-border)]",
    hint: "Review",
  },
  manage: {
    chip: "bg-[var(--accent-tint)] text-[var(--accent-deep)] border-[var(--accent-wash)]",
    hint: "Manage",
  },
  configure: {
    chip: "bg-[var(--info-tint)] text-[var(--info-text)] border-[var(--info-border)]",
    hint: "Configure",
  },
};

export default function QuickActions({ role }: QuickActionsProps) {
  const employeeActions: Action[] = [
    { href: "/attendance", label: "Check in / out", desc: "Start or end your workday", icon: Clock, intent: "log" },
    { href: "/leave/apply", label: "Apply for leave", desc: "Submit a leave request", icon: Calendar, intent: "log" },
    { href: "/payroll", label: "View payslips", desc: "Download recent payslips", icon: FileText, intent: "manage" },
    { href: "/kpi", label: "My KPIs", desc: "Performance & reviews", icon: TrendingUp, intent: "review" },
  ];

  const adminActions: Action[] = [
    { href: "/admin/employees", label: "Employees", desc: "Roster & lifecycle", icon: Users, intent: "manage" },
    { href: "/admin/leave-approvals", label: "Approve leaves", desc: "Pending requests", icon: Calendar, intent: "review" },
    { href: "/admin/payroll-upload", label: "Upload payroll", desc: "Import monthly payslips", icon: UploadCloud, intent: "log" },
    { href: "/admin/reports", label: "Reports", desc: "Attendance & payroll exports", icon: BarChart3, intent: "manage" },
  ];

  const superAdminActions: Action[] = [
    { href: "/super-admin/admins", label: "Manage admins", desc: "Roles & permissions", icon: ShieldCheck, intent: "configure" },
    { href: "/super-admin/settings", label: "System settings", desc: "Departments, holidays, leave types", icon: Settings, intent: "configure" },
  ];

  const actions =
    role === "super_admin"
      ? [...adminActions, ...superAdminActions]
      : role === "admin"
      ? adminActions
      : employeeActions;

  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <span className="eyebrow">Quick actions</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const styles = intentStyles[action.intent];
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "group relative flex items-start gap-3 p-4 rounded-md",
                "bg-surface-raised border border-line-subtle",
                "hover:border-line hover:shadow-e2",
                "transition-[border-color,box-shadow] duration-base ease-out-expo",
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center justify-center w-9 h-9 rounded-sm border shrink-0",
                  styles.chip,
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-ink-primary truncate">{action.label}</span>
                  <ArrowUpRight
                    className="w-3.5 h-3.5 text-ink-quaternary opacity-0 group-hover:opacity-100 group-hover:text-ink-accent transition-all duration-base -translate-x-1 group-hover:translate-x-0"
                    strokeWidth={2}
                  />
                </div>
                <p className="text-[11px] text-ink-tertiary mt-0.5 truncate">{action.desc}</p>
                <span className="inline-block mt-1.5 text-[9px] font-mono uppercase tracking-[0.08em] text-ink-quaternary">
                  {styles.hint}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
