"use client";

import { useState } from "react";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useApiCall } from "@/lib/hooks/client";

interface ManualHoursFormProps {
  onSubmit?: (data: any) => void;
  isLoading?: boolean;
}

export default function ManualHoursForm({ onSubmit, isLoading = false }: ManualHoursFormProps) {
  const { callApi } = useApiCall();
  const [date, setDate] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get today's date and first day of current month
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() - 1); // Yesterday is the max

  // Format date for min/max attributes
  const minDateStr = firstDayOfMonth.toISOString().split("T")[0];
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate inputs
    if (!date || !checkInTime || !checkOutTime) {
      setError("Please fill in all fields");
      return;
    }

    // Validate time format
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(checkInTime) || !timeRegex.test(checkOutTime)) {
      setError("Invalid time format. Use HH:MM (24-hour format)");
      return;
    }

    // Validate check-in < check-out
    if (checkInTime >= checkOutTime) {
      setError("Check-in time must be before check-out time");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await callApi("/api/attendance/sessions/manual-entry", {
        method: "POST",
        body: {
          date,
          checkInTime,
          checkOutTime,
        },
      });

      if (error) {
        setError(error);
        return;
      }

      setSuccess(true);
      setDate("");
      setCheckInTime("");
      setCheckOutTime("");

      // Call parent callback if provided
      if (onSubmit) {
        onSubmit(data);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error submitting manual hours:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border" style={{ borderColor: "var(--tag-border)", backgroundColor: "var(--tag-bg)" }}>
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--tag-body)" }}>
        <Clock className="w-4 h-4" />
        Add Manual Hours
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 rounded bg-green-50 border border-green-200 flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600">Manual hours added successfully!</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: "var(--tag-label)" }}>
            Date (Current Month Only)
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={minDateStr}
            max={maxDateStr}
            disabled={loading || isLoading}
            className="w-full px-3 py-2 rounded border"
            style={{
              borderColor: "var(--tag-border)",
              backgroundColor: "var(--tag-bg)",
              color: "var(--tag-body)",
            }}
          />
          <p className="text-xs" style={{ color: "var(--tag-label)" }}>
            Select a past date from the current month
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: "var(--tag-label)" }}>
              Check In Time
            </label>
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              disabled={loading || isLoading}
              className="w-full px-3 py-2 rounded border"
              style={{
                borderColor: "var(--tag-border)",
                backgroundColor: "var(--tag-bg)",
                color: "var(--tag-body)",
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: "var(--tag-label)" }}>
              Check Out Time
            </label>
            <input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              disabled={loading || isLoading}
              className="w-full px-3 py-2 rounded border"
              style={{
                borderColor: "var(--tag-border)",
                backgroundColor: "var(--tag-bg)",
                color: "var(--tag-body)",
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || isLoading}
          className="w-full px-4 py-2 rounded font-medium text-sm transition-opacity disabled:opacity-50"
          style={{
            backgroundColor: "var(--tag-success)",
            color: "white",
          }}
        >
          {loading || isLoading ? "Adding..." : "Add Manual Hours"}
        </button>
      </form>
    </div>
  );
}
