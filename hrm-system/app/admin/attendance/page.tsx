import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AttendanceReportTable from "@/components/attendance/AttendanceReportTable";
import { Download } from "lucide-react";

export const dynamic = "force-dynamic";

interface EmployeeProfile {
  full_name: string;
  email: string;
}

interface EmployeeRow {
  id: string;
  profiles: EmployeeProfile | EmployeeProfile[] | null;
}

interface SessionRow {
  id: string;
  employee_id: string;
  check_in: string;
  check_out: string | null;
  auto_closed_at: string | null;
  auto_close_reason: string | null;
}

interface MatrixRow {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  dayHours: Record<string, number>;
  totalCompletedHours: number;
  completedSessions: number;
  openSessions: number;
  autoClosedSessions: number;
}

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string }>;
}) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is admin or super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const view = params.view || "monthly";
  const today = new Date();
  
  let startDate: Date;
  let endDate: Date;
  let periodLabel: string;

  if (view === "weekly") {
    // Get current week (Monday to Sunday)
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    startDate = new Date(today);
    startDate.setDate(today.getDate() + diff);
    startDate.setHours(0, 0, 0, 0);
    
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    periodLabel = `Week of ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else {
    // Monthly view
    const monthOffset = params.month ? parseInt(params.month) : 0;
    startDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    endDate = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    periodLabel = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // Fetch all active employees first, then attach period sessions.
  // This keeps zero-session employees visible in monthly reporting.
  const { data: employeesData } = await supabase
    .from("employees")
    .select(`
      id,
      profiles(full_name, email)
    `)
    .eq("status", "active")
    .order("id");

  const employeesList: EmployeeRow[] = (employeesData ?? []) as EmployeeRow[];
  const employeeIds = employeesList.map((employee) => employee.id);

  let sessionsData: SessionRow[] = [];
  if (employeeIds.length > 0) {
    const { data } = await supabase
        .from("attendance_sessions")
        .select("id, employee_id, check_in, check_out, auto_closed_at, auto_close_reason")
      .in("employee_id", employeeIds)
      .gte("check_in", startDate.toISOString())
      .lte("check_in", endDate.toISOString())
      .order("check_in", { ascending: true });

    sessionsData = (data ?? []) as SessionRow[];
  }

  const sessionsByEmployee = new Map<string, SessionRow[]>();
  sessionsData.forEach((session) => {
    const existing = sessionsByEmployee.get(session.employee_id) ?? [];
    existing.push(session);
    sessionsByEmployee.set(session.employee_id, existing);
  });

  const employees = employeesList
    .map((employee) => {
      const profile = Array.isArray(employee.profiles)
        ? employee.profiles[0] ?? null
        : employee.profiles;

      return {
        ...employee,
        profiles: profile,
        attendance_sessions: sessionsByEmployee.get(employee.id)?.map((session) => ({
          id: session.id,
          check_in: session.check_in,
          check_out: session.check_out,
          auto_closed_at: session.auto_closed_at,
          auto_close_reason: session.auto_close_reason,
        })) ?? [],
      };
    })
    .sort((a, b) => {
      const nameA = a.profiles?.full_name ?? "";
      const nameB = b.profiles?.full_name ?? "";
      return nameA.localeCompare(nameB);
    });

  const dayKeys: string[] = [];
  const dayCursor = new Date(startDate);
  dayCursor.setHours(0, 0, 0, 0);
  const lastDay = new Date(endDate);
  lastDay.setHours(0, 0, 0, 0);

  while (dayCursor <= lastDay) {
    dayKeys.push(dayCursor.toISOString().split("T")[0]);
    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  const matrixRows: MatrixRow[] = employees.map((employee) => {
    const dayHours: Record<string, number> = {};
    dayKeys.forEach((dayKey) => {
      dayHours[dayKey] = 0;
    });

    let totalCompletedHours = 0;
    let completedSessions = 0;
    let openSessions = 0;
    let autoClosedSessions = 0;

    employee.attendance_sessions.forEach((session) => {
      if (session.auto_closed_at) {
        autoClosedSessions += 1;
      }
      if (!session.check_out) {
        openSessions += 1;
        return;
      }

      const start = new Date(session.check_in);
      const end = new Date(session.check_out);
      const durationMs = Math.max(0, end.getTime() - start.getTime());
      const durationHours = durationMs / (1000 * 60 * 60);
      const dayKey = start.toISOString().split("T")[0];

      if (dayHours[dayKey] !== undefined) {
        dayHours[dayKey] += durationHours;
      }

      totalCompletedHours += durationHours;
      completedSessions += 1;
    });

    return {
      employeeId: employee.id,
      employeeName: employee.profiles?.full_name ?? "Unknown Employee",
      employeeEmail: employee.profiles?.email ?? "",
      dayHours,
      totalCompletedHours,
      completedSessions,
      openSessions,
      autoClosedSessions,
    };
  });

  const matrixData = {
    periodStart: startDate.toISOString(),
    periodEnd: endDate.toISOString(),
    dayKeys,
    rows: matrixRows,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
            Work Hours Summary
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
            {periodLabel} - All Employees
          </p>
        </div>
        <button className="btn-ghost flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="card p-6">
        <AttendanceReportTable 
          employees={employees}
          view={view}
          startDate={startDate}
          endDate={endDate}
          matrixData={matrixData}
        />
      </div>
    </div>
  );
}
