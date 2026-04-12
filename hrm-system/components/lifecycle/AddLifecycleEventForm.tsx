"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import { Loader2 } from "lucide-react";

interface AddLifecycleEventFormProps {
  employeeId: string;
  adminId: string;
}

const EVENT_TYPES = [
  { value: "joining", label: "Joining", fields: ["designation", "department"] },
  { value: "probation_completed", label: "Probation Completed", fields: [] },
  { value: "promotion", label: "Promotion", fields: ["old_designation", "new_designation"] },
  { value: "salary_increment", label: "Salary Increment", fields: ["old_salary", "new_salary", "percentage"] },
  { value: "department_transfer", label: "Department Transfer", fields: ["old_department", "new_department"] },
  { value: "role_change", label: "Role Change", fields: ["old_role", "new_role"] },
  { value: "performance_review", label: "Performance Review", fields: ["rating", "score"] },
  { value: "warning_issued", label: "Warning Issued", fields: ["reason", "severity"] },
  { value: "pip_initiated", label: "PIP Initiated", fields: ["start_date", "target_date", "reason"] },
  { value: "pip_closed", label: "PIP Closed", fields: ["outcome", "notes"] },
  { value: "resignation", label: "Resignation", fields: ["notice_period", "last_working_day"] },
  { value: "exit_interview", label: "Exit Interview", fields: ["conducted_by", "feedback"] },
  { value: "full_and_final", label: "Full & Final Settlement", fields: ["settlement_amount", "clearance_date"] },
];

export default function AddLifecycleEventForm({ employeeId, adminId }: AddLifecycleEventFormProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    event_type: "",
    event_date: new Date().toISOString().split('T')[0],
    description: "",
    metadata: {} as Record<string, string>,
  });

  const selectedEventType = EVENT_TYPES.find(et => et.value === formData.event_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await callApi(`/api/employees/${employeeId}/lifecycle-events`, {
        method: "POST",
        body: {
          event_type: formData.event_type,
          event_date: formData.event_date,
          description: formData.description || null,
          metadata: Object.keys(formData.metadata).length > 0 ? formData.metadata : null,
        },
      });

      if (insertError) throw new Error(insertError);

      router.push(`/admin/employees/${employeeId}/lifecycle`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to add lifecycle event");
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

  const handleMetadataChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        [key]: value,
      },
    });
  };

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
          <label htmlFor="event_type" className="label">
            Event Type *
          </label>
          <select
            id="event_type"
            name="event_type"
            value={formData.event_type}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="">Select event type</option>
            {EVENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="event_date" className="label">
            Event Date *
          </label>
          <input
            id="event_date"
            name="event_date"
            type="date"
            value={formData.event_date}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input"
            rows={3}
            placeholder="Add any additional details..."
          />
        </div>

        {/* Dynamic metadata fields */}
        {selectedEventType && selectedEventType.fields.length > 0 && (
          <div>
            <h4 className="text-sm font-normal mb-3" style={{ color: 'var(--tag-label)' }}>
              Additional Information
            </h4>
            <div className="space-y-3">
              {selectedEventType.fields.map((field) => (
                <div key={field}>
                  <label htmlFor={field} className="label">
                    {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </label>
                  <input
                    id={field}
                    type="text"
                    value={formData.metadata[field] || ""}
                    onChange={(e) => handleMetadataChange(field, e.target.value)}
                    className="input"
                    placeholder={`Enter ${field.replace(/_/g, " ")}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: "var(--tag-border)" }}>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Adding..." : "Add Event"}
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
