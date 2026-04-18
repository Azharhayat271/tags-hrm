import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import CheckInButton from "@/components/attendance/CheckInButton";
import TodaySummary from "@/components/attendance/TodaySummary";
import SessionsList from "@/components/attendance/SessionsList";
import MonthlyCalendar from "@/components/attendance/MonthlyCalendar";
import ManualHoursForm from "@/components/attendance/ManualHoursForm";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get employee record
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("profile_id", user?.id)
    .single();

  if (!employee) {
    return (
      <div>
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Attendance
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Employee record not found
        </p>
      </div>
    );
  }

  // Get today's sessions (last 24 hours for night shifts)
  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);

  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("employee_id", employee.id)
    .gte("check_in", last24Hours.toISOString())
    .order("check_in", { ascending: false });

  // Find active session
  const activeSession = sessions?.find(s => !s.check_out) || null;

  // Get current month's attendance summary
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);

  const { data: monthlyAttendance } = await supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", employee.id)
    .gte("date", startOfMonth.toISOString().split('T')[0])
    .lte("date", endOfMonth.toISOString().split('T')[0])
    .order("date", { ascending: true });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Attendance
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Track multiple work sessions per day
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Check In/Out Card */}
        <div className="card p-6">
          <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
            Current Status
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
            {formatDate(new Date())}
          </p>
          <CheckInButton 
            employeeId={employee.id}
            activeSession={activeSession}
          />
        </div>

        {/* Today's Summary */}
        <TodaySummary 
          sessions={sessions || []}
        />

        {/* Today's Sessions */}
        <div className="card p-6">
          <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
            Today's Sessions
          </h3>
          <SessionsList sessions={sessions || []} />
        </div>
      </div>

      {/* Manual Hours Entry */}
      <div className="card p-6 mb-8">
        <ManualHoursForm />
      </div>

      {/* Monthly Calendar */}
      <div className="card p-6">
        <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
          Monthly Attendance
        </h3>
        <MonthlyCalendar 
          attendanceRecords={monthlyAttendance || []}
        />
      </div>
    </div>
  );
}
