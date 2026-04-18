"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
  FormError,
  FormSection,
  FormActions,
  useToast,
} from "@/components/ui";

interface AddLifecycleEventFormProps {
  employeeId: string;
  adminId: string;
}

const EVENT_TYPES = [
  { value: "joining", label: "Joining", fields: ["designation", "department"] },
  { value: "probation_completed", label: "Probation completed", fields: [] },
  { value: "promotion", label: "Promotion", fields: ["old_designation", "new_designation"] },
  { value: "salary_increment", label: "Salary increment", fields: ["old_salary", "new_salary", "percentage"] },
  { value: "department_transfer", label: "Department transfer", fields: ["old_department", "new_department"] },
  { value: "role_change", label: "Role change", fields: ["old_role", "new_role"] },
  { value: "performance_review", label: "Performance review", fields: ["rating", "score"] },
  { value: "warning_issued", label: "Warning issued", fields: ["reason", "severity"] },
  { value: "pip_initiated", label: "PIP initiated", fields: ["start_date", "target_date", "reason"] },
  { value: "pip_closed", label: "PIP closed", fields: ["outcome", "notes"] },
  { value: "resignation", label: "Resignation", fields: ["notice_period", "last_working_day"] },
  { value: "exit_interview", label: "Exit interview", fields: ["conducted_by", "feedback"] },
  { value: "full_and_final", label: "Full & final settlement", fields: ["settlement_amount", "clearance_date"] },
];

export default function AddLifecycleEventForm({ employeeId }: AddLifecycleEventFormProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    event_type: "",
    event_date: new Date().toISOString().split("T")[0],
    description: "",
    metadata: {} as Record<string, string>,
  });

  const selectedEventType = EVENT_TYPES.find((et) => et.value === formData.event_type);

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

      toast.success(
        "Lifecycle event recorded",
        selectedEventType ? `${selectedEventType.label} logged.` : undefined,
      );
      router.push(`/admin/employees/${employeeId}/lifecycle`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to add lifecycle event");
      toast.error("Could not record event", err.message);
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMetadataChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      metadata: { ...formData.metadata, [key]: value },
    });
  };

  const humanizeField = (field: string) =>
    field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="rounded-md border border-line-subtle bg-surface-raised shadow-e1 overflow-hidden">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="px-6 pt-5">
            <FormError>{error}</FormError>
          </div>
        )}

        <div className="px-6 divide-y divide-line-subtle">
          <FormSection
            eyebrow="Event"
            title="What happened?"
            description="Pick the event type first — the form will expand with the relevant context fields."
          >
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
              <Field label="Event type" required>
                {({ id, invalid }) => (
                  <Select
                    id={id}
                    name="event_type"
                    value={formData.event_type}
                    onChange={handleChange}
                    required
                    invalid={invalid}
                  >
                    <option value="">Select an event type…</option>
                    {EVENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Event date" required>
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    name="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={handleChange}
                    required
                    invalid={invalid}
                    className="font-mono tabular-nums"
                  />
                )}
              </Field>
            </div>
            <Field label="Description" optional>
              {({ id }) => (
                <Textarea
                  id={id}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any additional context, decisions, or links…"
                />
              )}
            </Field>
          </FormSection>

          {selectedEventType && selectedEventType.fields.length > 0 && (
            <FormSection
              eyebrow="Details"
              title="Context fields"
              description={`Extra data captured for "${selectedEventType.label}" events. All fields are optional.`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedEventType.fields.map((field) => (
                  <Field key={field} label={humanizeField(field)} optional>
                    {({ id }) => (
                      <Input
                        id={id}
                        type="text"
                        value={formData.metadata[field] || ""}
                        onChange={(e) => handleMetadataChange(field, e.target.value)}
                        placeholder={humanizeField(field)}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </FormSection>
          )}
        </div>

        <FormActions align="split" className="px-6 py-4 bg-surface-muted mt-0 border-t-0">
          <span className="text-[11px] text-ink-tertiary font-mono tabular-nums">
            Events are immutable — add a new one to correct or supersede.
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {loading ? "Adding…" : "Record event"}
            </Button>
          </div>
        </FormActions>
      </form>
    </div>
  );
}
