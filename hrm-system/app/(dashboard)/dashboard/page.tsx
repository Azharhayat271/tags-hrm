import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { 
  Users, 
  Clock, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import TeamOverview from "@/components/dashboard/TeamOverview";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile with error handling
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const role = profile.role || "employee";

  // Get employee record - use maybeSingle() to avoid errors if no record exists
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle(); // Changed from .single() to .maybeSingle()



  // Get stats based on role
  let stats = {
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    todayAttendance: 0,
    myLeaveBalance: 0,
    myPendingLeaves: 0,
    upcomingReviews: 0,
  };

  if (role === "admin" || role === "super_admin") {
    // Admin stats
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
    // Employee stats
    const { data: leaveTypes } = await supabase
      .from("leave_types")
      .select("*");

    const { data: approvedLeaves } = await supabase
      .from("leave_requests")
      .select("days, leave_type_id")
      .eq("employee_id", employee.id)
      .eq("status", "approved");

    // Calculate remaining leave balance (simplified)
    const totalAnnualLeave = leaveTypes?.find(lt => lt.name.toLowerCase().includes("annual"))?.days_per_year || 20;
    const usedLeave = approvedLeaves?.reduce((sum, leave) => sum + leave.days, 0) || 0;
    stats.myLeaveBalance = totalAnnualLeave - usedLeave;

    const { count: myPendingLeaves } = await supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employee.id)
      .eq("status", "pending");

    stats.myPendingLeaves = myPendingLeaves || 0;

    // Get unacknowledged reviews
    const { count: upcomingReviews } = await supabase
      .from("performance_reviews")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employee.id)
      .is("acknowledged_at", null);

    stats.upcomingReviews = upcomingReviews || 0;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
          Welcome back, {profile?.full_name?.split(" ")[0] || "User"}
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
          {new Date().toLocaleDateString("en-US", { 
            weekday: "long", 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          })}
        </p>
      </div>

      {/* Stats Grid */}
      {role === "admin" || role === "super_admin" ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5" style={{ color: 'var(--tag-orange)' }} />
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
                  Total Employees
                </p>
                <p className="text-2xl font-light tabular-nums">{stats.totalEmployees}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5" style={{ color: 'var(--tag-success)' }} />
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
                  Active Employees
                </p>
                <p className="text-2xl font-light tabular-nums">{stats.activeEmployees}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5" style={{ color: 'var(--tag-warning)' }} />
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
                  Pending Leaves
                </p>
                <p className="text-2xl font-light tabular-nums">{stats.pendingLeaves}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5" style={{ color: 'var(--tag-orange)' }} />
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
                  Today's Attendance
                </p>
                <p className="text-2xl font-light tabular-nums">{stats.todayAttendance}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5" style={{ color: 'var(--tag-success)' }} />
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
                  Leave Balance
                </p>
                <p className="text-2xl font-light tabular-nums">{stats.myLeaveBalance} days</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5" style={{ color: 'var(--tag-warning)' }} />
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
                  Pending Requests
                </p>
                <p className="text-2xl font-light tabular-nums">{stats.myPendingLeaves}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--tag-orange)' }} />
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
                  Reviews to Acknowledge
                </p>
                <p className="text-2xl font-light tabular-nums">{stats.upcomingReviews}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions role={role} employeeId={employee?.id} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <RecentActivity role={role} employeeId={employee?.id} />
        </div>
        <div>
          <UpcomingEvents role={role} employeeId={employee?.id} />
        </div>
      </div>

      {/* Team Overview for Admins */}
      {(role === "admin" || role === "super_admin") && (
        <div className="mt-8">
          <TeamOverview />
        </div>
      )}
    </div>
  );
}
