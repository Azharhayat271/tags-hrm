"use client";

import { Check, X, Minus, Calendar as CalendarIcon } from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
}

interface MonthlyCalendarProps {
  attendanceRecords: AttendanceRecord[];
}

export default function MonthlyCalendar({ attendanceRecords }: MonthlyCalendarProps) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Get first day of month and total days
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Create attendance map for quick lookup
  const attendanceMap = new Map(
    attendanceRecords.map(record => [record.date, record])
  );

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getAttendanceStatus = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    const record = attendanceMap.get(dateStr);
    
    // Future dates
    if (date > today) {
      return { status: 'future', record: null };
    }
    
    // Weekend
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { status: 'weekend', record: null };
    }
    
    // Has attendance record
    if (record) {
      if (record.check_in && record.check_out) {
        return { status: 'present', record };
      } else if (record.check_in) {
        return { status: 'incomplete', record };
      }
    }
    
    // Absent (past date, weekday, no record)
    return { status: 'absent', record: null };
  };

  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculate stats
  const workingDays = calendarDays.filter(day => {
    if (!day) return false;
    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = date.getDay();
    return date <= today && dayOfWeek !== 0 && dayOfWeek !== 6;
  }).length;

  const presentDays = attendanceRecords.filter(record => 
    record.check_in && record.check_out
  ).length;

  const attendancePercentage = workingDays > 0 
    ? Math.round((presentDays / workingDays) * 100) 
    : 0;

  return (
    <div>
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5" style={{ color: 'var(--tag-orange)' }} />
          <h4 className="text-lg font-light">{monthName}</h4>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--tag-label)' }}>Working Days</p>
            <p className="text-lg font-light tabular-nums">{workingDays}</p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--tag-label)' }}>Present</p>
            <p className="text-lg font-light tabular-nums">{presentDays}</p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--tag-label)' }}>Attendance</p>
            <p className="text-lg font-light tabular-nums">{attendancePercentage}%</p>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-xs font-normal py-2"
            style={{ color: 'var(--tag-label)' }}
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} />;
          }

          const { status, record } = getAttendanceStatus(day);
          const isToday = day === today.getDate() && 
                         currentMonth === today.getMonth() && 
                         currentYear === today.getFullYear();

          return (
            <div
              key={day}
              className={`
                relative aspect-square rounded flex flex-col items-center justify-center
                ${isToday ? 'ring-2' : ''}
              `}
              style={{
                backgroundColor: 
                  status === 'present' ? 'rgba(22,163,74,0.1)' :
                  status === 'absent' ? 'rgba(239,68,68,0.1)' :
                  status === 'incomplete' ? 'rgba(217,119,6,0.1)' :
                  status === 'weekend' ? 'var(--tag-bg-warm)' :
                  'transparent',
                borderColor: isToday ? 'var(--tag-orange)' : 'transparent',
              }}
            >
              <span 
                className="text-sm font-light tabular-nums"
                style={{ 
                  color: status === 'future' ? 'var(--tag-body)' : 'var(--tag-heading)'
                }}
              >
                {day}
              </span>
              
              {status === 'present' && (
                <Check className="w-3 h-3 mt-1" style={{ color: 'var(--tag-success)' }} />
              )}
              {status === 'absent' && (
                <X className="w-3 h-3 mt-1" style={{ color: 'var(--tag-danger)' }} />
              )}
              {status === 'incomplete' && (
                <Minus className="w-3 h-3 mt-1" style={{ color: 'var(--tag-warning)' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 pt-6 border-t" style={{ borderColor: 'var(--tag-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(22,163,74,0.1)' }} />
          <span className="text-xs" style={{ color: 'var(--tag-body)' }}>Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }} />
          <span className="text-xs" style={{ color: 'var(--tag-body)' }}>Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(217,119,6,0.1)' }} />
          <span className="text-xs" style={{ color: 'var(--tag-body)' }}>Incomplete</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--tag-bg-warm)' }} />
          <span className="text-xs" style={{ color: 'var(--tag-body)' }}>Weekend</span>
        </div>
      </div>
    </div>
  );
}
