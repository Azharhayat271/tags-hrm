import { createClient } from "@/lib/supabase/server";
import { Users, UserCheck, UserX, Clock } from "lucide-react";

export default async function TeamOverview() {
  const supabase = await createClient();

  // Get department breakdown
  const { data: employees } = await supabase
    .from("employees")
    .select("department, status");

  // Group by department
  const departmentStats: Record<string, { total: number; active: number; onLeave: number; exited: number }> = {};

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

  // Get today's attendance rate
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

  return (
    <div className="card p-6">
      <h3 className="text-lg font-light mb-6" style={{ letterSpacing: '-0.22px' }}>
        Team Overview
      </h3>

      {/* Attendance Rate */}
      <div className="mb-6 p-4 rounded" style={{ backgroundColor: 'var(--tag-bg-warm)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: 'var(--tag-orange)' }} />
            <span className="text-sm font-normal">Today's Attendance</span>
          </div>
          <span className="text-lg font-light tabular-nums" style={{ color: 'var(--tag-orange)' }}>
            {attendanceRate}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--tag-border)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${attendanceRate}%`,
              background: 'linear-gradient(90deg, var(--tag-orange), var(--tag-amber))',
            }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--tag-body)' }}>
          {checkedIn} of {totalActive} employees checked in
        </p>
      </div>

      {/* Department Breakdown */}
      <div className="space-y-4">
        <h4 className="text-sm font-normal" style={{ color: 'var(--tag-label)' }}>
          Department Breakdown
        </h4>
        {Object.entries(departmentStats)
          .sort((a, b) => b[1].total - a[1].total)
          .map(([dept, stats]) => (
            <div
              key={dept}
              className="p-4 rounded border"
              style={{ borderColor: 'var(--tag-border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-normal">{dept}</h5>
                <span className="text-lg font-light tabular-nums">{stats.total}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3 h-3" style={{ color: 'var(--tag-success)' }} />
                  <span style={{ color: 'var(--tag-body)' }}>
                    {stats.active} Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" style={{ color: 'var(--tag-warning)' }} />
                  <span style={{ color: 'var(--tag-body)' }}>
                    {stats.onLeave} On Leave
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UserX className="w-3 h-3" style={{ color: 'var(--tag-body)' }} />
                  <span style={{ color: 'var(--tag-body)' }}>
                    {stats.exited} Exited
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
