import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FileText, Download, Calendar, Users, TrendingUp } from "lucide-react";
import AttendanceReport from "@/components/reports/AttendanceReport";
import LeaveReport from "@/components/reports/LeaveReport";
import EmployeeReport from "@/components/reports/EmployeeReport";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is admin or super admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Get current month data for quick stats
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get total employees
  const { count: totalEmployees } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Get attendance records for current month
  const { count: attendanceRecords } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true })
    .gte("date", firstDayOfMonth.toISOString().split("T")[0])
    .lte("date", lastDayOfMonth.toISOString().split("T")[0]);

  // Get pending leave requests
  const { count: pendingLeaves } = await supabase
    .from("leave_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Get performance reviews this quarter
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const currentCycle = `Q${currentQuarter} ${now.getFullYear()}`;
  
  const { count: reviewsCount } = await supabase
    .from("performance_reviews")
    .select("*", { count: "exact", head: true })
    .eq("cycle", currentCycle);

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
          Reports & Analytics
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
          Generate and export comprehensive reports
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5" style={{ color: 'var(--tag-orange)' }} />
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
                Active Employees
              </p>
              <p className="text-2xl font-light tabular-nums">{totalEmployees || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5" style={{ color: 'var(--tag-success)' }} />
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
                Attendance Records
              </p>
              <p className="text-2xl font-light tabular-nums">{attendanceRecords || 0}</p>
            </div>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--tag-body)' }}>
            This month
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5" style={{ color: 'var(--tag-warning)' }} />
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
                Pending Leaves
              </p>
              <p className="text-2xl font-light tabular-nums">{pendingLeaves || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--tag-orange)' }} />
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
                Reviews
              </p>
              <p className="text-2xl font-light tabular-nums">{reviewsCount || 0}</p>
            </div>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--tag-body)' }}>
            {currentCycle}
          </p>
        </div>
      </div>

      {/* Report Sections */}
      <div className="space-y-8">
        <AttendanceReport />
        <LeaveReport />
        <EmployeeReport />
      </div>
    </div>
  );
}
