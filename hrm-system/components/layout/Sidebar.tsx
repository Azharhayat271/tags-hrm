"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  User,
  Clock,
  Calendar,
  DollarSign,
  Users,
  Settings,
  FileText,
  CheckSquare,
  BarChart3,
  ShieldCheck,
  Network,
} from "lucide-react";
import { cn } from "@/components/ui";

interface SidebarProps {
  profile: {
    full_name?: string | null;
    role?: string | null;
  } | null;
}

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  links: NavLink[];
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const role = profile?.role || "employee";

  const groups: NavGroup[] = buildGroups(role);

  return (
    <aside
      className={cn(
        "w-60 shrink-0 min-h-[calc(100vh-64px)]",
        "bg-surface-canvas border-r border-line-subtle",
        "flex flex-col",
      )}
    >
      <nav className="flex-1 px-3 pt-6 pb-3 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="eyebrow px-2.5 mb-2">{group.label}</div>
            <ul className="space-y-0.5">
              {group.links.map((link) => {
                const Icon = link.icon;
                const isActive = isLinkActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-2.5 h-8 px-2.5 rounded-sm",
                        "text-[13px] font-normal transition-colors duration-fast ease-out-expo",
                        isActive
                          ? "bg-surface-raised text-ink-primary shadow-e1"
                          : "text-ink-secondary hover:text-ink-primary hover:bg-surface-muted",
                      )}
                    >
                      {/* Active indicator dot */}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-pill",
                          "transition-all duration-base ease-out-expo",
                          isActive ? "h-4 bg-accent" : "h-0 bg-transparent",
                        )}
                      />
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-accent" : "text-ink-tertiary group-hover:text-ink-secondary",
                        )}
                        strokeWidth={isActive ? 2 : 1.75}
                      />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-2 border-t border-line-subtle">
        <div className="flex items-center gap-2 px-2.5 py-1.5">
          <span className="w-1.5 h-1.5 rounded-pill bg-[var(--success)]" />
          <span className="text-[10px] text-ink-tertiary font-mono tracking-wide">
            HRM · v1.0
          </span>
        </div>
      </div>
    </aside>
  );
}

function buildGroups(role: string): NavGroup[] {
  const workspace: NavLink[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/profile", label: "My profile", icon: User },
    { href: "/attendance", label: "My attendance", icon: Clock },
    { href: "/leave", label: "My leave", icon: Calendar },
    { href: "/payroll", label: "My payroll", icon: DollarSign },
    { href: "/org-chart", label: "Organization chart", icon: Network },
  ];

  const operations: NavLink[] = [
    { href: "/admin/employees", label: "Employees", icon: Users },
    { href: "/admin/org-chart", label: "Organization chart", icon: Network },
    { href: "/admin/attendance", label: "Attendance reports", icon: Clock },
    { href: "/admin/leave-approvals", label: "Leave approvals", icon: CheckSquare },
    { href: "/admin/payroll-upload", label: "Payroll upload", icon: FileText },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  ];

  const system: NavLink[] = [
    { href: "/super-admin/admins", label: "Admins", icon: ShieldCheck },
    { href: "/super-admin/settings", label: "System settings", icon: Settings },
  ];

  // Admins access the org chart via /admin/org-chart (Operations),
  // so drop the /org-chart entry from their Personal section.
  const personalLinks = workspace
    .slice(1)
    .filter((link) => link.href !== "/org-chart");

  if (role === "super_admin") {
    return [
      { label: "Workspace", links: [workspace[0]] },
      { label: "Operations", links: operations },
      { label: "System", links: system },
      { label: "Personal", links: personalLinks },
    ];
  }

  if (role === "admin") {
    return [
      { label: "Workspace", links: [workspace[0]] },
      { label: "Operations", links: operations },
      { label: "Personal", links: personalLinks },
    ];
  }

  return [{ label: "Workspace", links: workspace }];
}

function isLinkActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  // Treat deeper paths as active for section roots (e.g. /admin/attendance/[id])
  if (href !== "/dashboard" && pathname.startsWith(href + "/")) return true;
  return false;
}
