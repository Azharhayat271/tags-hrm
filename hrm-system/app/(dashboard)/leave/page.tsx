import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Plus, Users, CalendarDays } from "lucide-react";
import Link from "next/link";
import LeaveBalance from "@/components/leave/LeaveBalance";
import LeaveHistory from "@/components/leave/LeaveHistory";
import PublicHolidaysCard from "@/components/leave/PublicHolidaysCard";
import { getBalances } from "@/lib/leave/balance";

export const dynamic = "force-dynamic";

export default async function LeavePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get employee record
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("profile_id", user?.id)
    .single();

  if (!employee) {
    return (
      <div>
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Leave Management
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Employee record not found
        </p>
      </div>
    );
  }

  // Get employee's leave requests (for history)
  const { data: leaveRequests } = await supabase
    .from("leave_requests")
    .select(`
      *,
      leave_types(name),
      reviewed_by_profile:reviewed_by(full_name)
    `)
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false });

  // Get public holidays
  const { data: publicHolidays } = await supabase
    .from("public_holidays")
    .select("*")
    .gte("date", new Date().toISOString().split('T')[0])
    .order("date")
    .limit(5);

  // Balances via shared helper (uses admin client so pending totals are consistent with the API)
  const admin = await createAdminClient();
  const balances = await getBalances(admin as any, (employee as { id: string }).id);
  const leaveBalances = balances.map((b) => ({
    id: b.leaveTypeId,
    name: b.leaveTypeName,
    days_per_year: b.allocated,
    used: b.used,
    remaining: b.unlimited ? -1 : b.remaining, // -1 sentinel for unlimited; component handles it
    unlimited: b.unlimited,
    pending: b.pending,
  }));

  // Does the user manage anyone with pending leave? (for the banner)
  const { data: directReports } = await admin
    .from("employees")
    .select("id")
    .eq("reports_to", (employee as { id: string }).id);
  const reportIds = (directReports || []).map((r: any) => r.id);
  let teamPendingCount = 0;
  if (reportIds.length > 0) {
    const { count } = await admin
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_manager")
      .in("employee_id", reportIds);
    teamPendingCount = count || 0;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
            Leave Management
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
            Manage your leave requests and view balances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/leave/calendar" className="btn-ghost flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Team calendar
          </Link>
          {teamPendingCount && teamPendingCount > 0 ? (
            <Link href="/leave/approvals" className="btn-ghost flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team approvals
              <span className="badge-warning">{teamPendingCount}</span>
            </Link>
          ) : null}
          <Link href="/leave/apply" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Apply for Leave
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Leave Balance */}
        <div className="lg:col-span-2">
          <LeaveBalance balances={leaveBalances} />
        </div>

        {/* Public Holidays */}
        <PublicHolidaysCard holidays={publicHolidays || []} />
      </div>

      {/* Leave History */}
      <LeaveHistory requests={leaveRequests || []} />
    </div>
  );
}
