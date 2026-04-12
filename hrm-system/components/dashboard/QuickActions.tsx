"use client";

import Link from "next/link";
import { Clock, Calendar, FileText, Users, TrendingUp, Settings } from "lucide-react";

interface QuickActionsProps {
  role: string;
  employeeId?: string;
}

export default function QuickActions({ role, employeeId }: QuickActionsProps) {
  const employeeActions = [
    { href: "/attendance", label: "Check In/Out", icon: Clock, color: "var(--tag-orange)" },
    { href: "/leave/apply", label: "Apply Leave", icon: Calendar, color: "var(--tag-success)" },
    { href: "/payroll", label: "View Payslips", icon: FileText, color: "var(--tag-orange)" },
    { href: "/kpi", label: "My KPIs", icon: TrendingUp, color: "var(--tag-orange)" },
  ];

  const adminActions = [
    { href: "/admin/employees", label: "Manage Employees", icon: Users, color: "var(--tag-orange)" },
    { href: "/admin/leave-approvals", label: "Approve Leaves", icon: Calendar, color: "var(--tag-warning)" },
    { href: "/admin/payroll-upload", label: "Upload Payroll", icon: FileText, color: "var(--tag-orange)" },
    { href: "/admin/reports", label: "View Reports", icon: TrendingUp, color: "var(--tag-success)" },
  ];

  const superAdminActions = [
    { href: "/super-admin/admins", label: "Manage Admins", icon: Users, color: "var(--tag-orange)" },
    { href: "/super-admin/settings", label: "System Settings", icon: Settings, color: "var(--tag-orange)" },
  ];

  const actions = role === "admin" || role === "super_admin" 
    ? [...adminActions, ...(role === "super_admin" ? superAdminActions : [])]
    : employeeActions;

  return (
    <div className="card p-6">
      <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded border transition-all hover:shadow-md"
              style={{
                borderColor: 'var(--tag-border)',
                backgroundColor: 'var(--tag-bg)',
              }}
            >
              <Icon className="w-6 h-6" style={{ color: action.color }} />
              <span className="text-xs text-center" style={{ color: 'var(--tag-label)' }}>
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
