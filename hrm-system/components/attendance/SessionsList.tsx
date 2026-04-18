"use client";

import { Clock, CheckCircle } from "lucide-react";

interface Session {
  id: string;
  check_in: string;
  check_out: string | null;
  is_manual_entry?: boolean;
  manual_added_at?: string;
}

interface SessionsListProps {
  sessions: Session[];
}

export default function SessionsList({ sessions }: SessionsListProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          No sessions today
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session, index) => {
        const checkIn = new Date(session.check_in);
        const checkOut = session.check_out ? new Date(session.check_out) : null;
        
        let duration = null;
        if (checkOut) {
          const durationMs = checkOut.getTime() - checkIn.getTime();
          const hours = Math.floor(durationMs / (1000 * 60 * 60));
          const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
          duration = `${hours}h ${minutes}m`;
        }

        return (
          <div
            key={session.id}
            className="p-4 rounded border"
            style={{ borderColor: 'var(--tag-border)', backgroundColor: checkOut ? 'var(--tag-bg)' : 'var(--tag-success-bg)' }}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {session.is_manual_entry ? 'Manual Entry' : 'Session'} {!session.is_manual_entry && sessions.length - index}
              </span>
              <div className="flex gap-2 items-center">
                {session.is_manual_entry && (
                  <span className="badge text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--tag-warning)', color: 'white' }}>
                    Manual
                  </span>
                )}
                {checkOut ? (
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--tag-success)' }} />
                ) : (
                  <span className="badge-success text-xs">Active</span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Check In</p>
                <p className="tabular-nums">
                  {checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Check Out</p>
                <p className="tabular-nums">
                  {checkOut ? checkOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
              </div>
            </div>
            
            {duration && (
              <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Duration: <span className="font-medium">{duration}</span>
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
