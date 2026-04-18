import type { PeriodSummary } from "@/lib/attendance/aggregate";
import { StatStrip, StatCell } from "@/components/ui";

interface KpiStripProps {
  period: PeriodSummary;
  employeeCount: number;
}

export default function KpiStrip({ period, employeeCount }: KpiStripProps) {
  const t = period.totalsAcrossEmployees;
  const pct = t.attendancePercentage;

  return (
    <StatStrip className="grid-cols-2 md:grid-cols-4">
      <StatCell
        label="Total hours"
        value={t.totalHours.toFixed(1)}
        unit="h"
        sub={
          <span className="font-mono tabular-nums text-[11px]">
            <span className="text-ink-secondary">{t.regularHours.toFixed(1)}h</span>
            <span className="text-ink-quaternary"> regular</span>
          </span>
        }
      />
      <StatCell
        label="Overtime"
        value={t.overtimeHours.toFixed(1)}
        unit="h"
        tone={t.overtimeHours > 0 ? "accent" : "default"}
        sub={t.overtimeHours > 0 ? `across ${employeeCount} ${employeeCount === 1 ? "person" : "people"}` : "none this period"}
      />
      <StatCell
        label="Attendance"
        value={pct}
        unit="%"
        tone={pct >= 90 ? "success" : pct >= 75 ? "default" : "warning"}
        sub={
          <span className="font-mono tabular-nums text-[11px] text-ink-tertiary">
            {period.workingDayCount} working days
          </span>
        }
      />
      <StatCell
        label="Absent entries"
        value={t.totalAbsentDays}
        tone={t.totalAbsentDays > 0 ? "danger" : "default"}
        sub={
          <span className="text-[11px] text-ink-tertiary">
            across <span className="font-mono tabular-nums text-ink-secondary">{employeeCount}</span> employees
          </span>
        }
      />
    </StatStrip>
  );
}
