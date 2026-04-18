import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import TeamOverview from "@/components/dashboard/TeamOverview";
import { StatStrip, StatCell } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const role = profile.role || "employee";

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  const stats = {
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    todayAttendance: 0,
    myLeaveBalance: 0,
    myPendingLeaves: 0,
    upcomingReviews: 0,
  };

  if (role === "admin" || role === "super_admin") {
    const { count: totalEmployees } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true });

    const { count: activeEmployees } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    const { count: pendingLeaves } = await supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const today = new Date().toISOString().split("T")[0];
    const { count: todayAttendance } = await supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("date", today)
      .not("check_in", "is", null);

    stats.totalEmployees = totalEmployees || 0;
    stats.activeEmployees = activeEmployees || 0;
    stats.pendingLeaves = pendingLeaves || 0;
    stats.todayAttendance = todayAttendance || 0;
  } else if (employee) {
    const { data: leaveTypes } = await supabase.from("leave_types").select("*");
    const { data: approvedLeaves } = await supabase
      .from("leave_requests")
      .select("days, leave_type_id")
      .eq("employee_id", employee.id)
      .eq("status", "approved");

    const totalAnnualLeave =
      leaveTypes?.find((lt) => lt.name.toLowerCase().includes("annual"))?.days_per_year || 20;
    const usedLeave = approvedLeaves?.reduce((sum, leave) => sum + leave.days, 0) || 0;
    stats.myLeaveBalance = totalAnnualLeave - usedLeave;

    const { count: myPendingLeaves } = await supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employee.id)
      .eq("status", "pending");
    stats.myPendingLeaves = myPendingLeaves || 0;

    const { count: upcomingReviews } = await supabase
      .from("performance_reviews")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employee.id)
      .is("acknowledged_at", null);
    stats.upcomingReviews = upcomingReviews || 0;
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const dateLong = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const dateShort = now.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  const weekNumber = getWeekNumber(now);

  const isAdminLike = role === "admin" || role === "super_admin";
  const attendancePct =
    isAdminLike && stats.activeEmployees > 0
      ? Math.round((stats.todayAttendance / stats.activeEmployees) * 100)
      : 0;

  return (
    <div className="max-w-[1240px] mx-auto">
      {/* Editorial hero */}
      <header className="mb-10 flex items-start justify-between gap-8 flex-wrap reveal">
        <div>
          <span className="eyebrow block mb-3">
            {greeting} · Week {weekNumber}
          </span>
          <h1 className="text-[2.5rem] leading-[1.05] font-light tracking-[-0.025em] text-ink-primary text-balance">
            Welcome back, <span className="text-ink-accent">{firstName}</span>.
          </h1>
          <p className="text-[15px] text-ink-tertiary mt-3 font-mono tabular-nums">
            {dateLong}
          </p>
        </div>
        <div className="flex items-center gap-6 pt-1">
          <DateBlock
            top={now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
            middle={String(now.getDate()).padStart(2, "0")}
            bottom={now.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
          />
          <div className="hidden sm:flex flex-col text-right gap-1 border-l border-line-subtle pl-6 py-1">
            <span className="eyebrow">Date</span>
            <span className="font-mono tabular-nums text-[13px] text-ink-primary">{dateShort}</span>
            <span className="eyebrow mt-2">Week</span>
            <span className="font-mono tabular-nums text-[13px] text-ink-primary">{weekNumber} / 52</span>
          </div>
        </div>
      </header>

      {/* Today / KPI strip */}
      <section className="mb-10 reveal" style={{ animationDelay: "60ms" } as React.CSSProperties}>
        <div className="flex items-end justify-between mb-3">
          <span className="eyebrow">Today at a glance</span>
        </div>

        {isAdminLike ? (
          <StatStrip className="grid-cols-2 md:grid-cols-4">
            <StatCell
              label="Total employees"
              value={stats.totalEmployees}
              sub={<span className="font-mono tabular-nums">all time</span>}
            />
            <StatCell
              label="Active today"
              value={stats.activeEmployees}
              tone="success"
              sub={
                <span className="font-mono tabular-nums text-[11px]">
                  <span className="text-ink-secondary">{stats.totalEmployees > 0
                    ? Math.round((stats.activeEmployees / stats.totalEmployees) * 100) : 0}%</span>
                  <span className="text-ink-quaternary"> of roster</span>
                </span>
              }
            />
            <StatCell
              label="Pending leaves"
              value={stats.pendingLeaves}
              tone={stats.pendingLeaves > 0 ? "warning" : "default"}
              sub={stats.pendingLeaves > 0 ? "awaiting approval" : "nothing in queue"}
            />
            <StatCell
              label="Checked in today"
              value={stats.todayAttendance}
              tone={attendancePct >= 80 ? "success" : attendancePct >= 50 ? "warning" : "danger"}
              sub={
                <span className="font-mono tabular-nums text-[11px]">
                  <span className="text-ink-secondary">{attendancePct}%</span>
                  <span className="text-ink-quaternary"> of active ({stats.activeEmployees})</span>
                </span>
              }
            />
          </StatStrip>
        ) : (
          <StatStrip className="grid-cols-1 md:grid-cols-3">
            <StatCell
              label="Leave balance"
              value={stats.myLeaveBalance}
              unit="days"
              tone={stats.myLeaveBalance > 5 ? "success" : stats.myLeaveBalance > 0 ? "warning" : "danger"}
              sub="remaining this year"
            />
            <StatCell
              label="Pending requests"
              value={stats.myPendingLeaves}
              tone={stats.myPendingLeaves > 0 ? "warning" : "default"}
              sub={stats.myPendingLeaves > 0 ? "awaiting approval" : "all requests resolved"}
            />
            <StatCell
              label="Reviews to acknowledge"
              value={stats.upcomingReviews}
              tone={stats.upcomingReviews > 0 ? "accent" : "default"}
              sub={stats.upcomingReviews > 0 ? "open in performance" : "nothing pending"}
            />
          </StatStrip>
        )}
      </section>

      {/* Quick actions */}
      <section className="mb-10 reveal" style={{ animationDelay: "120ms" } as React.CSSProperties}>
        <QuickActions role={role} employeeId={employee?.id} />
      </section>

      {/* Activity + events */}
      <section
        className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10 reveal"
        style={{ animationDelay: "180ms" } as React.CSSProperties}
      >
        <div className="lg:col-span-2">
          <RecentActivity role={role} employeeId={employee?.id} />
        </div>
        <div>
          <UpcomingEvents role={role} employeeId={employee?.id} />
        </div>
      </section>

      {/* Team overview (admin only) */}
      {isAdminLike && (
        <section className="reveal" style={{ animationDelay: "240ms" } as React.CSSProperties}>
          <TeamOverview />
        </section>
      )}
    </div>
  );
}

function DateBlock({ top, middle, bottom }: { top: string; middle: string; bottom: string }) {
  return (
    <div className="flex flex-col items-center border border-line-subtle rounded-md overflow-hidden bg-surface-raised shadow-e1 min-w-[72px]">
      <div className="w-full px-3 py-1 text-center text-[9px] font-medium uppercase tracking-[0.1em] text-ink-inverse bg-ink-primary">
        {top}
      </div>
      <div className="px-3 py-2 font-display text-[2rem] leading-none font-light tracking-[-0.02em] text-ink-primary tabular-nums">
        {middle}
      </div>
      <div className="w-full px-3 pb-1.5 text-center text-[10px] font-mono text-ink-tertiary uppercase tracking-[0.08em]">
        {bottom}
      </div>
    </div>
  );
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
