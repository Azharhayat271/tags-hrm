import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TeamCalendar, {
  CalendarLeave,
  CalendarHoliday,
} from "@/components/leave/TeamCalendar";

export const dynamic = "force-dynamic";

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function parseYearMonth(
  rawYear: string | undefined,
  rawMonth: string | undefined
): { year: number; month: number } {
  const now = new Date();
  const y = Number(rawYear);
  const m = Number(rawMonth);
  const year = Number.isFinite(y) && y >= 1970 && y <= 2100 ? y : now.getFullYear();
  const month = Number.isFinite(m) && m >= 1 && m <= 12 ? m : now.getMonth() + 1;
  return { year, month };
}

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function TeamCalendarPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const { year, month } = parseYearMonth(sp.year, sp.month);

  const monthStart = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${pad(month)}-${pad(lastDay)}`;

  // Viewer's employee record (to scope to department)
  const { data: me } = await supabase
    .from("employees")
    .select("id, department_id, profile_id, department:departments(id, name)")
    .eq("profile_id", user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role?: string } | null)?.role || "employee";
  const isAdmin = role === "admin" || role === "super_admin";

  const admin = await createAdminClient();

  // Scope: admins see the whole org, employees see their department.
  // If an employee has no department, fall back to their direct-report peers + self.
  let employeeIdFilter: string[] | null = null;
  let scopeLabel = "All employees";
  const meRow = me as any;

  if (!isAdmin) {
    if (meRow?.department_id) {
      const { data: deptEmployees } = await admin
        .from("employees")
        .select("id")
        .eq("department_id", meRow.department_id);
      employeeIdFilter = (deptEmployees || []).map((e: any) => e.id);
      scopeLabel = meRow.department?.name ? `${meRow.department.name}` : "My department";
    } else if (meRow?.id) {
      // No department — show the viewer and anyone sharing a manager
      const { data: peers } = await admin
        .from("employees")
        .select("id")
        .or(`id.eq.${meRow.id}`);
      employeeIdFilter = (peers || []).map((p: any) => p.id);
      scopeLabel = "My team";
    }
  }

  // Fetch approved leaves overlapping this month
  let leavesQuery = admin
    .from("leave_requests")
    .select(
      `
      id, employee_id, days, start_date, end_date,
      leave_type:leave_types(name),
      employee:employees(profile:profiles(full_name))
    `
    )
    .eq("status", "approved")
    .lte("start_date", monthEnd)
    .gte("end_date", monthStart);

  if (employeeIdFilter) {
    if (employeeIdFilter.length === 0) {
      leavesQuery = leavesQuery.in("employee_id", ["00000000-0000-0000-0000-000000000000"]);
    } else {
      leavesQuery = leavesQuery.in("employee_id", employeeIdFilter);
    }
  }

  const { data: leaveRows } = await leavesQuery;

  const leaves: CalendarLeave[] = ((leaveRows as any[]) || []).map((r) => ({
    id: r.id,
    employeeId: r.employee_id,
    employeeName: r.employee?.profile?.full_name || "Unknown",
    leaveType: r.leave_type?.name || "Leave",
    startDate: r.start_date,
    endDate: r.end_date,
    days: r.days,
  }));

  // Public holidays in month (whole-org)
  const { data: holidayRows } = await admin
    .from("public_holidays")
    .select("date, name")
    .gte("date", monthStart)
    .lte("date", monthEnd);

  const holidays: CalendarHoliday[] = ((holidayRows as any[]) || []).map((h) => ({
    date: h.date,
    name: h.name,
  }));

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/leave"
          className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
          style={{ color: "var(--accent)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leave
        </Link>
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Team Calendar
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Approved leaves and public holidays across {isAdmin ? "the organization" : "your team"}.
        </p>
      </div>

      <TeamCalendar
        year={year}
        month={month}
        leaves={leaves}
        holidays={holidays}
        basePath="/leave/calendar"
        scopeLabel={scopeLabel}
      />
    </div>
  );
}
