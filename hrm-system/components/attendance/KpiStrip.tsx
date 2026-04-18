import { Clock, TrendingUp, Users, CalendarX } from "lucide-react";
import type { PeriodSummary } from "@/lib/attendance/aggregate";

interface KpiStripProps {
  period: PeriodSummary;
  employeeCount: number;
}

export default function KpiStrip({ period, employeeCount }: KpiStripProps) {
  const t = period.totalsAcrossEmployees;

  const cards = [
    {
      label: "Total hours",
      value: `${t.totalHours.toFixed(1)}h`,
      sub: `${t.regularHours.toFixed(1)}h regular`,
      icon: Clock,
      tint: "var(--tag-orange)",
    },
    {
      label: "Overtime",
      value: `${t.overtimeHours.toFixed(1)}h`,
      sub: t.overtimeHours > 0 ? "flagged across team" : "none this period",
      icon: TrendingUp,
      tint: "#d97706",
    },
    {
      label: "Attendance",
      value: `${t.attendancePercentage}%`,
      sub: `${period.workingDayCount} working days`,
      icon: Users,
      tint: "var(--tag-success)",
    },
    {
      label: "Absent day-entries",
      value: String(t.totalAbsentDays),
      sub: `${employeeCount} employees`,
      icon: CalendarX,
      tint: "var(--tag-danger)",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-md border p-3"
          style={{
            backgroundColor: "var(--tag-bg)",
            borderColor: "var(--tag-border)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <c.icon className="w-4 h-4" style={{ color: c.tint }} />
            <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--tag-label)" }}>
              {c.label}
            </span>
          </div>
          <p className="text-xl tabular-nums" style={{ color: "var(--tag-heading)" }}>
            {c.value}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--tag-body)" }}>
            {c.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
