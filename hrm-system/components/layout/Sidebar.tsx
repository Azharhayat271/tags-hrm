"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Settings,
  FileText,
  CheckSquare,
  BarChart3,
} from "lucide-react";

interface SidebarProps {
  profile: any;
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const role = profile?.role || "employee";

  const employeeLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/attendance", label: "Attendance", icon: Clock },
    { href: "/leave", label: "Leave", icon: Calendar },
    { href: "/payroll", label: "Payroll", icon: DollarSign },
  ];

  const adminLinks = [
    { href: "/admin/employees", label: "Manage Employees", icon: Users },
    { href: "/admin/attendance", label: "Attendance Reports", icon: Clock },
    { href: "/admin/leave-approvals", label: "Leave Approvals", icon: CheckSquare },
    { href: "/admin/payroll-upload", label: "Payroll Upload", icon: FileText },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  ];

  const superAdminLinks = [
    { href: "/admin/slack-setup", label: "Slack Integration", icon: Settings },
    { href: "/super-admin/admins", label: "Manage Admins", icon: Users },
    { href: "/super-admin/settings", label: "System Settings", icon: Settings },
  ];

  // For admins and super admins, show admin features first
  const links = role === "admin" || role === "super_admin"
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ...(role === "super_admin" ? superAdminLinks : []),
        ...adminLinks,
      ]
    : employeeLinks;

  return (
    <aside className="w-60 bg-tag-bg-warm border-r border-tag-border min-h-[calc(100vh-73px)] p-4">
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive
                  ? "flex items-center gap-3 px-3 py-2 rounded text-sm font-normal transition-colors bg-orange-50 text-orange-600 border-l-3 border-orange-600"
                  : "flex items-center gap-3 px-3 py-2 rounded text-sm font-normal transition-colors hover:bg-orange-50/50"
              }
              style={{
                color: isActive ? 'var(--tag-orange)' : 'var(--tag-label)',
                backgroundColor: isActive ? 'rgba(249,115,22,0.08)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--tag-orange)' : 'none',
              }}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
