"use client";

import { Clock } from "lucide-react";

interface Session {
  id: string;
  check_in: string;
  check_out: string | null;
}

interface TodaySummaryProps {
  sessions: Session[];
}

export default function TodaySummary({ sessions }: TodaySummaryProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
          Today's Summary
        </h3>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            No sessions yet
          </p>
        </div>
      </div>
    );
  }

  // Calculate total hours from all completed sessions
  let totalMs = 0;
  let activeSessions = 0;
  let completedSessions = 0;

  sessions.forEach(session => {
    if (session.check_out) {
      const checkIn = new Date(session.check_in);
      const checkOut = new Date(session.check_out);
      totalMs += checkOut.getTime() - checkIn.getTime();
      completedSessions++;
    } else {
      activeSessions++;
    }
  });

  const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
  const totalMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="card p-6">
      <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
        Today's Summary
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 mt-0.5" style={{ color: "var(--accent)" }} />
          <div className="flex-1">
            <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
              Total Hours Worked
            </p>
            <p className="text-3xl font-light tabular-nums">
              {totalHours}h {totalMinutes}m
            </p>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Total Sessions</span>
            <span className="font-medium">{sessions.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Completed</span>
            <span className="font-medium">{completedSessions}</span>
          </div>
          {activeSessions > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Active</span>
              <span className="badge-success">{activeSessions}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
