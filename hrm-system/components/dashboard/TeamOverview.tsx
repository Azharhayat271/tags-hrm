import { createClient } from "@/lib/supabase/server";
import { Building2 } from "lucide-react";
import { cn } from "@/components/ui";

export default async function TeamOverview() {
  const supabase = await createClient();

  const { data: employees } = await supabase.from("employees").select("department, status");

  const departmentStats: Record<
    string,
    { total: number; active: number; onLeave: number; exited: number }
  > = {};

  employees?.forEach((emp) => {
    const dept = emp.department || "Unassigned";
    if (!departmentStats[dept]) {
      departmentStats[dept] = { total: 0, active: 0, onLeave: 0, exited: 0 };
    }
    departmentStats[dept].total++;
    if (emp.status === "active") departmentStats[dept].active++;
    if (emp.status === "on_leave") departmentStats[dept].onLeave++;
    if (emp.status === "exited") departmentStats[dept].exited++;
  });

  const today = new Date().toISOString().split("T")[0];
  const { count: totalActive } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: checkedIn } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true })
    .eq("date", today)
    .not("check_in", "is", null);

  const attendanceRate = totalActive ? Math.round(((checkedIn || 0) / totalActive) * 100) : 0;
  const rateTone =
    attendanceRate >= 85 ? "success" : attendanceRate >= 60 ? "warning" : "danger";
  const toneBar: Record<typeof rateTone, string> = {
    success: "bg-[var(--success)]",
    warning: "bg-[var(--warning)]",
    danger: "bg-[var(--danger)]",
  };
  const toneText: Record<typeof rateTone, string> = {
    success: "text-[var(--success-text)]",
    warning: "text-[var(--warning-text)]",
    danger: "text-[var(--danger-text)]",
  };

  const sorted = Object.entries(departmentStats).sort((a, b) => b[1].total - a[1].total);
  const overallMax = Math.max(...sorted.map(([, v]) => v.total), 1);

  return (
    <div className="rounded-md border border-line-subtle bg-surface-raised shadow-e1 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-line-subtle flex items-center justify-between">
        <div>
          <span className="eyebrow">Company</span>
          <h3 className="text-[15px] font-normal text-ink-primary mt-0.5">Team overview</h3>
        </div>
        <span className="text-[11px] text-ink-quaternary font-mono tabular-nums">
          {sorted.length} {sorted.length === 1 ? "dept" : "depts"}
        </span>
      </div>

      {/* Today attendance banner */}
      <div className="px-5 py-4 border-b border-line-subtle bg-surface-muted">
        <div className="flex items-center justify-between mb-2">
          <span className="eyebrow">Today · attendance</span>
          <span className={cn("font-display text-[1.75rem] font-light tracking-[-0.02em] font-mono tabular-nums", toneText[rateTone])}>
            {attendanceRate}
            <span className="text-[0.75rem] opacity-70 font-normal">%</span>
          </span>
        </div>
        <div className="h-1.5 rounded-pill bg-surface-sunken overflow-hidden">
          <div
            className={cn("h-full rounded-pill transition-all duration-slow", toneBar[rateTone])}
            style={{ width: `${Math.max(attendanceRate, 2)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-[11px] font-mono tabular-nums text-ink-tertiary">
          <span>
            <span className="text-ink-secondary">{checkedIn || 0}</span> of{" "}
            <span className="text-ink-secondary">{totalActive || 0}</span> active checked in
          </span>
          <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
      </div>

      {/* Departments ledger */}
      <div>
        <div className="px-5 py-2 border-b border-line-subtle bg-surface-sunken">
          <span className="eyebrow">Departments</span>
        </div>
        {sorted.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-ink-tertiary">
            No department data available.
          </div>
        ) : (
          <ul>
            {sorted.map(([dept, s], idx) => {
              const share = (s.total / overallMax) * 100;
              const activePct = s.total > 0 ? Math.round((s.active / s.total) * 100) : 0;
              return (
                <li
                  key={dept}
                  className={cn(
                    "px-5 py-3.5 flex items-center gap-4",
                    idx !== sorted.length - 1 && "border-b border-line-subtle",
                  )}
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-sm bg-surface-sunken border border-line-subtle shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-ink-tertiary" strokeWidth={1.75} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-[13px] text-ink-primary truncate">{dept}</span>
                      <span className="font-mono tabular-nums text-[13px] text-ink-primary shrink-0">
                        {s.total}
                      </span>
                    </div>
                    {/* Share bar */}
                    <div className="h-1 rounded-pill bg-surface-sunken overflow-hidden mb-2">
                      <div
                        className="h-full bg-ink-primary rounded-pill"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-x-4 gap-y-0.5 flex-wrap text-[11px] font-mono tabular-nums">
                      <StatPip
                        label="Active"
                        value={s.active}
                        tone="success"
                        extra={s.total > 0 ? `${activePct}%` : undefined}
                      />
                      {s.onLeave > 0 && <StatPip label="On leave" value={s.onLeave} tone="warning" />}
                      {s.exited > 0 && <StatPip label="Exited" value={s.exited} tone="danger" />}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatPip({
  label,
  value,
  tone,
  extra,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger";
  extra?: string;
}) {
  const toneText: Record<typeof tone, string> = {
    success: "text-[var(--success-text)]",
    warning: "text-[var(--warning-text)]",
    danger: "text-[var(--danger-text)]",
  };
  const toneDot: Record<typeof tone, string> = {
    success: "bg-[var(--success)]",
    warning: "bg-[var(--warning)]",
    danger: "bg-[var(--danger)]",
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("w-1 h-1 rounded-pill", toneDot[tone])} />
      <span className={cn("font-medium", toneText[tone])}>{value}</span>
      <span className="text-ink-quaternary">{label}</span>
      {extra && <span className="text-ink-quaternary">· {extra}</span>}
    </span>
  );
}
