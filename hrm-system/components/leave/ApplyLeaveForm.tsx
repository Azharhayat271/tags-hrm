"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import { Calendar, CalendarRange } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
  FormError,
  FormSection,
  FormActions,
  EmptyState,
} from "@/components/ui";

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

export default function ApplyLeaveForm({ leaveTypes, holidayDates }: ApplyLeaveFormProps) {
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

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      setCalculatedDays(calculateWorkingDays(formData.start_date, formData.end_date, holidayDates));
    } else {
      setCalculatedDays(0);
    }
  }, [formData.start_date, formData.end_date, holidayDates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (calculatedDays <= 0) {
      setError("Please select valid dates — at least one working day is required.");
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (leaveTypes.length === 0) {
    return (
      <EmptyState
        icon={<CalendarRange className="w-5 h-5" />}
        title="No leave types configured"
        description="An administrator needs to set up at least one leave type before you can apply. Please contact HR."
      />
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const selectedType = leaveTypes.find((t) => t.id === formData.leave_type_id);

  return (
    <div className="rounded-md border border-line-subtle bg-surface-raised shadow-e1 overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="px-6 pt-1 pb-0 divide-y divide-line-subtle">
          {error && (
            <div className="py-5">
              <FormError>{error}</FormError>
            </div>
          )}

          <FormSection
            eyebrow="Category"
            title="Type of leave"
            description="Pick the category that matches your request. Balances are shown on the right."
          >
            <Field label="Leave type" required>
              {({ id, invalid }) => (
                <Select
                  id={id}
                  name="leave_type_id"
                  value={formData.leave_type_id}
                  onChange={handleChange}
                  required
                  invalid={invalid}
                >
                  <option value="">Select a leave type…</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} — {type.days_per_year} days/year
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {selectedType && (
              <p className="text-[11px] text-ink-tertiary font-mono tabular-nums">
                Annual allowance: <span className="text-ink-secondary">{selectedType.days_per_year} days</span>
              </p>
            )}
          </FormSection>

          <FormSection
            eyebrow="Dates"
            title="Range of absence"
            description="Select your first and last day. Weekends and public holidays are excluded automatically."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Start date" required>
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleChange}
                    min={today}
                    required
                    invalid={invalid}
                    className="font-mono tabular-nums"
                  />
                )}
              </Field>
              <Field label="End date" required>
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                    min={formData.start_date || today}
                    required
                    invalid={invalid}
                    className="font-mono tabular-nums"
                  />
                )}
              </Field>
            </div>

            {/* Calculated days stat */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-sm bg-surface-sunken border border-line-subtle">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-sm bg-surface-raised border border-line-subtle">
                  <Calendar className="w-4 h-4 text-ink-tertiary" strokeWidth={1.75} />
                </span>
                <div>
                  <span className="eyebrow block">Working days</span>
                  <span className="text-[11px] text-ink-tertiary">Excludes weekends & holidays</span>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-mono tabular-nums text-[1.75rem] leading-none font-light tracking-[-0.02em] ${
                    calculatedDays > 0 ? "text-ink-accent" : "text-ink-quaternary"
                  }`}
                >
                  {calculatedDays}
                  <span className="text-[11px] text-ink-tertiary font-normal ml-1">
                    {calculatedDays === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            eyebrow="Context"
            title="Reason"
            description="Share a short note for your manager. Helpful context speeds up approval, but it's optional."
          >
            <Field label="Reason" optional>
              {({ id }) => (
                <Textarea
                  id={id}
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={4}
                  placeholder="E.g. Family event, personal time, medical appointment…"
                />
              )}
            </Field>
          </FormSection>
        </div>

        <FormActions
          align="split"
          className="px-6 py-4 bg-surface-muted border-t-0 mt-0"
        >
          <span className="text-[11px] text-ink-tertiary font-mono tabular-nums">
            Request will be sent to your approver.
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={calculatedDays <= 0}
              loading={loading}
            >
              {loading ? "Submitting…" : "Submit request"}
            </Button>
          </div>
        </FormActions>
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
    const dateStr = current.toISOString().split("T")[0];
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateStr)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  return workingDays;
}
