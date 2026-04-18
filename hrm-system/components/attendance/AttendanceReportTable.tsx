"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, CalendarX2 } from "lucide-react";
import type {
  AttendanceMatrix,
  AttendanceMatrixRow,
  DayCell,
} from "@/lib/attendance/aggregate";
import type { ViewMode } from "@/lib/attendance/filters";
import { Badge, EmptyState, cn } from "@/components/ui";

interface AttendanceReportTableProps {
  matrix: AttendanceMatrix;
  view: ViewMode;
  rangeStart: string;
  rangeEnd: string;
}

const WEEK_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CellTone = "success" | "warning" | "danger" | "accent" | "neutral" | "future";

const toneBgClass: Record<CellTone, string> = {
  success: "bg-[var(--success-tint)]",
  warning: "bg-[var(--warning-tint)]",
  danger:  "bg-[var(--danger-tint)]",
  accent:  "bg-[var(--accent-tint)]",
  neutral: "bg-surface-sunken/60",
  future:  "bg-surface-raised",
};

const toneTextClass: Record<CellTone, string> = {
  success: "text-[var(--success-text)]",
  warning: "text-[var(--warning-text)]",
  danger:  "text-[var(--danger-text)]",
  accent:  "text-[var(--accent-deep)]",
  neutral: "text-ink-quaternary",
  future:  "text-ink-quaternary",
};

function formatDay(dayKey: string) {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    date,
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    day: date.getDate(),
    monthShort: date.toLocaleDateString("en-US", { month: "short" }),
  };
}

function toneFor(cell: DayCell, isFuture: boolean): CellTone {
  if (isFuture) return "future";
  if (cell.isHoliday) return "neutral";
  if (cell.isWeekend) return cell.total > 0 ? "accent" : "neutral";
  if (cell.total >= 8) return "success";
  if (cell.total > 0) return "warning";
  return "danger";
}

function tooltipFor(row: AttendanceMatrixRow, cell: DayCell, dayKey: string): string {
  const parts: string[] = [`${row.employeeName} – ${dayKey}`, `${cell.total.toFixed(2)}h`];
  if (cell.overtime > 0) parts.push(`OT ${cell.overtime.toFixed(2)}h`);
  if (cell.firstCheckIn) parts.push(`First in ${cell.firstCheckIn}`);
  if (cell.isWeekend) parts.push("Weekend");
  if (cell.isHoliday) parts.push(`Holiday: ${cell.holidayName}`);
  if (cell.flags.includes("manual")) parts.push("Has manual entry");
  if (cell.flags.includes("auto_closed")) parts.push("Has auto-closed session");
  if (cell.hasOpenSession) parts.push("Has open session");
  return parts.join(" · ");
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AttendanceReportTable({
  matrix,
  view,
  rangeStart,
  rangeEnd,
}: AttendanceReportTableProps) {
  const todayKey = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }, []);

  if (matrix.rows.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<CalendarX2 className="w-5 h-5" />}
          title="No employees match the filters"
          description="Try clearing the department, search, or status filters to see more people."
        />
      </div>
    );
  }

  if (view === "matrix") {
    return (
      <MatrixView
        matrix={matrix}
        todayKey={todayKey}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
      />
    );
  }

  if (view === "calendar") {
    return (
      <CalendarView
        matrix={matrix}
        todayKey={todayKey}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
      />
    );
  }

  return <SummaryView matrix={matrix} rangeStart={rangeStart} rangeEnd={rangeEnd} />;
}

/* =====================================================================
 * Matrix view — dense bloomberg-style grid
 * ===================================================================== */
function MatrixView({
  matrix,
  todayKey,
  rangeStart,
  rangeEnd,
}: {
  matrix: AttendanceMatrix;
  todayKey: string;
  rangeStart: string;
  rangeEnd: string;
}) {
  const dayTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    matrix.dayKeys.forEach((dk) => {
      totals[dk] = matrix.rows.reduce((s, r) => s + (r.dayHours[dk]?.total || 0), 0);
    });
    return totals;
  }, [matrix]);

  const overallTotal = matrix.period.totalsAcrossEmployees.totalHours;

  const stickyRightTotal = "right-0";
  const stickyRightOT    = "right-[88px]";

  return (
    <table className="w-full min-w-max border-collapse text-[12px]">
      <thead>
        <tr className="sticky top-0 z-20 bg-surface-sunken">
          <th
            className={cn(
              "text-left px-4 py-2.5 sticky left-0 z-30 bg-surface-sunken",
              "border-b border-r border-line-subtle",
            )}
            style={{ minWidth: "240px" }}
          >
            <span className="eyebrow">Employee</span>
          </th>
          {matrix.dayKeys.map((dk) => {
            const info = formatDay(dk);
            const isWknd = matrix.weekendDayKeys.has(dk);
            const isHol = matrix.holidayDayKeys.has(dk);
            const isToday = dk === todayKey;
            return (
              <th
                key={dk}
                className={cn(
                  "text-center px-1 py-2 border-b border-line-subtle",
                  isToday && "bg-accent-tint",
                )}
                style={{ minWidth: "52px" }}
                title={isHol ? `Holiday: ${matrix.holidayDayKeys.get(dk)}` : isWknd ? "Weekend" : ""}
              >
                <div
                  className={cn(
                    "text-[9px] font-medium uppercase tracking-[0.06em]",
                    isWknd || isHol ? "text-ink-quaternary" : "text-ink-tertiary",
                  )}
                >
                  {info.weekday}
                </div>
                <div
                  className={cn(
                    "text-[11px] font-mono tabular-nums mt-0.5",
                    isToday ? "text-[var(--accent-deep)] font-semibold" :
                    isWknd || isHol ? "text-ink-quaternary" : "text-ink-secondary",
                  )}
                >
                  {String(info.day).padStart(2, "0")}
                </div>
              </th>
            );
          })}
          <th
            className={cn(
              "text-right px-3 py-2.5 sticky z-30 bg-surface-sunken",
              "border-b border-l border-line-subtle",
              stickyRightOT,
            )}
            style={{ minWidth: "80px" }}
          >
            <span className="eyebrow">OT</span>
          </th>
          <th
            className={cn(
              "text-right px-3 py-2.5 sticky z-30 bg-surface-sunken",
              "border-b border-l border-line-subtle",
              stickyRightTotal,
            )}
            style={{ minWidth: "88px" }}
          >
            <span className="eyebrow">Total</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {matrix.rows.map((row) => (
          <tr key={row.employeeId} className="group hover:bg-surface-muted/40 transition-colors duration-fast">
            <td
              className={cn(
                "px-4 py-2.5 sticky left-0 z-10 bg-surface-raised",
                "group-hover:bg-[var(--stone-100)]",
                "border-b border-r border-line-subtle transition-colors duration-fast",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="inline-flex items-center justify-center w-7 h-7 rounded-sm bg-surface-sunken border border-line-subtle text-[10px] font-medium text-ink-secondary tracking-wide shrink-0"
                >
                  {initialsFor(row.employeeName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/attendance/${row.employeeId}?start=${rangeStart}&end=${rangeEnd}`}
                      className="text-[13px] text-ink-primary font-normal truncate hover:text-ink-accent transition-colors"
                    >
                      {row.employeeName}
                    </Link>
                    <ArrowRight
                      className="w-3 h-3 text-ink-quaternary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      strokeWidth={2}
                    />
                  </div>
                  <div className="text-[11px] text-ink-tertiary truncate">
                    {row.employeeEmail}
                    {row.departmentName && (
                      <>
                        <span className="text-ink-quaternary"> · </span>
                        {row.departmentName}
                      </>
                    )}
                  </div>
                  {(row.totals.openSessions > 0 ||
                    row.totals.autoClosedSessions > 0 ||
                    row.totals.manualEntrySessions > 0) && (
                    <div className="flex gap-1 mt-1">
                      {row.totals.openSessions > 0 && (
                        <Badge variant="info" size="sm" dot>
                          {row.totals.openSessions} open
                        </Badge>
                      )}
                      {row.totals.autoClosedSessions > 0 && (
                        <Badge variant="warning" size="sm" mono>
                          ⚙ {row.totals.autoClosedSessions}
                        </Badge>
                      )}
                      {row.totals.manualEntrySessions > 0 && (
                        <Badge variant="accent" size="sm" mono>
                          M {row.totals.manualEntrySessions}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </td>
            {matrix.dayKeys.map((dk) => {
              const cell = row.dayHours[dk];
              const isFuture = dk > todayKey;
              const isToday = dk === todayKey;
              const tone = toneFor(cell, isFuture);
              return (
                <td
                  key={`${row.employeeId}-${dk}`}
                  className={cn(
                    "relative text-center border-b border-r border-line-subtle/60 last:border-r-0",
                    "px-0.5 py-1.5 transition-colors duration-fast",
                    toneBgClass[tone],
                    isToday && !isFuture && "ring-1 ring-inset ring-[var(--accent-wash)]",
                  )}
                  title={tooltipFor(row, cell, dk)}
                >
                  <span
                    className={cn(
                      "block font-mono tabular-nums text-[12px] leading-none",
                      toneTextClass[tone],
                      isFuture && "opacity-40",
                    )}
                  >
                    {cell.total > 0 ? cell.total.toFixed(1) : isFuture ? "" : "—"}
                  </span>
                  {cell.overtime > 0 && (
                    <span
                      className="block font-mono tabular-nums text-[9px] leading-none mt-1 text-[var(--accent-deep)]"
                      title="Overtime"
                    >
                      +{cell.overtime.toFixed(1)}
                    </span>
                  )}
                  {cell.flags.includes("manual") && (
                    <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-pill bg-[var(--accent)]" aria-label="Manual entry" />
                  )}
                </td>
              );
            })}
            <td
              className={cn(
                "sticky z-10 bg-surface-raised group-hover:bg-[var(--stone-100)]",
                "px-3 py-2 text-right font-mono tabular-nums text-[12px]",
                "border-b border-l border-line-subtle transition-colors duration-fast",
                stickyRightOT,
                row.totals.overtimeHours > 0 ? "text-[var(--accent-deep)]" : "text-ink-quaternary",
              )}
            >
              {row.totals.overtimeHours > 0 ? row.totals.overtimeHours.toFixed(1) : "—"}
            </td>
            <td
              className={cn(
                "sticky z-10 bg-surface-raised group-hover:bg-[var(--stone-100)]",
                "px-3 py-2 text-right font-mono tabular-nums text-[13px] text-ink-primary",
                "border-b border-l border-line-subtle transition-colors duration-fast",
                stickyRightTotal,
              )}
            >
              {row.totals.totalHours.toFixed(1)}
              <span className="text-[10px] text-ink-quaternary">h</span>
            </td>
          </tr>
        ))}

        {/* Daily totals footer — bloomberg ledger feel */}
        <tr className="bg-[var(--stone-100)]">
          <td
            className={cn(
              "sticky left-0 z-10 bg-[var(--stone-100)]",
              "px-4 py-2.5 border-t-2 border-r border-line",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="eyebrow">Daily totals</span>
            </div>
          </td>
          {matrix.dayKeys.map((dk) => (
            <td
              key={`totals-${dk}`}
              className="px-0.5 py-2.5 text-center font-mono tabular-nums text-[11px] text-ink-secondary border-t-2 border-r border-line-subtle/60 last:border-r-0"
            >
              {dayTotals[dk] > 0 ? dayTotals[dk].toFixed(1) : "—"}
            </td>
          ))}
          <td
            className={cn(
              "sticky z-10 bg-[var(--stone-100)] font-mono tabular-nums text-[12px] text-[var(--accent-deep)]",
              "px-3 py-2.5 text-right border-t-2 border-l border-line",
              stickyRightOT,
            )}
          >
            {matrix.period.totalsAcrossEmployees.overtimeHours.toFixed(1)}
          </td>
          <td
            className={cn(
              "sticky z-10 bg-[var(--stone-100)] font-mono tabular-nums text-[13px] text-ink-primary font-medium",
              "px-3 py-2.5 text-right border-t-2 border-l border-line",
              stickyRightTotal,
            )}
          >
            {overallTotal.toFixed(1)}
            <span className="text-[10px] text-ink-tertiary font-normal">h</span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/* =====================================================================
 * Summary view — clean numeric table with inline percentage bar
 * ===================================================================== */
function SummaryView({
  matrix,
  rangeStart,
  rangeEnd,
}: {
  matrix: AttendanceMatrix;
  rangeStart: string;
  rangeEnd: string;
}) {
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr className="sticky top-0 z-10 bg-surface-sunken">
          <th className="text-left px-5 py-3 border-b border-line-subtle">
            <span className="eyebrow">Employee</span>
          </th>
          <th className="text-right px-3 py-3 border-b border-line-subtle" style={{ width: 90 }}>
            <span className="eyebrow">Present</span>
          </th>
          <th className="text-right px-3 py-3 border-b border-line-subtle" style={{ width: 90 }}>
            <span className="eyebrow">Partial</span>
          </th>
          <th className="text-right px-3 py-3 border-b border-line-subtle" style={{ width: 90 }}>
            <span className="eyebrow">Absent</span>
          </th>
          <th className="text-right px-3 py-3 border-b border-line-subtle" style={{ width: 110 }}>
            <span className="eyebrow">Total</span>
          </th>
          <th className="text-right px-3 py-3 border-b border-line-subtle" style={{ width: 110 }}>
            <span className="eyebrow">Regular</span>
          </th>
          <th className="text-right px-3 py-3 border-b border-line-subtle" style={{ width: 110 }}>
            <span className="eyebrow">Overtime</span>
          </th>
          <th className="text-left px-3 py-3 border-b border-line-subtle" style={{ width: 160 }}>
            <span className="eyebrow">Attendance</span>
          </th>
          <th className="px-3 py-3 border-b border-line-subtle" style={{ width: 80 }} />
        </tr>
      </thead>
      <tbody>
        {matrix.rows.map((row) => {
          const pct = row.totals.attendancePercentage;
          const pctTone =
            pct >= 90 ? "var(--success-text)" :
            pct >= 75 ? "var(--warning-text)" :
            "var(--danger-text)";
          const pctBar =
            pct >= 90 ? "bg-[var(--success)]" :
            pct >= 75 ? "bg-[var(--warning)]" :
            "bg-[var(--danger)]";
          return (
            <tr
              key={row.employeeId}
              className="group border-b border-line-subtle hover:bg-surface-muted/60 transition-colors duration-fast"
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="inline-flex items-center justify-center w-8 h-8 rounded-sm bg-surface-sunken border border-line-subtle text-[11px] font-medium text-ink-secondary shrink-0"
                  >
                    {initialsFor(row.employeeName)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-ink-primary truncate">{row.employeeName}</div>
                    <div className="text-[11px] text-ink-tertiary truncate">
                      {row.employeeEmail}
                      {row.departmentName && (
                        <>
                          <span className="text-ink-quaternary"> · </span>
                          {row.departmentName}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 text-right font-mono tabular-nums text-[var(--success-text)]">
                {row.totals.daysPresent}
              </td>
              <td className="px-3 py-3 text-right font-mono tabular-nums text-[var(--warning-text)]">
                {row.totals.daysPartial || <span className="text-ink-quaternary">—</span>}
              </td>
              <td className={cn(
                "px-3 py-3 text-right font-mono tabular-nums",
                row.totals.daysAbsent > 0 ? "text-[var(--danger-text)]" : "text-ink-quaternary",
              )}>
                {row.totals.daysAbsent || "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono tabular-nums text-ink-primary">
                {row.totals.totalHours.toFixed(1)}
                <span className="text-[10px] text-ink-quaternary">h</span>
              </td>
              <td className="px-3 py-3 text-right font-mono tabular-nums text-ink-secondary">
                {row.totals.regularHours.toFixed(1)}
                <span className="text-[10px] text-ink-quaternary">h</span>
              </td>
              <td className={cn(
                "px-3 py-3 text-right font-mono tabular-nums",
                row.totals.overtimeHours > 0 ? "text-[var(--accent-deep)]" : "text-ink-quaternary",
              )}>
                {row.totals.overtimeHours > 0 ? (
                  <>
                    +{row.totals.overtimeHours.toFixed(1)}
                    <span className="text-[10px] opacity-70">h</span>
                  </>
                ) : "—"}
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-pill bg-surface-sunken overflow-hidden min-w-[60px]">
                    <div
                      className={cn("h-full rounded-pill transition-all", pctBar)}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span
                    className="font-mono tabular-nums text-[12px] min-w-[36px] text-right"
                    style={{ color: pctTone }}
                  >
                    {pct}%
                  </span>
                </div>
              </td>
              <td className="px-3 py-3 text-right">
                <Link
                  href={`/admin/attendance/${row.employeeId}?start=${rangeStart}&end=${rangeEnd}`}
                  className={cn(
                    "inline-flex items-center gap-1 text-[12px] text-ink-tertiary",
                    "opacity-0 group-hover:opacity-100 transition-opacity",
                    "hover:text-ink-accent",
                  )}
                >
                  View
                  <ArrowRight className="w-3 h-3" strokeWidth={2} />
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* =====================================================================
 * Calendar view — per-employee mini heat grid
 * ===================================================================== */
function CalendarView({
  matrix,
  todayKey,
  rangeStart,
  rangeEnd,
}: {
  matrix: AttendanceMatrix;
  todayKey: string;
  rangeStart: string;
  rangeEnd: string;
}) {
  return (
    <div className="p-5 space-y-4 bg-surface-canvas">
      {matrix.rows.map((row) => (
        <CalendarRow
          key={row.employeeId}
          row={row}
          matrix={matrix}
          todayKey={todayKey}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
        />
      ))}
    </div>
  );
}

function CalendarRow({
  row,
  matrix,
  todayKey,
  rangeStart,
  rangeEnd,
}: {
  row: AttendanceMatrixRow;
  matrix: AttendanceMatrix;
  todayKey: string;
  rangeStart: string;
  rangeEnd: string;
}) {
  const firstDay = formatDay(matrix.dayKeys[0]).date;
  const leadingBlanks = ((firstDay.getDay() + 6) % 7);
  const cells: Array<{ key: string; empty?: boolean }> = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push({ key: `blank-${i}`, empty: true });
  matrix.dayKeys.forEach((dk) => cells.push({ key: dk }));
  while (cells.length % 7 !== 0) cells.push({ key: `trail-${cells.length}`, empty: true });

  return (
    <div className="rounded-md border border-line-subtle bg-surface-raised overflow-hidden shadow-e1">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-line-subtle">
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden
            className="inline-flex items-center justify-center w-9 h-9 rounded-sm bg-surface-sunken border border-line-subtle text-[11px] font-medium text-ink-secondary shrink-0"
          >
            {initialsFor(row.employeeName)}
          </span>
          <div className="min-w-0">
            <div className="text-[14px] text-ink-primary truncate">{row.employeeName}</div>
            <div className="text-[11px] text-ink-tertiary font-mono tabular-nums flex items-center gap-x-2 gap-y-0.5 flex-wrap">
              <span>{row.totals.totalHours.toFixed(1)}h total</span>
              <span className="text-ink-quaternary">·</span>
              <span className="text-[var(--accent-deep)]">+{row.totals.overtimeHours.toFixed(1)}h OT</span>
              <span className="text-ink-quaternary">·</span>
              <span
                className={cn(
                  row.totals.attendancePercentage >= 90 ? "text-[var(--success-text)]" :
                  row.totals.attendancePercentage >= 75 ? "text-[var(--warning-text)]" :
                  "text-[var(--danger-text)]",
                )}
              >
                {row.totals.attendancePercentage}%
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/admin/attendance/${row.employeeId}?start=${rangeStart}&end=${rangeEnd}`}
          className="text-[12px] text-ink-tertiary hover:text-ink-accent inline-flex items-center gap-1 transition-colors"
        >
          Details <ArrowRight className="w-3 h-3" strokeWidth={2} />
        </Link>
      </div>
      <div className="grid grid-cols-7">
        {WEEK_HEADERS.map((h) => (
          <div
            key={h}
            className="px-2 py-1.5 text-[9px] font-medium uppercase tracking-[0.06em] text-center text-ink-tertiary bg-surface-sunken border-b border-line-subtle"
          >
            {h}
          </div>
        ))}
        {cells.map((c, idx) => {
          const isLastCol = (idx + 1) % 7 === 0;
          if (c.empty) {
            return (
              <div
                key={c.key}
                className={cn(
                  "bg-surface-sunken/40 border-b border-line-subtle",
                  !isLastCol && "border-r",
                )}
                style={{ minHeight: "52px" }}
              />
            );
          }
          const cell = row.dayHours[c.key];
          const info = formatDay(c.key);
          const isFuture = c.key > todayKey;
          const isToday = c.key === todayKey;
          const tone = toneFor(cell, isFuture);

          return (
            <div
              key={c.key}
              className={cn(
                "px-2 py-1.5 flex flex-col justify-between border-b border-line-subtle",
                !isLastCol && "border-r",
                toneBgClass[tone],
              )}
              style={{ minHeight: "52px" }}
              title={tooltipFor(row, cell, c.key)}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-[10px] font-mono tabular-nums",
                    isToday ? "bg-accent text-white px-1 py-0.5 rounded-xs" : toneTextClass[tone],
                  )}
                >
                  {String(info.day).padStart(2, "0")}
                </span>
                {cell.overtime > 0 && (
                  <span className="text-[8px] font-mono text-[var(--accent-deep)]">
                    +{cell.overtime.toFixed(1)}
                  </span>
                )}
              </div>
              <span className={cn("text-[12px] font-mono tabular-nums leading-none", toneTextClass[tone])}>
                {cell.total > 0 ? `${cell.total.toFixed(1)}h` : isFuture ? "" : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
