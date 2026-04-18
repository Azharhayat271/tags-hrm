import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import Link from "next/link";
import EmployeeExportButtons from "@/components/attendance/EmployeeExportButtons";
import {
  computeAttendanceMatrix,
  formatHours,
  type RawHoliday,
  type RawSession,
} from "@/lib/attendance/aggregate";

export const dynamic = "force-dynamic";

interface AttendanceSession extends RawSession {
  auto_close_reason?: string | null;
}

export default async function EmployeeAttendanceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
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

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  defaultEnd.setHours(23, 59, 59, 999);

  const startDate = resolvedSearchParams.start ? new Date(resolvedSearchParams.start) : defaultStart;
  const endDate = resolvedSearchParams.end ? new Date(resolvedSearchParams.end) : defaultEnd;

  const { data: employee } = await supabase
    .from("employees")
    .select(`id, department_id, profiles!inner(full_name, email, role), departments(name)`)
    .eq("id", resolvedParams.id)
    .eq("profiles.role", "employee")
    .single();

  if (!employee) {
    redirect("/admin/attendance");
  }

  const employeeProfile = Array.isArray(employee.profiles)
    ? employee.profiles[0]
    : employee.profiles;
  const department = Array.isArray(employee.departments)
    ? employee.departments[0] ?? null
    : employee.departments;

  const { data: sessionsData } = await supabase
    .from("attendance_sessions")
    .select(
      "id, employee_id, check_in, check_out, auto_closed_at, auto_close_reason, is_manual_entry, manual_added_at"
    )
    .eq("employee_id", resolvedParams.id)
    .gte("check_in", startDate.toISOString())
    .lte("check_in", endDate.toISOString())
    .order("check_in", { ascending: false });

  const sessions: AttendanceSession[] = (sessionsData ?? []) as AttendanceSession[];

  const { data: holidaysData } = await supabase
    .from("public_holidays")
    .select("date, name")
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0]);
  const holidays: RawHoliday[] = holidaysData ?? [];

  const matrix = computeAttendanceMatrix({
    employees: [
      {
        id: resolvedParams.id,
        full_name: employeeProfile?.full_name ?? "Unknown Employee",
        email: employeeProfile?.email ?? "",
        department_id: employee.department_id,
        department_name: department?.name ?? null,
      },
    ],
    sessions,
    holidays,
    range: { start: startDate, end: endDate },
  });

  const row = matrix.rows[0];
  const totals = row.totals;

  const sessionsByDate = sessions.reduce((acc, session) => {
    const date = new Date(session.check_in).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {} as Record<string, AttendanceSession[]>);

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const formatLongDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const calculateDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return null;
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return { hours, minutes };
  };

  const periodLabel = `${startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} – ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [firstDayKey] = matrix.dayKeys;
  const firstDayOfWeek = firstDayKey ? (new Date(firstDayKey).getDay() + 6) % 7 : 0;

  const grid: Array<Array<string | null>> = [];
  let currentWeek: Array<string | null> = Array(firstDayOfWeek).fill(null);
  for (const dayKey of matrix.dayKeys) {
    currentWeek.push(dayKey);
    if (currentWeek.length === 7) {
      grid.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    grid.push(currentWeek);
  }

  const exportFilename = `attendance-${row.employeeName.replace(/\s+/g, "_")}-${matrix.period.start}-to-${matrix.period.end}`;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin/attendance"
            className="inline-flex items-center gap-2 text-sm mb-3 hover:underline"
            style={{ color: "var(--tag-orange)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Attendance
          </Link>
          <h1 style={{ fontSize: "1.75rem", lineHeight: 1.1, letterSpacing: "-0.56px" }}>
            {row.employeeName}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--tag-body)" }}>
            {row.employeeEmail}
            {row.departmentName ? ` · ${row.departmentName}` : ""}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--tag-label)" }}>
            {periodLabel}
          </p>
        </div>
        <EmployeeExportButtons
          matrix={matrix}
          row={row}
          sessions={sessions.map((s) => ({
            check_in: s.check_in,
            check_out: s.check_out,
            is_manual_entry: s.is_manual_entry,
            auto_closed_at: s.auto_closed_at,
          }))}
          periodLabel={periodLabel}
          filename={exportFilename}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi
          label="Total hours"
          value={`${totals.totalHours.toFixed(1)}h`}
          sub={formatHours(totals.totalHours)}
        />
        <Kpi
          label="Regular"
          value={`${totals.regularHours.toFixed(1)}h`}
          sub="capped at 8h/day"
        />
        <Kpi
          label="Overtime"
          value={`${totals.overtimeHours.toFixed(1)}h`}
          sub={
            totals.overtimeHours > 0
              ? `daily +${totals.dailyOvertimeHours.toFixed(1)} / weekly +${totals.weeklyOvertimeHours.toFixed(1)}`
              : "none this period"
          }
          tint="var(--tag-orange-deep)"
        />
        <Kpi
          label="Attendance"
          value={`${totals.attendancePercentage}%`}
          sub={`${totals.daysPresent} full · ${totals.daysPartial} partial · ${totals.daysAbsent} absent`}
          tint="var(--tag-success)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <Kpi
          label="Weekend work"
          value={String(totals.daysWeekendWorked)}
          sub="days worked Sat/Sun"
        />
        <Kpi
          label="Auto-closed"
          value={String(totals.autoClosedSessions)}
          sub="sessions closed by system"
        />
        <Kpi
          label="Manual entries"
          value={String(totals.manualEntrySessions)}
          sub="hours added manually"
        />
      </div>

      <div className="card p-6 mb-8">
        <h2 className="text-lg font-light mb-4" style={{ letterSpacing: "-0.22px" }}>
          Monthly calendar ·{" "}
          {firstDayKey
            ? new Date(firstDayKey).toLocaleDateString("en-US", { month: "long", year: "numeric" })
            : ""}
        </h2>

        <div className="mb-3 flex items-center gap-3 text-xs flex-wrap" style={{ color: "var(--tag-body)" }}>
          <Legend color="rgba(22,163,74,0.13)" label="Full day (8h+)" />
          <Legend color="rgba(234,179,8,0.15)" label="Partial" />
          <Legend color="rgba(239,68,68,0.09)" label="Absent" />
          <Legend color="rgba(249,115,22,0.12)" label="Weekend worked" />
          <Legend color="rgba(148,163,184,0.08)" label="Weekend / holiday" />
        </div>

        <div
          className="overflow-x-auto rounded"
          style={{ border: "1px solid var(--tag-border)" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--tag-bg-warm)" }}>
                {weekDays.map((day) => (
                  <th
                    key={day}
                    className="px-2 py-2 text-center text-xs font-medium"
                    style={{ color: "var(--tag-label)" }}
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((week, weekIdx) => (
                <tr key={weekIdx}>
                  {week.map((dayKey, dayIdx) => {
                    if (!dayKey) {
                      return (
                        <td
                          key={`empty-${weekIdx}-${dayIdx}`}
                          style={{ backgroundColor: "var(--tag-bg-warm)", height: "72px" }}
                        />
                      );
                    }
                    const cell = row.dayHours[dayKey];
                    const date = new Date(dayKey);
                    const isHol = cell.isHoliday;
                    const isWknd = cell.isWeekend;
                    let bg = "rgba(239,68,68,0.09)";
                    let fg = "var(--tag-danger)";
                    if (isHol) {
                      bg = "rgba(148,163,184,0.08)";
                      fg = "var(--tag-body)";
                    } else if (isWknd) {
                      bg = cell.total > 0 ? "rgba(249,115,22,0.12)" : "rgba(148,163,184,0.06)";
                      fg = cell.total > 0 ? "var(--tag-orange-deep)" : "var(--tag-body)";
                    } else if (cell.total >= 8) {
                      bg = "rgba(22,163,74,0.13)";
                      fg = "var(--tag-success)";
                    } else if (cell.total > 0) {
                      bg = "rgba(234,179,8,0.15)";
                      fg = "var(--tag-warning)";
                    }
                    return (
                      <td
                        key={dayKey}
                        className="align-top px-2 py-2 border"
                        style={{
                          borderColor: "var(--tag-border)",
                          backgroundColor: bg,
                          minHeight: "72px",
                        }}
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium" style={{ color: fg }}>
                              {date.getDate()}
                            </span>
                          </div>
                          <div className="text-sm tabular-nums" style={{ color: fg }}>
                            {cell.total > 0 ? `${cell.total.toFixed(1)}h` : isHol ? "" : isWknd ? "" : "—"}
                          </div>
                          {cell.overtime > 0 && (
                            <div className="text-[10px] tabular-nums" style={{ color: "var(--tag-orange-deep)" }}>
                              +{cell.overtime.toFixed(1)} OT
                            </div>
                          )}
                          {isHol && (
                            <div className="text-[9px]" style={{ color: "var(--tag-body)" }}>
                              {cell.holidayName}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-light" style={{ letterSpacing: "-0.22px" }}>
          Daily sessions
        </h2>
        {Object.keys(sessionsByDate).length === 0 ? (
          <div className="card p-12 text-center">
            <p style={{ color: "var(--tag-body)" }}>
              No attendance sessions found for this period
            </p>
          </div>
        ) : (
          Object.entries(sessionsByDate).map(([date, daySessions]) => {
            let totalMs = 0;
            daySessions.forEach((s) => {
              if (s.check_out) totalMs += new Date(s.check_out).getTime() - new Date(s.check_in).getTime();
            });
            const hours = Math.floor(totalMs / 3600000);
            const minutes = Math.floor((totalMs % 3600000) / 60000);

            return (
              <div key={date} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-medium">{formatLongDate(date)}</h3>
                    <p className="text-sm" style={{ color: "var(--tag-body)" }}>
                      {daySessions.length} session{daySessions.length !== 1 ? "s" : ""} · Total{" "}
                      {hours}h {minutes}m
                    </p>
                  </div>
                  <Calendar className="w-5 h-5" style={{ color: "var(--tag-orange)" }} />
                </div>
                <div className="space-y-2">
                  {daySessions.map((session, idx) => {
                    const duration = calculateDuration(session.check_in, session.check_out);
                    return (
                      <div
                        key={session.id}
                        className="p-3 rounded border flex items-center gap-3 flex-wrap"
                        style={{
                          borderColor: "var(--tag-border)",
                          backgroundColor: "var(--tag-bg-warm)",
                        }}
                      >
                        <Clock className="w-4 h-4" style={{ color: "var(--tag-orange)" }} />
                        <span className="text-sm font-medium">
                          {session.is_manual_entry ? "Manual entry" : `Session ${daySessions.length - idx}`}
                        </span>
                        <span className="text-sm" style={{ color: "var(--tag-body)" }}>
                          {formatTime(session.check_in)} →{" "}
                          {session.check_out ? formatTime(session.check_out) : "—"}
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                          {session.is_manual_entry && (
                            <span className="badge badge-orange">Manual</span>
                          )}
                          {session.auto_closed_at && (
                            <span
                              className="badge"
                              style={{
                                backgroundColor: "rgba(100,116,139,0.1)",
                                color: "var(--tag-label)",
                              }}
                              title={`Auto-closed: ${session.auto_close_reason ?? ""}`}
                            >
                              ⚙ Auto
                            </span>
                          )}
                          {!session.check_out && !session.auto_closed_at && (
                            <span className="badge badge-warning">In progress</span>
                          )}
                          {duration && (
                            <span
                              className="text-sm tabular-nums"
                              style={{ color: "var(--tag-orange)" }}
                            >
                              {duration.hours}h {duration.minutes}m
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tint,
}: {
  label: string;
  value: string;
  sub: string;
  tint?: string;
}) {
  return (
    <div className="card p-3">
      <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--tag-label)" }}>
        {label}
      </p>
      <p className="text-xl tabular-nums mt-1" style={{ color: tint ?? "var(--tag-heading)" }}>
        {value}
      </p>
      <p className="text-[11px] mt-0.5" style={{ color: "var(--tag-body)" }}>
        {sub}
      </p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="w-3 h-3 rounded"
        style={{ backgroundColor: color, border: "1px solid var(--tag-border)" }}
      />
      {label}
    </span>
  );
}
