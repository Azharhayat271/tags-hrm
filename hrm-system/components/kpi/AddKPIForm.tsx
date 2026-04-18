"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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

interface AddKPIFormProps {
  employeeId: string;
}

export default function AddKPIForm({ employeeId }: AddKPIFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
  const defaultCycle = `Q${currentQuarter} ${currentYear}`;

  const [formData, setFormData] = useState({
    cycle: defaultCycle,
    title: "",
    description: "",
    target: "",
    unit: "",
    weight: "1",
    progress: "0",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("kpis").insert({
        employee_id: employeeId,
        cycle: formData.cycle,
        title: formData.title,
        description: formData.description || null,
        target: formData.target ? parseFloat(formData.target) : null,
        unit: formData.unit || null,
        weight: parseFloat(formData.weight),
        progress: parseFloat(formData.progress),
      });

      if (insertError) throw insertError;

      toast.success("KPI added", `"${formData.title}" targeted for ${formData.cycle}.`);
      router.push(`/admin/employees/${employeeId}/kpi`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to add KPI");
      toast.error("Could not add KPI", err.message);
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const cycles: string[] = [];
  for (let i = 0; i < 4; i++) {
    const year = currentYear + Math.floor(i / 4);
    const quarter = ((currentQuarter - 1 + i) % 4) + 1;
    cycles.push(`Q${quarter} ${year}`);
  }

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
            eyebrow="Period"
            title="Review cycle"
            description="Which quarter does this KPI belong to?"
          >
            <Field label="Review cycle" required>
              {({ id, invalid }) => (
                <Select
                  id={id}
                  name="cycle"
                  value={formData.cycle}
                  onChange={handleChange}
                  required
                  invalid={invalid}
                >
                  {cycles.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </FormSection>

          <FormSection
            eyebrow="Definition"
            title="What's the goal?"
            description="Keep the title short and outcome-focused. Use the description to clarify scope."
          >
            <Field label="KPI title" required>
              {({ id, invalid }) => (
                <Input
                  id={id}
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  invalid={invalid}
                  placeholder="e.g. Complete 10 client projects"
                />
              )}
            </Field>
            <Field label="Description" optional>
              {({ id }) => (
                <Textarea
                  id={id}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Why this matters, what counts as complete, any constraints…"
                />
              )}
            </Field>
          </FormSection>

          <FormSection
            eyebrow="Measurement"
            title="How will it be scored?"
            description="Target + unit define what 100% looks like. Weight controls how much this KPI counts in the overall review."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Target value" optional>
                {({ id }) => (
                  <Input
                    id={id}
                    name="target"
                    type="number"
                    step="0.01"
                    value={formData.target}
                    onChange={handleChange}
                    placeholder="100"
                    className="font-mono tabular-nums"
                  />
                )}
              </Field>
              <Field label="Unit" optional>
                {({ id }) => (
                  <Input
                    id={id}
                    name="unit"
                    type="text"
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="projects, %, $"
                  />
                )}
              </Field>
              <Field
                label="Weight"
                required
                hint="1 = normal, 2 = double weight in the review total."
              >
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    name="weight"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.weight}
                    onChange={handleChange}
                    required
                    invalid={invalid}
                    className="font-mono tabular-nums"
                  />
                )}
              </Field>
              <Field label="Initial progress (%)" optional>
                {({ id }) => (
                  <Input
                    id={id}
                    name="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={handleChange}
                    className="font-mono tabular-nums"
                  />
                )}
              </Field>
            </div>
          </FormSection>
        </div>

        <FormActions align="split" className="px-6 py-4 bg-surface-muted mt-0 border-t-0">
          <span className="text-[11px] text-ink-tertiary font-mono tabular-nums">
            Progress can be updated throughout the cycle before the final review.
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
              {loading ? "Adding…" : "Add KPI"}
            </Button>
          </div>
        </FormActions>
      </form>
    </div>
  );
}
