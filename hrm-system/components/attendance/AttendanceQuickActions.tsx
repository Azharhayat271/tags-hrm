"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import { Clock, LogIn, LogOut, Loader2 } from "lucide-react";

export default function AttendanceQuickActions() {
  const router = useRouter();
  const { callApi } = useApiCall();
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [fetchingStatus, setFetchingStatus] = useState(true);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const { data } = await callApi("/api/attendance/today", {
        method: "GET",
      });
      setTodayAttendance(data);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setFetchingStatus(false);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const { error } = await callApi("/api/attendance/check-in", {
        method: "POST",
        body: {},
      });

      if (error) throw new Error(error);

      await fetchTodayAttendance();
      router.refresh();
    } catch (error: any) {
      alert(`Check-in failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance?.id) return;

    setLoading(true);
    try {
      const { error } = await callApi(
        `/api/attendance/${todayAttendance.id}/check-out`,
        {
          method: "PATCH",
          body: {},
        }
      );

      if (error) throw new Error(error);

      await fetchTodayAttendance();
      router.refresh();
    } catch (error: any) {
      alert(`Check-out failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingStatus) {
    return (
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
        </div>
      </div>
    );
  }

  const hasCheckedIn = todayAttendance?.check_in;
  const hasCheckedOut = todayAttendance?.check_out;

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-light mb-1" style={{ letterSpacing: "-0.22px" }}>
            Quick Attendance (Backup)
          </h3>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Use this if Slack commands are not working
          </p>
        </div>
        <Clock className="w-6 h-6" style={{ color: "var(--accent)" }} />
      </div>

      <div className="flex items-center gap-4">
        {!hasCheckedIn ? (
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Check In
              </>
            )}
          </button>
        ) : !hasCheckedOut ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <span className="badge badge-success">Checked In</span>
              <span style={{ color: "var(--text-tertiary)" }}>
                at {new Date(todayAttendance.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Check Out
                </>
              )}
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="badge badge-success">Checked In</span>
              <span style={{ color: "var(--text-tertiary)" }}>
                {new Date(todayAttendance.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-success">Checked Out</span>
              <span style={{ color: "var(--text-tertiary)" }}>
                {new Date(todayAttendance.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
