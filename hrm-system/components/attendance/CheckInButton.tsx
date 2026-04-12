"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import { LogIn, LogOut, Loader2 } from "lucide-react";

interface CheckInButtonProps {
  employeeId: string;
  activeSession: any;
}

export default function CheckInButton({ employeeId, activeSession }: CheckInButtonProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const { error } = await callApi("/api/attendance/sessions/check-in", {
        method: "POST",
      });

      if (error) throw new Error(error);

      router.refresh();
    } catch (error: any) {
      alert(`Check-in failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const { error } = await callApi("/api/attendance/sessions/check-out", {
        method: "POST",
      });

      if (error) throw new Error(error);

      router.refresh();
    } catch (error: any) {
      alert(`Check-out failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (activeSession) {
    const checkInTime = new Date(activeSession.check_in).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div className="space-y-4">
        <div className="p-4 rounded" style={{ backgroundColor: 'var(--tag-success-bg)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <p className="text-sm mb-1" style={{ color: 'var(--tag-success)' }}>
            ✓ Active Session
          </p>
          <p className="text-xs" style={{ color: 'var(--tag-body)' }}>
            Checked in at {checkInTime}
          </p>
        </div>
        <button
          onClick={handleCheckOut}
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      </div>
    );
  }

  return (
    <button
      onClick={handleCheckIn}
      disabled={loading}
      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
  );
}
