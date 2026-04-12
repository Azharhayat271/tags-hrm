"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import { Loader2, Calendar } from "lucide-react";

interface LeaveType {
  id: string;
  name: string;
  days_per_year: number;
}

interface ApplyLeaveFormProps {
  employeeId: string;
  leaveTypes: LeaveType[];
  holidayDates: string[];
}

export default function ApplyLeaveForm({ employeeId, leaveTypes, holidayDates }: ApplyLeaveFormProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const [calculatedDays, setCalculatedDays] = useState(0);

  // Calculate working days
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const days = calculateWorkingDays(
        formData.start_date,
        formData.end_date,
        holidayDates
      );
      setCalculatedDays(days);
    } else {
      setCalculatedDays(0);
    }
  }, [formData.start_date, formData.end_date, holidayDates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (calculatedDays <= 0) {
      setError("Please select valid dates");
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await callApi("/api/leave-requests", {
        method: "POST",
        body: {
          leave_type_id: formData.leave_type_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          days: calculatedDays,
          reason: formData.reason || null,
        },
      });

      if (insertError) throw new Error(insertError);

      router.push("/leave");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to submit leave request");
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (leaveTypes.length === 0) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
            No leave types available. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div
            className="text-sm p-3 rounded"
            style={{
              backgroundColor: "var(--tag-danger-bg)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "var(--tag-danger)",
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="leave_type_id" className="label">
            Leave Type *
          </label>
          <select
            id="leave_type_id"
            name="leave_type_id"
            value={formData.leave_type_id}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="">Select leave type</option>
            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.days_per_year} days/year)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="label">
              Start Date *
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
              className="input"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label htmlFor="end_date" className="label">
              End Date *
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={handleChange}
              className="input"
              min={formData.start_date || new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        </div>

        {calculatedDays > 0 && (
          <div className="p-4 rounded" style={{ backgroundColor: 'rgba(249,115,22,0.08)' }}>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" style={{ color: 'var(--tag-orange)' }} />
              <div>
                <p className="text-sm font-normal">Working Days</p>
                <p className="text-2xl font-light tabular-nums" style={{ color: 'var(--tag-orange)' }}>
                  {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--tag-body)' }}>
                  Excludes weekends and public holidays
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="reason" className="label">
            Reason (Optional)
          </label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            className="input"
            rows={4}
            placeholder="Provide a reason for your leave request..."
          />
        </div>

        <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: "var(--tag-border)" }}>
          <button
            type="submit"
            disabled={loading || calculatedDays <= 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Submitting..." : "Submit Request"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function calculateWorkingDays(startDate: string, endDate: string, holidays: string[]): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) return 0;
  
  let workingDays = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];
    
    // Count if it's a weekday and not a public holiday
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateStr)) {
      workingDays++;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
}
