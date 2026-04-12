import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EmployeeAttendanceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
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

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const startDate = resolvedSearchParams.start ? new Date(resolvedSearchParams.start) : new Date();
  const endDate = resolvedSearchParams.end ? new Date(resolvedSearchParams.end) : new Date();

  // Fetch employee info
  const { data: employee } = await supabase
    .from("employees")
    .select(`
      id,
      profiles(full_name, email)
    `)
    .eq("id", resolvedParams.id)
    .single();

  if (!employee) {
    redirect("/admin/attendance");
  }

  // Fetch all sessions for the period
  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("employee_id", resolvedParams.id)
    .gte("check_in", startDate.toISOString())
    .lte("check_in", endDate.toISOString())
    .order("check_in", { ascending: false });

  // Group sessions by date
  const sessionsByDate = (sessions || []).reduce((acc, session) => {
    const date = new Date(session.check_in).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, typeof sessions>);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return null;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const ms = end.getTime() - start.getTime();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  };

  const calculateDayTotal = (daySessions: typeof sessions) => {
    let totalMs = 0;
    daySessions.forEach(session => {
      if (session.check_out) {
        const start = new Date(session.check_in);
        const end = new Date(session.check_out);
        totalMs += end.getTime() - start.getTime();
      }
    });
    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  };

  // Calculate overall stats
  let totalHours = 0;
  let totalMinutes = 0;
  let totalSessions = sessions?.length || 0;
  let completedSessions = 0;

  sessions?.forEach(session => {
    if (session.check_out) {
      completedSessions++;
      const duration = calculateDuration(session.check_in, session.check_out);
      if (duration) {
        totalHours += duration.hours;
        totalMinutes += duration.minutes;
      }
    }
  });

  totalHours += Math.floor(totalMinutes / 60);
  totalMinutes = totalMinutes % 60;

  const periodLabel = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/attendance" 
          className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
          style={{ color: 'var(--tag-orange)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Attendance Report
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
              {employee.profiles?.full_name}
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
              {employee.profiles?.email}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--tag-label)' }}>
              {periodLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
            Total Hours
          </p>
          <p className="text-2xl font-light">{totalHours}h {totalMinutes}m</p>
        </div>
        <div className="card p-4">
          <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
            Total Sessions
          </p>
          <p className="text-2xl font-light">{totalSessions}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
            Completed Sessions
          </p>
          <p className="text-2xl font-light">{completedSessions}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
            Days Worked
          </p>
          <p className="text-2xl font-light">{Object.keys(sessionsByDate).length}</p>
        </div>
      </div>

      {/* Daily Sessions */}
      <div className="space-y-6">
        {Object.keys(sessionsByDate).length === 0 ? (
          <div className="card p-12 text-center">
            <p style={{ color: 'var(--tag-body)' }}>No attendance sessions found for this period</p>
          </div>
        ) : (
          Object.entries(sessionsByDate).map(([date, daySessions]) => {
            const dayTotal = calculateDayTotal(daySessions);
            
            return (
              <div key={date} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-light mb-1" style={{ letterSpacing: '-0.22px' }}>
                      {formatDate(date)}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
                      {daySessions.length} session{daySessions.length !== 1 ? 's' : ''} • Total: {dayTotal.hours}h {dayTotal.minutes}m
                    </p>
                  </div>
                  <Calendar className="w-5 h-5" style={{ color: 'var(--tag-orange)' }} />
                </div>

                <div className="space-y-3">
                  {daySessions.map((session, idx) => {
                    const duration = session.check_out ? calculateDuration(session.check_in, session.check_out) : null;
                    
                    return (
                      <div 
                        key={session.id} 
                        className="p-4 rounded border"
                        style={{ 
                          borderColor: 'var(--tag-border)',
                          backgroundColor: 'var(--tag-bg-warm)'
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" style={{ color: 'var(--tag-orange)' }} />
                            <span className="font-medium text-sm">
                              Session {daySessions.length - idx}
                            </span>
                          </div>
                          {!session.check_out && (
                            <span className="badge-warning text-xs">In Progress</span>
                          )}
                          {duration && (
                            <span className="text-sm font-medium" style={{ color: 'var(--tag-orange)' }}>
                              Duration: {duration.hours}h {duration.minutes}m
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
                              Check In
                            </p>
                            <p className="text-sm font-medium">
                              {formatTime(session.check_in)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
                              Check Out
                            </p>
                            <p className="text-sm font-medium">
                              {session.check_out ? formatTime(session.check_out) : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
