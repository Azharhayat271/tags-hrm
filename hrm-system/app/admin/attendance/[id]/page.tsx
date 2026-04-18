import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface AttendanceSession {
  id: string;
  check_in: string;
  check_out: string | null;
  auto_closed_at: string | null;
  auto_close_reason: string | null;
}

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

  const employeeProfile = Array.isArray(employee.profiles)
    ? employee.profiles[0]
    : employee.profiles;

  // Fetch all sessions for the period
  const { data: sessionsData } = await supabase
    .from("attendance_sessions")
    .select("id, check_in, check_out, auto_closed_at, auto_close_reason")
    .eq("employee_id", resolvedParams.id)
    .gte("check_in", startDate.toISOString())
    .lte("check_in", endDate.toISOString())
    .order("check_in", { ascending: false });

  const sessions: AttendanceSession[] = (sessionsData ?? []) as AttendanceSession[];

  // Group sessions by date
  const sessionsByDate = sessions.reduce((acc, session) => {
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

  const calculateDayTotal = (daySessions: AttendanceSession[]) => {
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
  const totalSessions = sessions.length;
  let completedSessions = 0;
  let autoClosedCount = 0;

  sessions.forEach(session => {
    if (session.auto_closed_at) {
      autoClosedCount += 1;
    }
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

  // Generate calendar structure for monthly view
  const calendarStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const calendarEndDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  
  const calendarDayKeys: string[] = [];
  const dayCursor = new Date(calendarStartDate);
  dayCursor.setHours(0, 0, 0, 0);
  const lastDay = new Date(calendarEndDate);
  lastDay.setHours(0, 0, 0, 0);

  while (dayCursor <= lastDay) {
    calendarDayKeys.push(dayCursor.toISOString().split("T")[0]);
    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  // Build calendar data: hours per day and presence
  const calendarData: Record<string, { hours: number; status: 'present' | 'absent' }> = {};
  calendarDayKeys.forEach(dayKey => {
    calendarData[dayKey] = { hours: 0, status: 'absent' };
  });

  sessions.forEach(session => {
    if (session.check_out) {
      const dayKey = new Date(session.check_in).toISOString().split("T")[0];
      const start = new Date(session.check_in);
      const end = new Date(session.check_out);
      const durationMs = Math.max(0, end.getTime() - start.getTime());
      const durationHours = durationMs / (1000 * 60 * 60);
      
      if (calendarData[dayKey]) {
        calendarData[dayKey].hours += durationHours;
        calendarData[dayKey].status = 'present';
      }
    }
  });

  const getDateCellStyle = (dayData: { hours: number; status: 'present' | 'absent' }) => {
    if (dayData.status === 'absent') {
      return {
        backgroundColor: 'rgba(239,68,68,0.09)',
        color: 'var(--tag-danger)',
      };
    }
    if (dayData.hours >= 8) {
      return {
        backgroundColor: 'rgba(22,163,74,0.13)',
        color: 'var(--tag-success)',
      };
    }
    return {
      backgroundColor: 'rgba(217,119,6,0.14)',
      color: 'var(--tag-warning)',
    };
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOfWeek = calendarStartDate.getDay();
  const calendarGrid: (string | null)[][] = [];
  let currentWeek: (string | null)[] = Array(firstDayOfWeek).fill(null);

  for (const dayKey of calendarDayKeys) {
    currentWeek.push(dayKey);
    if (currentWeek.length === 7) {
      calendarGrid.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    calendarGrid.push(currentWeek);
  }

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
              {employeeProfile?.full_name}
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
              {employeeProfile?.email}
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
            Auto-Closed
          </p>
          <p className="text-2xl font-light">{autoClosedCount}</p>
        </div>
      </div>

      {/* Monthly Attendance Calendar */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
          Monthly Calendar - {calendarStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>

        {/* Legend */}
        <div className="mb-4 flex items-center gap-4 text-xs" style={{ color: 'var(--tag-body)' }}>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(22,163,74,0.13)' }} />
            Full day (8h+)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(217,119,6,0.14)' }} />
            Partial (&lt;8h)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.09)' }} />
            Absent (0h)
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto" style={{ border: '1px solid var(--tag-border)', borderRadius: '0.75rem' }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--tag-paper)' }}>
                {weekDays.map(day => (
                  <th key={day} className="px-2 py-3 text-center text-sm font-medium" style={{ color: 'var(--tag-label)' }}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendarGrid.map((week, weekIdx) => (
                <tr key={weekIdx}>
                  {week.map((dayKey, dayIdx) => {
                    if (!dayKey) {
                      return (
                        <td key={`empty-${dayIdx}`} className="px-2 py-4 bg-gray-50" />
                      );
                    }

                    const dayData = calendarData[dayKey];
                    const date = new Date(dayKey);
                    const cellStyle = getDateCellStyle(dayData);

                    return (
                      <td
                        key={dayKey}
                        className="px-2 py-4 text-center border"
                        style={{
                          borderColor: 'var(--tag-border)',
                          ...cellStyle,
                          minHeight: '100px',
                          verticalAlign: 'top'
                        }}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-medium">{date.getDate()}</div>
                          <div className="text-xs" style={{ color: dayData.status === 'absent' ? 'var(--tag-danger)' : 'var(--tag-success)' }}>
                            {dayData.status === 'absent' ? '✕ Absent' : '✓ Present'}
                          </div>
                          <div className="text-sm font-medium">
                            {dayData.hours.toFixed(1)}h
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
                          {session.auto_closed_at && (
                            <span className="badge-warning text-xs" title={`Auto-closed: ${session.auto_close_reason}`}>
                              ⚙️ Auto-Closed
                            </span>
                          )}
                          {!session.check_out && !session.auto_closed_at && (
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
