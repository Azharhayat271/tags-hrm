import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AttendanceReportTable from "@/components/attendance/AttendanceReportTable";
import { Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string }>;
}) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is admin or super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const view = params.view || "monthly";
  const today = new Date();
  
  let startDate: Date;
  let endDate: Date;
  let periodLabel: string;

  if (view === "weekly") {
    // Get current week (Monday to Sunday)
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    startDate = new Date(today);
    startDate.setDate(today.getDate() + diff);
    startDate.setHours(0, 0, 0, 0);
    
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    periodLabel = `Week of ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else {
    // Monthly view
    const monthOffset = params.month ? parseInt(params.month) : 0;
    startDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    endDate = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0);
    periodLabel = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // Fetch all employees with their attendance sessions for the period
  const { data: employees } = await supabase
    .from("employees")
    .select(`
      id,
      profiles(full_name, email),
      attendance_sessions(
        id,
        check_in,
        check_out
      )
    `)
    .eq("status", "active")
    .gte("attendance_sessions.check_in", startDate.toISOString())
    .lte("attendance_sessions.check_in", endDate.toISOString())
    .order("profiles(full_name)");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
            Work Hours Summary
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
            {periodLabel} - All Employees
          </p>
        </div>
        <button className="btn-ghost flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="card p-6">
        <AttendanceReportTable 
          employees={employees || []} 
          view={view}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </div>
  );
}
