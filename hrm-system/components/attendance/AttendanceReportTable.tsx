"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, AlertCircle } from "lucide-react";
import type {
  AttendanceMatrix,
  AttendanceMatrixRow,
  DayCell,
} from "@/lib/attendance/aggregate";
import type { ViewMode } from "@/lib/attendance/filters";

interface AttendanceReportTableProps {
  matrix: AttendanceMatrix;
  view: ViewMode;
  rangeStart: string;
  rangeEnd: string;
}

const WEEK_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

function cellStyleFor(cell: DayCell, isFuture: boolean): React.CSSProperties {
  if (isFuture) {
    return {
      backgroundColor: "var(--tag-bg)",
      color: "var(--tag-body)",
    };
  }
  if (cell.isHoliday) {
    return {
      backgroundColor: "rgba(148, 163, 184, 0.08)",
      color: "var(--tag-body)",
    };
  }
  if (cell.isWeekend) {
    if (cell.total > 0) {
      return {
        backgroundColor: "rgba(249, 115, 22, 0.12)",
        color: "var(--tag-orange-deep)",
      };
    }
    return {
      backgroundColor: "rgba(148, 163, 184, 0.06)",
      color: "var(--tag-body)",
    };
  }
  if (cell.total >= 8) {
    return {
      backgroundColor: "rgba(22,163,74,0.13)",
      color: "var(--tag-success)",
    };
  }
  if (cell.total > 0) {
    return {
      backgroundColor: "rgba(234,179,8,0.15)",
      color: "var(--tag-warning)",
    };
  }
  return {
    backgroundColor: "rgba(239,68,68,0.09)",
    color: "var(--tag-danger)",
  };
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
      <div className="flex flex-col items-center justify-center gap-2 py-16">
        <AlertCircle className="w-6 h-6" style={{ color: "var(--tag-body)" }} />
        <p style={{ color: "var(--tag-body)" }}>No employees match the current filters.</p>
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

  return (
    <table className="w-full min-w-max border-collapse">
      <thead>
        <tr
          className="table-header sticky top-0"
          style={{ backgroundColor: "var(--tag-bg-warm)", zIndex: 20 }}
        >
          <th
            className="text-left px-4 py-2 sticky left-0"
            style={{
              backgroundColor: "var(--tag-bg-warm)",
              minWidth: "220px",
              zIndex: 21,
            }}
          >
            Employee
          </th>
          {matrix.dayKeys.map((dk) => {
            const info = formatDay(dk);
            const isWknd = matrix.weekendDayKeys.has(dk);
            const isHol = matrix.holidayDayKeys.has(dk);
            const dimmed = isWknd || isHol;
            return (
              <th
                key={dk}
                className="text-center px-1.5 py-2"
                style={{
                  minWidth: "58px",
                  color: dimmed ? "var(--tag-body)" : "var(--tag-label)",
                  opacity: dimmed ? 0.75 : 1,
                }}
                title={isHol ? `Holiday: ${matrix.holidayDayKeys.get(dk)}` : isWknd ? "Weekend" : ""}
              >
                <div className="text-[10px] uppercase">{info.weekday}</div>
                <div className="text-sm tabular-nums">{info.day}</div>
              </th>
            );
          })}
          <th
            className="text-center px-3 py-2 sticky right-0"
            style={{ backgroundColor: "var(--tag-bg-warm)", minWidth: "90px", zIndex: 21 }}
          >
            Total
          </th>
          <th
            className="text-center px-3 py-2 sticky right-0"
            style={{
              backgroundColor: "var(--tag-bg-warm)",
              minWidth: "80px",
              right: "90px",
              zIndex: 21,
            }}
          >
            OT
          </th>
          <th
            className="text-center px-2 py-2"
            style={{ minWidth: "70px" }}
          >
            Absent
          </th>
          <th
            className="text-center px-3 py-2"
            style={{ minWidth: "90px" }}
          >
            Details
          </th>
        </tr>
      </thead>
      <tbody>
        {matrix.rows.map((row) => (
          <tr key={row.employeeId} className="table-row">
            <td
              className="px-4 py-2 sticky left-0"
              style={{ backgroundColor: "var(--tag-bg)", zIndex: 10 }}
            >
              <p className="font-normal leading-tight">{row.employeeName}</p>
              <p className="text-[11px]" style={{ color: "var(--tag-body)" }}>
                {row.employeeEmail}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {row.totals.openSessions > 0 && (
                  <span className="badge badge-warning">{row.totals.openSessions} open</span>
                )}
                {row.totals.autoClosedSessions > 0 && (
                  <span
                    className="badge"
                    style={{ backgroundColor: "rgba(100,116,139,0.1)", color: "var(--tag-label)" }}
                  >
                    ⚙ {row.totals.autoClosedSessions}
                  </span>
                )}
                {row.totals.manualEntrySessions > 0 && (
                  <span className="badge badge-orange">M {row.totals.manualEntrySessions}</span>
                )}
              </div>
            </td>
            {matrix.dayKeys.map((dk) => {
              const cell = row.dayHours[dk];
              const isFuture = dk > todayKey;
              const style = cellStyleFor(cell, isFuture);
              return (
                <td
                  key={`${row.employeeId}-${dk}`}
                  className="px-1.5 py-1 text-center tabular-nums"
                  title={tooltipFor(row, cell, dk)}
                  style={style}
                >
                  <div className="text-sm leading-tight">
                    {cell.total > 0 ? cell.total.toFixed(1) : isFuture ? "" : "—"}
                  </div>
                  {cell.overtime > 0 && (
                    <div
                      className="text-[10px] leading-tight"
                      style={{ color: "var(--tag-orange-deep)" }}
                    >
                      +{cell.overtime.toFixed(1)} OT
                    </div>
                  )}
                </td>
              );
            })}
            <td
              className="px-3 py-2 text-center tabular-nums font-medium sticky right-0"
              style={{ backgroundColor: "var(--tag-bg)", zIndex: 10 }}
            >
              {row.totals.totalHours.toFixed(1)}h
            </td>
            <td
              className="px-3 py-2 text-center tabular-nums sticky right-0"
              style={{
                backgroundColor: "var(--tag-bg)",
                right: "90px",
                zIndex: 10,
                color: row.totals.overtimeHours > 0 ? "var(--tag-orange-deep)" : "var(--tag-body)",
              }}
            >
              {row.totals.overtimeHours > 0 ? `${row.totals.overtimeHours.toFixed(1)}h` : "—"}
            </td>
            <td className="px-2 py-2 text-center tabular-nums" style={{ color: "var(--tag-body)" }}>
              {row.totals.daysAbsent}
            </td>
            <td className="px-3 py-2 text-center text-sm">
              <Link
                href={`/admin/attendance/${row.employeeId}?start=${rangeStart}&end=${rangeEnd}`}
                className="inline-flex items-center gap-1 hover:underline"
                style={{ color: "var(--tag-orange)" }}
              >
                View
                <ArrowRight className="w-3 h-3" />
              </Link>
            </td>
          </tr>
        ))}
        <tr
          style={{
            backgroundColor: "var(--tag-bg-warm)",
            borderTop: "2px solid var(--tag-border)",
          }}
        >
          <td
            className="px-4 py-2 font-medium sticky left-0"
            style={{ backgroundColor: "var(--tag-bg-warm)", zIndex: 10 }}
          >
            Daily totals
          </td>
          {matrix.dayKeys.map((dk) => (
            <td
              key={`totals-${dk}`}
              className="px-1.5 py-2 text-center tabular-nums font-medium"
            >
              {dayTotals[dk] > 0 ? dayTotals[dk].toFixed(1) : "—"}
            </td>
          ))}
          <td
            className="px-3 py-2 text-center tabular-nums font-semibold sticky right-0"
            style={{ backgroundColor: "var(--tag-bg-warm)", zIndex: 10 }}
          >
            {overallTotal.toFixed(1)}h
          </td>
          <td
            className="px-3 py-2 text-center tabular-nums sticky right-0"
            style={{
              backgroundColor: "var(--tag-bg-warm)",
              right: "90px",
              zIndex: 10,
              color: "var(--tag-orange-deep)",
            }}
          >
            {matrix.period.totalsAcrossEmployees.overtimeHours.toFixed(1)}h
          </td>
          <td className="px-2 py-2 text-center" style={{ color: "var(--tag-body)" }}>
            {matrix.period.totalsAcrossEmployees.totalAbsentDays}
          </td>
          <td />
        </tr>
      </tbody>
    </table>
  );
}

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
    <table className="w-full">
      <thead>
        <tr className="table-header sticky top-0" style={{ backgroundColor: "var(--tag-bg-warm)", zIndex: 10 }}>
          <th className="text-left px-4 py-3">Employee</th>
          <th className="text-center px-3 py-3">Present</th>
          <th className="text-center px-3 py-3">Partial</th>
          <th className="text-center px-3 py-3">Absent</th>
          <th className="text-center px-3 py-3">Total</th>
          <th className="text-center px-3 py-3">Regular</th>
          <th className="text-center px-3 py-3">Overtime</th>
          <th className="text-center px-3 py-3">Attendance</th>
          <th className="text-center px-3 py-3">Details</th>
        </tr>
      </thead>
      <tbody>
        {matrix.rows.map((row) => (
          <tr key={row.employeeId} className="table-row">
            <td className="px-4 py-3">
              <p className="font-normal">{row.employeeName}</p>
              <p className="text-xs" style={{ color: "var(--tag-body)" }}>
                {row.employeeEmail}
                {row.departmentName ? ` · ${row.departmentName}` : ""}
              </p>
            </td>
            <td className="px-3 py-3 text-center tabular-nums">
              <span className="badge badge-success">{row.totals.daysPresent}</span>
            </td>
            <td className="px-3 py-3 text-center tabular-nums">
              <span className="badge badge-warning">{row.totals.daysPartial}</span>
            </td>
            <td className="px-3 py-3 text-center tabular-nums">
              <span
                className="badge"
                style={{
                  backgroundColor:
                    row.totals.daysAbsent > 0 ? "var(--tag-danger-bg)" : "var(--tag-bg-warm)",
                  color: row.totals.daysAbsent > 0 ? "#dc2626" : "var(--tag-body)",
                }}
              >
                {row.totals.daysAbsent}
              </span>
            </td>
            <td className="px-3 py-3 text-center tabular-nums font-medium">
              {row.totals.totalHours.toFixed(1)}h
            </td>
            <td className="px-3 py-3 text-center tabular-nums" style={{ color: "var(--tag-body)" }}>
              {row.totals.regularHours.toFixed(1)}h
            </td>
            <td
              className="px-3 py-3 text-center tabular-nums"
              style={{
                color: row.totals.overtimeHours > 0 ? "var(--tag-orange-deep)" : "var(--tag-body)",
              }}
            >
              {row.totals.overtimeHours > 0 ? `${row.totals.overtimeHours.toFixed(1)}h` : "—"}
            </td>
            <td className="px-3 py-3 text-center">
              <span
                className={`badge ${
                  row.totals.attendancePercentage >= 90
                    ? "badge-success"
                    : row.totals.attendancePercentage >= 75
                    ? "badge-warning"
                    : "badge-danger"
                }`}
              >
                {row.totals.attendancePercentage}%
              </span>
            </td>
            <td className="px-3 py-3 text-center">
              <Link
                href={`/admin/attendance/${row.employeeId}?start=${rangeStart}&end=${rangeEnd}`}
                className="inline-flex items-center gap-1 text-sm hover:underline"
                style={{ color: "var(--tag-orange)" }}
              >
                View
                <ArrowRight className="w-3 h-3" />
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

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
    <div className="p-4 space-y-6">
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
    <div
      className="rounded-md border"
      style={{ borderColor: "var(--tag-border)", backgroundColor: "var(--tag-bg)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--tag-border)" }}
      >
        <div>
          <p className="font-normal">{row.employeeName}</p>
          <p className="text-xs" style={{ color: "var(--tag-body)" }}>
            {row.totals.totalHours.toFixed(1)}h · OT {row.totals.overtimeHours.toFixed(1)}h ·{" "}
            {row.totals.attendancePercentage}% attendance
          </p>
        </div>
        <Link
          href={`/admin/attendance/${row.employeeId}?start=${rangeStart}&end=${rangeEnd}`}
          className="text-sm hover:underline inline-flex items-center gap-1"
          style={{ color: "var(--tag-orange)" }}
        >
          Details <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-px" style={{ backgroundColor: "var(--tag-border)" }}>
        {WEEK_HEADERS.map((h) => (
          <div
            key={h}
            className="px-2 py-1.5 text-[11px] uppercase tracking-wide text-center"
            style={{ backgroundColor: "var(--tag-bg-warm)", color: "var(--tag-label)" }}
          >
            {h}
          </div>
        ))}
        {cells.map((c) => {
          if (c.empty) {
            return (
              <div
                key={c.key}
                style={{ backgroundColor: "var(--tag-bg-warm)", minHeight: "54px" }}
              />
            );
          }
          const cell = row.dayHours[c.key];
          const info = formatDay(c.key);
          const isFuture = c.key > todayKey;
          const style = cellStyleFor(cell, isFuture);
          return (
            <div
              key={c.key}
              className="px-2 py-1.5"
              style={{ ...style, minHeight: "54px" }}
              title={tooltipFor(row, cell, c.key)}
            >
              <div
                className="text-[11px] font-medium"
                style={{ color: isFuture ? "var(--tag-body)" : undefined, opacity: isFuture ? 0.6 : 1 }}
              >
                {info.day}
              </div>
              <div className="text-sm tabular-nums leading-tight">
                {cell.total > 0 ? `${cell.total.toFixed(1)}h` : isFuture ? "" : "—"}
              </div>
              {cell.overtime > 0 && (
                <div
                  className="text-[10px] tabular-nums"
                  style={{ color: "var(--tag-orange-deep)" }}
                >
                  +{cell.overtime.toFixed(1)} OT
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
