import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AttendanceReportTable from "@/components/attendance/AttendanceReportTable";
import ExportButtons from "@/components/attendance/ExportButtons";
import AttendanceFilters from "@/components/attendance/AttendanceFilters";
import {
  parseFilterParams,
  type AttendanceFilterState,
} from "@/lib/attendance/filters";
import KpiStrip from "@/components/attendance/KpiStrip";
import {
  computeAttendanceMatrix,
  type RawEmployee,
  type RawSession,
  type RawHoliday,
} from "@/lib/attendance/aggregate";

export const dynamic = "force-dynamic";

interface EmployeeRecord {
  id: string;
  department_id: string | null;
  profiles: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  departments?: { name: string } | { name: string }[] | null;
}

function extractProfile(record: EmployeeRecord) {
  const p = Array.isArray(record.profiles) ? record.profiles[0] ?? null : record.profiles;
  return p;
}

function extractDepartmentName(record: EmployeeRecord): string | null {
  const d = Array.isArray(record.departments) ? record.departments[0] ?? null : record.departments;
  return d?.name ?? null;
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function endOfWeek(d: Date): Date {
  const copy = startOfWeek(d);
  copy.setDate(copy.getDate() + 6);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function resolveRange(state: AttendanceFilterState): { start: Date; end: Date; label: string } {
  const today = new Date();
  if (state.period === "week") {
    const base = new Date(today);
    base.setDate(base.getDate() + state.weekOffset * 7);
    const start = startOfWeek(base);
    const end = endOfWeek(base);
    const label = `Week of ${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    return { start, end, label };
  }
  if (state.period === "custom" && state.customStart && state.customEnd) {
    const start = new Date(`${state.customStart}T00:00:00`);
    const end = new Date(`${state.customEnd}T23:59:59.999`);
    const label = `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    return { start, end, label };
  }
  const offset = state.period === "custom" ? 0 : state.monthOffset;
  const start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const end = new Date(today.getFullYear(), today.getMonth() + offset + 1, 0);
  end.setHours(23, 59, 59, 999);
  const label = start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return { start, end, label };
}

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const rawParams = await searchParams;
  const paramsForFilter = new URLSearchParams();
  Object.entries(rawParams).forEach(([k, v]) => {
    if (typeof v === "string") paramsForFilter.set(k, v);
    else if (Array.isArray(v) && v[0]) paramsForFilter.set(k, v[0]);
  });

  // Back-compat with old ?view=monthly|weekly links
  if (paramsForFilter.get("view") === "monthly" || paramsForFilter.get("view") === "weekly") {
    paramsForFilter.set("period", paramsForFilter.get("view") === "weekly" ? "week" : "month");
    paramsForFilter.set("view", "matrix");
  }

  const filterState = parseFilterParams(paramsForFilter);
  const { start: startDate, end: endDate, label: periodLabel } = resolveRange(filterState);

  const { data: employeesData } = await supabase
    .from("employees")
    .select(
      `
      id,
      department_id,
      profiles!inner(full_name, email, role),
      departments(name)
    `
    )
    .eq("status", "active")
    .eq("profiles.role", "employee")
    .order("id");

  const employeesList = (employeesData ?? []) as EmployeeRecord[];
  const employeeIds = employeesList.map((e) => e.id);

  let sessionsData: RawSession[] = [];
  if (employeeIds.length > 0) {
    const { data } = await supabase
      .from("attendance_sessions")
      .select(
        "id, employee_id, check_in, check_out, auto_closed_at, auto_close_reason, is_manual_entry, manual_added_at"
      )
      .in("employee_id", employeeIds)
      .gte("check_in", startDate.toISOString())
      .lte("check_in", endDate.toISOString())
      .order("check_in", { ascending: true });
    sessionsData = (data ?? []) as RawSession[];
  }

  const { data: holidaysData } = await supabase
    .from("public_holidays")
    .select("date, name")
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0]);
  const holidays: RawHoliday[] = holidaysData ?? [];

  const { data: departmentsData } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");
  const departments = (departmentsData ?? []) as Array<{ id: string; name: string }>;

  const rawEmployees: RawEmployee[] = employeesList
    .map((record) => {
      const p = extractProfile(record);
      return {
        id: record.id,
        full_name: p?.full_name ?? "Unknown Employee",
        email: p?.email ?? "",
        department_id: record.department_id,
        department_name: extractDepartmentName(record),
      };
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  const filteredEmployees = rawEmployees.filter((emp) => {
    if (filterState.departmentId && emp.department_id !== filterState.departmentId) return false;
    if (filterState.search) {
      const needle = filterState.search.toLowerCase();
      if (!emp.full_name.toLowerCase().includes(needle) && !emp.email.toLowerCase().includes(needle))
        return false;
    }
    return true;
  });

  const filteredEmployeeIds = new Set(filteredEmployees.map((e) => e.id));
  const filteredSessions = sessionsData.filter((s) => filteredEmployeeIds.has(s.employee_id));

  const matrix = computeAttendanceMatrix({
    employees: filteredEmployees,
    sessions: filteredSessions,
    holidays,
    range: { start: startDate, end: endDate },
  });

  const rowsAfterChips =
    filterState.statusChips.size === 0
      ? matrix.rows
      : matrix.rows.filter((row) => {
          const chips = filterState.statusChips;
          if (chips.has("overtime") && row.totals.overtimeHours === 0) return false;
          if (chips.has("open") && row.totals.openSessions === 0) return false;
          if (chips.has("auto_closed") && row.totals.autoClosedSessions === 0) return false;
          if (chips.has("manual") && row.totals.manualEntrySessions === 0) return false;
          return true;
        });

  const displayedMatrix = {
    ...matrix,
    rows: rowsAfterChips,
  };

  const exportFilename = `attendance-${matrix.period.start}-to-${matrix.period.end}`;

  return (
    <div
      className="flex flex-col gap-4 -mx-8 -my-8 px-6 py-5"
      style={{ height: "calc(100vh - 64px)", minWidth: 0 }}
    >
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div>
          <span className="eyebrow block mb-1">Reports</span>
          <h1 className="text-[1.75rem] leading-[1.1] font-light tracking-[-0.02em]">
            Attendance
          </h1>
          <p className="text-[13px] text-ink-tertiary mt-1 font-mono tabular-nums">
            <span className="text-ink-secondary">{periodLabel}</span>
            <span className="text-ink-quaternary"> · </span>
            {displayedMatrix.rows.length} of {matrix.rows.length} employees
          </p>
        </div>
        <ExportButtons
          matrix={displayedMatrix}
          filename={exportFilename}
          periodLabel={periodLabel}
        />
      </div>

      <div className="shrink-0">
        <AttendanceFilters
          state={filterState}
          periodLabel={periodLabel}
          departments={departments}
        />
      </div>

      <div className="shrink-0">
        <KpiStrip period={displayedMatrix.period} employeeCount={displayedMatrix.rows.length} />
      </div>

      <div
        className="flex-1 flex flex-col overflow-hidden rounded-md border border-line-subtle bg-surface-raised shadow-e1"
        style={{ minHeight: 0, minWidth: 0 }}
      >
        <div className="flex-1 min-h-0 min-w-0 overflow-auto">
          <AttendanceReportTable
            matrix={displayedMatrix}
            view={filterState.view}
            rangeStart={matrix.period.start}
            rangeEnd={matrix.period.end}
          />
        </div>
      </div>
    </div>
  );
}
