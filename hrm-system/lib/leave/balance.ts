import type { SupabaseClient } from "@supabase/supabase-js";

export const PENDING_STATUSES = ["pending", "pending_manager", "pending_hr"] as const;
export const ACTIVE_STATUSES = ["pending", "pending_manager", "pending_hr", "approved"] as const;

export type LeaveStatus =
  | "pending"
  | "pending_manager"
  | "pending_hr"
  | "approved"
  | "rejected"
  | "cancelled";

export function isPendingStatus(status: string): boolean {
  return (PENDING_STATUSES as readonly string[]).includes(status);
}

export function statusLabel(status: string): string {
  switch (status) {
    case "pending":
    case "pending_hr":
      return "Pending HR";
    case "pending_manager":
      return "Pending manager";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  allocated: number;     // days_per_year; 0 means unlimited (unpaid)
  used: number;          // days with status = approved
  pending: number;       // days in any pending_* status
  remaining: number;     // Infinity when unlimited, else allocated - used - pending (floored at 0)
  unlimited: boolean;
}

interface LeaveTypeRow {
  id: string;
  name: string;
  days_per_year: number;
}

interface LeaveRequestRow {
  leave_type_id: string;
  status: string;
  days: number;
}

// Count weekdays (Mon-Fri) between two ISO dates, excluding the supplied holiday list.
// `holidays` is a list of YYYY-MM-DD strings.
export function calculateWorkingDays(
  startDate: string,
  endDate: string,
  holidays: string[] = []
): number {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

  const holidaySet = new Set(holidays);
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    const iso = current.toISOString().split("T")[0];
    if (day !== 0 && day !== 6 && !holidaySet.has(iso)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export async function getBalances(
  supabase: SupabaseClient,
  employeeId: string,
  year: number = new Date().getFullYear()
): Promise<LeaveBalance[]> {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const [typesRes, requestsRes] = await Promise.all([
    supabase.from("leave_types").select("id, name, days_per_year").order("name"),
    supabase
      .from("leave_requests")
      .select("leave_type_id, status, days")
      .eq("employee_id", employeeId)
      .gte("start_date", yearStart)
      .lte("start_date", yearEnd)
      .in("status", ACTIVE_STATUSES as unknown as string[]),
  ]);

  const types = (typesRes.data || []) as LeaveTypeRow[];
  const requests = (requestsRes.data || []) as LeaveRequestRow[];

  return types.map((t) => {
    const rows = requests.filter((r) => r.leave_type_id === t.id);
    const used = rows
      .filter((r) => r.status === "approved")
      .reduce((sum, r) => sum + (r.days || 0), 0);
    const pending = rows
      .filter((r) => isPendingStatus(r.status))
      .reduce((sum, r) => sum + (r.days || 0), 0);

    const unlimited = t.days_per_year === 0;

    return {
      leaveTypeId: t.id,
      leaveTypeName: t.name,
      allocated: t.days_per_year,
      used,
      pending,
      remaining: unlimited ? Infinity : Math.max(0, t.days_per_year - used - pending),
      unlimited,
    };
  });
}

export async function getBalance(
  supabase: SupabaseClient,
  employeeId: string,
  leaveTypeId: string,
  year: number = new Date().getFullYear()
): Promise<LeaveBalance | null> {
  const balances = await getBalances(supabase, employeeId, year);
  return balances.find((b) => b.leaveTypeId === leaveTypeId) || null;
}

// Check whether approving a request of `days` in `leaveTypeId` would exceed
// the employee's allocation. Excludes the request being approved from the
// current pending pool so the math is consistent at HR step.
export async function canApprove(
  supabase: SupabaseClient,
  employeeId: string,
  leaveTypeId: string,
  daysBeingApproved: number,
  year: number,
  excludeRequestId?: string
): Promise<{ ok: true } | { ok: false; reason: string; balance: LeaveBalance | null }> {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const [typeRes, approvedRes] = await Promise.all([
    supabase
      .from("leave_types")
      .select("id, name, days_per_year")
      .eq("id", leaveTypeId)
      .single(),
    supabase
      .from("leave_requests")
      .select("id, days")
      .eq("employee_id", employeeId)
      .eq("leave_type_id", leaveTypeId)
      .eq("status", "approved")
      .gte("start_date", yearStart)
      .lte("start_date", yearEnd),
  ]);

  const type = typeRes.data as LeaveTypeRow | null;
  if (!type) return { ok: false, reason: "Leave type not found", balance: null };

  if (type.days_per_year === 0) return { ok: true };

  const approvedRows = (approvedRes.data || []) as Array<{ id: string; days: number }>;
  const approvedSum = approvedRows
    .filter((r) => r.id !== excludeRequestId)
    .reduce((sum, r) => sum + (r.days || 0), 0);

  const total = approvedSum + daysBeingApproved;
  if (total > type.days_per_year) {
    return {
      ok: false,
      reason: `Approving this would exceed the annual ${type.name} allowance (${total}/${type.days_per_year} days).`,
      balance: null,
    };
  }
  return { ok: true };
}
