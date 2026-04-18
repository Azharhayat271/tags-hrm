import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Clock, Calendar as CalendarIcon, PencilLine, CircleDashed } from "lucide-react";
import EmployeeExportButtons from "@/components/attendance/EmployeeExportButtons";
import {
  computeAttendanceMatrix,
  formatHours,
  type RawHoliday,
  type RawSession,
} from "@/lib/attendance/aggregate";
import {
  Badge,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  EmptyState,
  PageHeader,
  StatStrip,
  StatCell,
} from "@/components/ui";

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
  const { data: { user } } = await supabase.auth.getUser();

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

  const initials = row.employeeName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-[1240px] mx-auto">
      <PageHeader
        back={{ href: "/admin/attendance", label: "All employees" }}
        eyebrow="Attendance · Employee detail"
        title={
          <span className="inline-flex items-center gap-4">
            <span
              aria-hidden
              className="inline-flex items-center justify-center w-11 h-11 rounded-md bg-surface-sunken border border-line-subtle text-sm font-medium tracking-wide text-ink-secondary"
            >
              {initials}
            </span>
            {row.employeeName}
          </span>
        }
        meta={
          <>
            <span>{row.employeeEmail}</span>
            {row.departmentName && (
              <>
                <span className="text-ink-quaternary">·</span>
                <span>{row.departmentName}</span>
              </>
            )}
            <span className="text-ink-quaternary">·</span>
            <span className="font-mono tabular-nums">{periodLabel}</span>
          </>
        }
        actions={
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
        }
      />

      {/* Primary stat strip — one continuous rule-divided band */}
      <StatStrip className="grid-cols-2 md:grid-cols-4 mb-3 reveal" style={{ animationDelay: "40ms" } as React.CSSProperties}>
        <StatCell
          label="Total hours"
          value={totals.totalHours.toFixed(1)}
          unit="h"
          sub={formatHours(totals.totalHours)}
        />
        <StatCell
          label="Regular"
          value={totals.regularHours.toFixed(1)}
          unit="h"
          sub="capped at 8h / day"
        />
        <StatCell
          label="Overtime"
          value={totals.overtimeHours.toFixed(1)}
          unit="h"
          tone={totals.overtimeHours > 0 ? "accent" : "default"}
          sub={
            totals.overtimeHours > 0
              ? `daily +${totals.dailyOvertimeHours.toFixed(1)} · weekly +${totals.weeklyOvertimeHours.toFixed(1)}`
              : "none this period"
          }
        />
        <StatCell
          label="Attendance"
          value={totals.attendancePercentage}
          unit="%"
          tone={
            totals.attendancePercentage >= 90 ? "success" :
            totals.attendancePercentage >= 70 ? "default" : "warning"
          }
          sub={
            <span className="inline-flex items-center gap-2 font-mono text-[11px]">
              <span className="text-[var(--success-text)]">{totals.daysPresent} full</span>
              <span className="text-ink-quaternary">·</span>
              <span className="text-[var(--warning-text)]">{totals.daysPartial} partial</span>
              <span className="text-ink-quaternary">·</span>
              <span className="text-[var(--danger-text)]">{totals.daysAbsent} absent</span>
            </span>
          }
        />
      </StatStrip>

      <StatStrip className="grid-cols-3 mb-10 reveal" style={{ animationDelay: "100ms" } as React.CSSProperties}>
        <StatCell
          label="Weekend work"
          value={totals.daysWeekendWorked}
          sub="days on Sat / Sun"
        />
        <StatCell
          label="Auto-closed"
          value={totals.autoClosedSessions}
          sub="sessions closed by system"
          tone={totals.autoClosedSessions > 0 ? "warning" : "default"}
        />
        <StatCell
          label="Manual entries"
          value={totals.manualEntrySessions}
          sub="sessions added manually"
          tone={totals.manualEntrySessions > 0 ? "accent" : "default"}
        />
      </StatStrip>

      {/* Calendar heat-grid — bordered cells, codes, bloomberg feel */}
      <Card className="mb-10 reveal overflow-hidden" style={{ animationDelay: "160ms" } as React.CSSProperties}>
        <CardHeader>
          <CardTitle eyebrow="Calendar">
            {firstDayKey
              ? new Date(firstDayKey).toLocaleDateString("en-US", { month: "long", year: "numeric" })
              : "Period"}
          </CardTitle>
          <div className="flex items-center gap-x-4 gap-y-1.5 flex-wrap text-[11px] text-ink-tertiary font-mono">
            <LegendSwatch tone="success" code="F" label="Full" />
            <LegendSwatch tone="warning" code="P" label="Partial" />
            <LegendSwatch tone="danger"  code="A" label="Absent" />
            <LegendSwatch tone="accent"  code="W" label="Weekend work" />
            <LegendSwatch tone="neutral" code="·" label="Off / holiday" />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-sunken">
                {weekDays.map((day) => (
                  <th
                    key={day}
                    className="px-3 py-2.5 text-center text-[10px] font-medium tracking-[0.08em] uppercase text-ink-tertiary border-b border-line-subtle"
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
                          className="bg-surface-sunken/60 border-r border-b border-line-subtle last:border-r-0"
                          style={{ height: "96px" }}
                        />
                      );
                    }
                    return (
                      <DayCell
                        key={dayKey}
                        dayKey={dayKey}
                        cell={row.dayHours[dayKey]}
                        isLastCol={dayIdx === 6}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Daily sessions — ledger-style */}
      <section className="reveal" style={{ animationDelay: "220ms" } as React.CSSProperties}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="eyebrow block mb-1">Activity</span>
            <h2 className="text-[1.375rem] font-light tracking-[-0.015em]">Daily sessions</h2>
          </div>
          <span className="text-xs text-ink-tertiary font-mono tabular-nums">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {Object.keys(sessionsByDate).length === 0 ? (
          <EmptyState
            icon={<CalendarIcon className="w-5 h-5" />}
            title="No sessions in this period"
            description="The employee did not check in during the selected date range. Try adjusting the period or confirm the employee's schedule."
          />
        ) : (
          <div className="space-y-3">
            {Object.entries(sessionsByDate).map(([date, daySessions]) => {
              let totalMs = 0;
              daySessions.forEach((s) => {
                if (s.check_out) totalMs += new Date(s.check_out).getTime() - new Date(s.check_in).getTime();
              });
              const hours = Math.floor(totalMs / 3600000);
              const minutes = Math.floor((totalMs % 3600000) / 60000);

              return (
                <Card key={date}>
                  <div className="px-5 py-3.5 border-b border-line-subtle flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 flex items-center justify-center rounded-sm bg-surface-sunken border border-line-subtle">
                        <CalendarIcon className="w-4 h-4 text-ink-tertiary" />
                      </div>
                      <div>
                        <div className="text-[15px] text-ink-primary leading-tight">{formatLongDate(date)}</div>
                        <div className="text-xs text-ink-tertiary mt-0.5">
                          {daySessions.length} session{daySessions.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="eyebrow">Day total</span>
                      <span className="font-mono tabular-nums text-sm text-ink-primary">
                        {hours}h {String(minutes).padStart(2, "0")}m
                      </span>
                    </div>
                  </div>
                  <ul className="divide-y divide-line-subtle">
                    {daySessions.map((session, idx) => {
                      const duration = calculateDuration(session.check_in, session.check_out);
                      return (
                        <li
                          key={session.id}
                          className="px-5 py-3 flex items-center gap-4 flex-wrap hover:bg-surface-muted transition-colors duration-fast"
                        >
                          <span className="text-[10px] font-mono text-ink-quaternary w-6 tabular-nums">
                            {String(daySessions.length - idx).padStart(2, "0")}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-ink-tertiary">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-mono tabular-nums text-ink-primary">
                              {formatTime(session.check_in)}
                            </span>
                            <span className="text-ink-quaternary">→</span>
                            <span className="font-mono tabular-nums text-ink-primary">
                              {session.check_out ? formatTime(session.check_out) : "—"}
                            </span>
                          </span>
                          <div className="ml-auto flex items-center gap-2">
                            {session.is_manual_entry && (
                              <Badge variant="accent" size="sm" icon={<PencilLine className="w-3 h-3" />}>
                                Manual
                              </Badge>
                            )}
                            {session.auto_closed_at && (
                              <Badge
                                variant="warning"
                                size="sm"
                                icon={<CircleDashed className="w-3 h-3" />}
                                title={`Auto-closed: ${session.auto_close_reason ?? ""}`}
                              >
                                Auto-closed
                              </Badge>
                            )}
                            {!session.check_out && !session.auto_closed_at && (
                              <Badge variant="info" size="sm" dot>
                                In progress
                              </Badge>
                            )}
                            {duration && (
                              <span className="font-mono tabular-nums text-sm text-ink-primary min-w-[64px] text-right">
                                {duration.hours}h {String(duration.minutes).padStart(2, "0")}m
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* --- DayCell: a single calendar cell rendered with border + code + hours --- */
function DayCell({
  dayKey,
  cell,
  isLastCol,
}: {
  dayKey: string;
  cell: {
    total: number;
    overtime: number;
    isWeekend: boolean;
    isHoliday: boolean;
    holidayName: string | null;
  };
  isLastCol: boolean;
}) {
  const date = new Date(dayKey);
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  type CellTone = "success" | "warning" | "danger" | "accent" | "neutral";
  let tone: CellTone = "danger";
  let code = "A";

  if (cell.isHoliday) {
    tone = "neutral";
    code = "·";
  } else if (cell.isWeekend) {
    tone = cell.total > 0 ? "accent" : "neutral";
    code = cell.total > 0 ? "W" : "·";
  } else if (cell.total >= 8) {
    tone = "success";
    code = "F";
  } else if (cell.total > 0) {
    tone = "warning";
    code = "P";
  }

  const toneBg: Record<CellTone, string> = {
    success: "bg-[var(--success-tint)]",
    warning: "bg-[var(--warning-tint)]",
    danger:  "bg-[var(--danger-tint)]",
    accent:  "bg-[var(--accent-tint)]",
    neutral: "bg-surface-sunken",
  };
  const toneCode: Record<CellTone, string> = {
    success: "text-[var(--success-text)]",
    warning: "text-[var(--warning-text)]",
    danger:  "text-[var(--danger-text)]",
    accent:  "text-[var(--accent-deep)]",
    neutral: "text-ink-quaternary",
  };

  return (
    <td
      className={`align-top p-0 ${isLastCol ? "" : "border-r"} border-b border-line-subtle`}
      style={{ height: "96px", width: "14.2857%" }}
    >
      <div className={`h-full w-full px-2.5 py-2 flex flex-col relative ${toneBg[tone]}`}>
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-mono tabular-nums ${
              isToday ? "bg-accent text-white px-1.5 py-0.5 rounded-xs" : "text-ink-secondary"
            }`}
          >
            {String(date.getDate()).padStart(2, "0")}
          </span>
          <span className={`text-[10px] font-mono font-medium ${toneCode[tone]}`}>{code}</span>
        </div>
        <div className="mt-auto flex items-end justify-between">
          {cell.total > 0 ? (
            <span className={`font-mono tabular-nums text-[13px] ${toneCode[tone]}`}>
              {cell.total.toFixed(1)}
              <span className="text-[10px] opacity-70">h</span>
            </span>
          ) : (
            <span className="text-[10px] text-ink-quaternary">
              {cell.isHoliday ? "Holiday" : cell.isWeekend ? "Off" : "—"}
            </span>
          )}
          {cell.overtime > 0 && (
            <span className="text-[9px] font-mono tabular-nums text-[var(--accent-deep)]">
              +{cell.overtime.toFixed(1)}
            </span>
          )}
        </div>
        {cell.isHoliday && cell.holidayName && (
          <div className="absolute bottom-1 left-2.5 right-2.5 text-[9px] text-ink-quaternary truncate">
            {cell.holidayName}
          </div>
        )}
      </div>
    </td>
  );
}

function LegendSwatch({
  tone,
  code,
  label,
}: {
  tone: "success" | "warning" | "danger" | "accent" | "neutral";
  code: string;
  label: string;
}) {
  const toneClasses: Record<typeof tone, string> = {
    success: "bg-[var(--success-tint)] text-[var(--success-text)] border-[var(--success-border)]",
    warning: "bg-[var(--warning-tint)] text-[var(--warning-text)] border-[var(--warning-border)]",
    danger:  "bg-[var(--danger-tint)] text-[var(--danger-text)] border-[var(--danger-border)]",
    accent:  "bg-[var(--accent-tint)] text-[var(--accent-deep)] border-[var(--accent-wash)]",
    neutral: "bg-surface-sunken text-ink-tertiary border-line-subtle",
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center justify-center w-4 h-4 rounded-xs border text-[9px] font-semibold ${toneClasses[tone]}`}
      >
        {code}
      </span>
      <span>{label}</span>
    </span>
  );
}

