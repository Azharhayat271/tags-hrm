"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import { Coffee, Play, Square, Loader2 } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface BreakTrackerProps {
  attendance: any;
  employeeId: string;
}

export default function BreakTracker({ attendance, employeeId }: BreakTrackerProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { callApi } = useApiCall();

  const isCheckedIn = attendance?.check_in && !attendance?.check_out;
  const breaks = attendance?.breaks || [];
  const activeBreak = breaks.find((brk: any) => brk.break_start && !brk.break_end);

  const handleStartBreak = async () => {
    if (!attendance?.id) return;
    
    setLoading(true);
    try {
      const { error } = await callApi(`/api/attendance/${attendance.id}/breaks`, {
        method: "POST",
      });

      if (error) throw new Error(error);

      router.refresh();
    } catch (error) {
      console.error("Failed to start break:", error);
      alert("Failed to start break. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!activeBreak) return;

    setLoading(true);
    try {
      const { error } = await callApi(`/api/attendance/breaks/${activeBreak.id}`, {
        method: "PATCH",
      });

      if (error) throw new Error(error);

      router.refresh();
    } catch (error) {
      console.error("Failed to end break:", error);
      alert("Failed to end break. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
        Break Tracker
      </h3>

      {!isCheckedIn ? (
        <div className="text-center py-8">
          <Coffee className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
            Check in first to track breaks
          </p>
        </div>
      ) : (
        <>
          {activeBreak ? (
            <div className="mb-4">
              <div className="p-4 rounded mb-3" style={{ backgroundColor: 'rgba(217,119,6,0.08)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Coffee className="w-4 h-4" style={{ color: 'var(--tag-warning)' }} />
                  <span className="text-sm font-normal">Break Started</span>
                </div>
                <p className="text-lg font-light tabular-nums">
                  {formatTime(activeBreak.break_start)}
                </p>
              </div>
              <button
                onClick={handleEndBreak}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded font-normal text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--tag-warning)' }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    End Break
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartBreak}
              disabled={loading}
              className="btn-ghost w-full flex items-center justify-center gap-2 py-2 mb-4 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Break
                </>
              )}
            </button>
          )}

          {/* Break History */}
          {breaks.length > 0 && (
            <div className="pt-4 border-t" style={{ borderColor: 'var(--tag-border)' }}>
              <p className="text-xs mb-3" style={{ color: 'var(--tag-label)' }}>
                Today's Breaks
              </p>
              <div className="space-y-2">
                {breaks.map((brk: any) => (
                  <div
                    key={brk.id}
                    className="flex items-center justify-between text-sm p-2 rounded"
                    style={{ backgroundColor: 'var(--tag-bg-warm)' }}
                  >
                    <span className="tabular-nums" style={{ color: 'var(--tag-body)' }}>
                      {formatTime(brk.break_start)}
                    </span>
                    <span style={{ color: 'var(--tag-body)' }}>→</span>
                    <span className="tabular-nums" style={{ color: 'var(--tag-body)' }}>
                      {brk.break_end ? formatTime(brk.break_end) : "Active"}
                    </span>
                    {brk.break_end && (
                      <span className="text-xs tabular-nums" style={{ color: 'var(--tag-label)' }}>
                        {calculateBreakDuration(brk.break_start, brk.break_end)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function calculateBreakDuration(start: string, end: string): string {
  const startTime = new Date(start);
  const endTime = new Date(end);
  const diff = endTime.getTime() - startTime.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
