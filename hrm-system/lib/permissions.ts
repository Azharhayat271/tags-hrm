import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type PermissionKey =
  | "employees.view"
  | "employees.manage"
  | "attendance.manage"
  | "attendance.reports"
  | "leave.approve"
  | "payroll.view"
  | "payroll.upload"
  | "kpi.manage"
  | "kpi.review"
  | "reports.view";

export interface PermissionDef {
  key: PermissionKey;
  label: string;
  description: string;
  group: "Employees" | "Attendance" | "Leave" | "Payroll" | "KPI" | "Reports";
  route: string;
}

export const PERMISSIONS: PermissionDef[] = [
  {
    key: "employees.view",
    label: "View employees",
    description: "See the employee directory and individual profiles.",
    group: "Employees",
    route: "/admin/employees",
  },
  {
    key: "employees.manage",
    label: "Manage employees",
    description: "Create, edit, and deactivate employee records.",
    group: "Employees",
    route: "/admin/employees",
  },
  {
    key: "attendance.manage",
    label: "Manage attendance",
    description: "Adjust attendance entries and close records.",
    group: "Attendance",
    route: "/admin/attendance",
  },
  {
    key: "attendance.reports",
    label: "Attendance reports",
    description: "View and export organisation-wide attendance reports.",
    group: "Attendance",
    route: "/admin/attendance",
  },
  {
    key: "leave.approve",
    label: "Approve leave",
    description: "Review and approve/reject leave requests.",
    group: "Leave",
    route: "/admin/leave-approvals",
  },
  {
    key: "payroll.view",
    label: "View payroll",
    description: "See payroll records for all employees.",
    group: "Payroll",
    route: "/admin/payroll-upload",
  },
  {
    key: "payroll.upload",
    label: "Upload payroll",
    description: "Upload and publish monthly payroll.",
    group: "Payroll",
    route: "/admin/payroll-upload",
  },
  {
    key: "kpi.manage",
    label: "Manage KPIs",
    description: "Create and edit KPI entries for employees.",
    group: "KPI",
    route: "/admin/employees",
  },
  {
    key: "kpi.review",
    label: "Review KPIs",
    description: "Review and rate employee KPI submissions.",
    group: "KPI",
    route: "/admin/employees",
  },
  {
    key: "reports.view",
    label: "View reports",
    description: "Access HR analytics and management reports.",
    group: "Reports",
    route: "/admin/reports",
  },
];

export const PERMISSION_KEYS: PermissionKey[] = PERMISSIONS.map((p) => p.key);

export function isPermissionKey(value: string): value is PermissionKey {
  return PERMISSION_KEYS.includes(value as PermissionKey);
}

/**
 * Server-only: resolve the effective permission set for a given user.
 * super_admin and admin roles implicitly hold every permission.
 */
export async function getUserPermissions(userId: string): Promise<{
  role: string;
  permissions: Set<PermissionKey>;
}> {
  const supabase = await createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const role = (profile as { role?: string } | null)?.role ?? "employee";

  if (role === "admin" || role === "super_admin") {
    return { role, permissions: new Set(PERMISSION_KEYS) };
  }

  const { data: rows } = await supabase
    .from("user_permissions")
    .select("permission_key")
    .eq("user_id", userId)
    .is("revoked_at", null);

  const permissions = new Set<PermissionKey>();
  for (const row of (rows ?? []) as { permission_key: string }[]) {
    if (isPermissionKey(row.permission_key)) {
      permissions.add(row.permission_key);
    }
  }

  return { role, permissions };
}

/**
 * Server-only: resolve permissions for the currently authenticated user.
 * Returns null if the user is unauthenticated.
 */
export async function getCurrentUserPermissions(): Promise<{
  userId: string;
  role: string;
  permissions: Set<PermissionKey>;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { role, permissions } = await getUserPermissions(user.id);
  return { userId: user.id, role, permissions };
}

export async function hasPermission(
  userId: string,
  key: PermissionKey
): Promise<boolean> {
  const { permissions } = await getUserPermissions(userId);
  return permissions.has(key);
}

/**
 * Server-only page guard. Redirects to `/dashboard` (via caller) if the
 * current user lacks the required permission. Returns the resolved
 * permission set for further checks inside the page.
 */
export async function requirePagePermission(key: PermissionKey): Promise<{
  userId: string;
  role: string;
  permissions: Set<PermissionKey>;
} | null> {
  const ctx = await getCurrentUserPermissions();
  if (!ctx) return null;
  if (!ctx.permissions.has(key)) return null;
  return ctx;
}

/**
 * True if the user has at least one admin permission (role-based or granted).
 * Used to decide whether an employee may enter the /admin route group at all.
 */
export async function hasAnyAdminAccess(userId: string): Promise<boolean> {
  const { role, permissions } = await getUserPermissions(userId);
  if (role === "admin" || role === "super_admin") return true;
  return permissions.size > 0;
}
