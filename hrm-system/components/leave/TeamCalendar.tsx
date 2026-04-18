"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface CalendarLeave {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  days: number;
}

export interface CalendarHoliday {
  date: string;
  name: string;
}

interface TeamCalendarProps {
  year: number;
  month: number; // 1-12
  leaves: CalendarLeave[];
  holidays: CalendarHoliday[];
  basePath: string; // e.g. "/leave/calendar"
  scopeLabel?: string;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_NAMES_PER_CELL = 3;

function monthName(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function iso(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export default function TeamCalendar({
  year,
  month,
  leaves,
  holidays,
  basePath,
  scopeLabel,
}: TeamCalendarProps) {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = firstDay.getDay();

  // Bucket leaves by day
  const leavesByDay = new Map<string, CalendarLeave[]>();
  for (const leave of leaves) {
    // clamp to this month
    const start = new Date(Math.max(new Date(leave.startDate).getTime(), firstDay.getTime()));
    const end = new Date(Math.min(
      new Date(leave.endDate).getTime(),
      new Date(year, month - 1, daysInMonth).getTime()
    ));
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = iso(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate());
      if (!leavesByDay.has(key)) leavesByDay.set(key, []);
      leavesByDay.get(key)!.push(leave);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const holidayMap = new Map(holidays.map((h) => [h.date, h.name]));

  const cells: Array<{ day: number | null; date?: string }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: iso(year, month, d) });
  }
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push({ day: null });

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const todayIso = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5" style={{ color: "var(--accent)" }} />
          <h2 className="text-xl font-light" style={{ letterSpacing: "-0.26px" }}>
            {monthName(year, month)}
          </h2>
          {scopeLabel && (
            <span className="text-xs px-2 py-0.5 rounded-sm bg-surface-muted text-ink-tertiary font-mono tabular-nums">
              {scopeLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`${basePath}?year=${prev.year}&month=${prev.month}`}
            className="btn-ghost w-9 h-9 flex items-center justify-center"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <Link
            href={basePath}
            className="btn-ghost text-xs px-3"
          >
            Today
          </Link>
          <Link
            href={`${basePath}?year=${next.year}&month=${next.month}`}
            className="btn-ghost w-9 h-9 flex items-center justify-center"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="border rounded-sm overflow-hidden" style={{ borderColor: "var(--border-subtle)" }}>
        {/* weekday header */}
        <div className="grid grid-cols-7 bg-surface-muted">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-[10px] font-mono uppercase tracking-wide text-ink-tertiary text-center"
            >
              {label}
            </div>
          ))}
        </div>

        {/* day cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            if (!cell.day || !cell.date) {
              return (
                <div
                  key={idx}
                  className="min-h-[92px] bg-surface-sunken/40 border-t border-l"
                  style={{ borderColor: "var(--border-subtle)" }}
                />
              );
            }
            const dayOfWeek = new Date(cell.date + "T00:00:00").getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = cell.date === todayIso;
            const holiday = holidayMap.get(cell.date);
            const dayLeaves = leavesByDay.get(cell.date) || [];
            // dedupe per employee (a multi-day leave is already expanded per-day above,
            // but a single employee can still only appear once per day)
            const seen = new Set<string>();
            const uniqueLeaves = dayLeaves.filter((l) => {
              if (seen.has(l.employeeId)) return false;
              seen.add(l.employeeId);
              return true;
            });
            const shown = uniqueLeaves.slice(0, MAX_NAMES_PER_CELL);
            const extra = uniqueLeaves.length - shown.length;

            return (
              <div
                key={idx}
                className="min-h-[92px] p-2 border-t border-l flex flex-col gap-1"
                style={{
                  borderColor: "var(--border-subtle)",
                  backgroundColor: isWeekend ? "var(--surface-sunken)" : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={
                      isToday
                        ? "inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-[11px] font-mono tabular-nums"
                        : "text-[11px] font-mono tabular-nums text-ink-tertiary"
                    }
                    style={isToday ? { color: "var(--surface-canvas)" } : undefined}
                  >
                    {cell.day}
                  </span>
                  {holiday && (
                    <span
                      className="text-[9px] uppercase font-mono tracking-wide text-ink-tertiary truncate max-w-[70%]"
                      title={holiday}
                    >
                      {holiday}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 text-[11px]">
                  {shown.map((leave) => (
                    <div
                      key={`${leave.id}-${cell.date}`}
                      className="truncate px-1 py-0.5 rounded-[2px]"
                      style={{
                        backgroundColor: "var(--tag-success-bg)",
                        color: "var(--tag-success)",
                      }}
                      title={`${leave.employeeName} — ${leave.leaveType} (${formatDate(leave.startDate)} – ${formatDate(leave.endDate)})`}
                    >
                      {leave.employeeName}
                    </div>
                  ))}
                  {extra > 0 && (
                    <div className="text-[10px] text-ink-tertiary px-1">
                      +{extra} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* List view */}
      <div>
        <h3 className="text-sm font-light mb-3 text-ink-secondary">
          Leaves this month
          {leaves.length > 0 && (
            <span className="text-[11px] text-ink-tertiary font-mono tabular-nums ml-2">
              ({leaves.length})
            </span>
          )}
        </h3>
        {leaves.length === 0 ? (
          <div className="card p-6 text-center text-sm text-ink-tertiary">
            No approved leaves in this month.
          </div>
        ) : (
          <div className="card divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {leaves
              .slice()
              .sort((a, b) => a.startDate.localeCompare(b.startDate))
              .map((leave) => (
                <div
                  key={leave.id}
                  className="p-3 flex items-center justify-between gap-4"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate">{leave.employeeName}</p>
                    <p className="text-xs text-ink-tertiary truncate">
                      {leave.leaveType} · {leave.days} day{leave.days === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-xs tabular-nums text-ink-tertiary text-right whitespace-nowrap">
                    {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
