"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Target } from "lucide-react";
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
  useToast,
  cn,
} from "@/components/ui";

interface KPI {
  id: string;
  title: string;
  target: number | null;
  unit: string | null;
  weight: number;
  progress: number;
}

interface ConductReviewFormProps {
  employeeId: string;
  adminId: string;
  kpis: KPI[];
  defaultCycle: string;
}

export default function ConductReviewForm({
  employeeId,
  adminId,
  kpis,
  defaultCycle,
}: ConductReviewFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cycle: defaultCycle,
    overall_rating: "",
    manager_notes: "",
  });

  const totalWeight = kpis.reduce((sum, kpi) => sum + (kpi.weight || 1), 0);
  const weightedProgress = kpis.reduce((sum, kpi) => {
    const weight = kpi.weight || 1;
    const progress = kpi.progress || 0;
    return sum + progress * weight;
  }, 0);
  const overallScore = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

  const scoreTone =
    overallScore >= 85 ? "success" :
    overallScore >= 60 ? "default" :
    "warning";

  const scoreToneText: Record<typeof scoreTone, string> = {
    success: "text-[var(--success-text)]",
    default: "text-ink-primary",
    warning: "text-[var(--warning-text)]",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("performance_reviews").insert({
        employee_id: employeeId,
        cycle: formData.cycle,
        overall_rating: formData.overall_rating,
        overall_score: overallScore,
        manager_notes: formData.manager_notes || null,
        reviewed_by: adminId,
      });

      if (insertError) throw insertError;

      toast.success(
        "Review submitted",
        `Overall score: ${overallScore}% · ${formData.overall_rating}.`,
      );
      router.push(`/admin/employees/${employeeId}/kpi`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
      toast.error("Could not submit review", err.message);
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const ratingOptions = [
    "Exceeds Expectations",
    "Meets Expectations",
    "Needs Improvement",
    "Unsatisfactory",
  ];

  return (
    <div className="space-y-4">
      {/* KPI Summary — ledger panel */}
      <div className="rounded-md border border-line-subtle bg-surface-raised shadow-e1 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-line-subtle flex items-center justify-between">
          <div>
            <span className="eyebrow">KPI summary</span>
            <h3 className="text-[15px] font-normal text-ink-primary mt-0.5">This cycle</h3>
          </div>
          <span className="text-[11px] text-ink-quaternary font-mono tabular-nums">
            {kpis.length} {kpis.length === 1 ? "KPI" : "KPIs"}
          </span>
        </div>

        {kpis.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Target className="w-5 h-5" />}
              title="No KPIs for this cycle"
              description="Add KPIs before conducting a performance review so the weighted score can be calculated."
              compact
            />
          </div>
        ) : (
          <>
            <ul className="divide-y divide-line-subtle">
              {kpis.map((kpi) => {
                const pctTone =
                  kpi.progress >= 85 ? "text-[var(--success-text)]" :
                  kpi.progress >= 60 ? "text-ink-secondary" :
                  "text-[var(--warning-text)]";
                const barTone =
                  kpi.progress >= 85 ? "bg-[var(--success)]" :
                  kpi.progress >= 60 ? "bg-stone-500" :
                  "bg-[var(--warning)]";

                return (
                  <li key={kpi.id} className="px-5 py-3.5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="text-[13px] text-ink-primary truncate">{kpi.title}</span>
                        <span className={cn("font-mono tabular-nums text-[14px]", pctTone)}>
                          {kpi.progress}%
                        </span>
                      </div>
                      <div className="h-1 rounded-pill bg-surface-sunken overflow-hidden mb-1.5">
                        <div
                          className={cn("h-full rounded-pill transition-all", barTone)}
                          style={{ width: `${Math.max(kpi.progress, 2)}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap text-[11px] font-mono tabular-nums text-ink-tertiary">
                        <span>
                          <span className="text-ink-quaternary">Weight</span>{" "}
                          <span className="text-ink-secondary">{kpi.weight}×</span>
                        </span>
                        {kpi.target != null && (
                          <>
                            <span className="text-ink-quaternary">·</span>
                            <span>
                              <span className="text-ink-quaternary">Target</span>{" "}
                              <span className="text-ink-secondary">
                                {kpi.target}
                                {kpi.unit ? ` ${kpi.unit}` : ""}
                              </span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="px-5 py-4 border-t border-line-subtle bg-surface-muted flex items-center justify-between">
              <div>
                <span className="eyebrow block">Weighted overall score</span>
                <span className="text-[11px] text-ink-tertiary">
                  Calculated from {kpis.length} KPI{kpis.length !== 1 ? "s" : ""}
                </span>
              </div>
              <span
                className={cn(
                  "font-display font-light tracking-[-0.02em] font-mono tabular-nums text-[2.25rem] leading-none",
                  scoreToneText[scoreTone],
                )}
              >
                {overallScore}
                <span className="text-[0.75rem] opacity-70 font-normal">%</span>
              </span>
            </div>
          </>
        )}
      </div>

      {/* Review form */}
      <div className="rounded-md border border-line-subtle bg-surface-raised shadow-e1 overflow-hidden">
        <div className="px-6 pt-5 pb-1">
          <span className="eyebrow">Performance review</span>
          <h2 className="text-[1.25rem] font-light tracking-[-0.015em] text-ink-primary mt-0.5">
            Rating & feedback
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="px-6 pt-4">
              <FormError>{error}</FormError>
            </div>
          )}

          <div className="px-6 divide-y divide-line-subtle">
            <FormSection
              eyebrow="Verdict"
              title="Rating"
              description="Pick a category that best summarizes performance this cycle. The weighted score is shown above."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Review cycle" required>
                  {({ id }) => (
                    <Input
                      id={id}
                      name="cycle"
                      type="text"
                      value={formData.cycle}
                      onChange={handleChange}
                      required
                      readOnly
                      className="bg-surface-sunken font-mono tabular-nums"
                    />
                  )}
                </Field>
                <Field label="Overall rating" required>
                  {({ id, invalid }) => (
                    <Select
                      id={id}
                      name="overall_rating"
                      value={formData.overall_rating}
                      onChange={handleChange}
                      required
                      invalid={invalid}
                    >
                      <option value="">Select a rating…</option>
                      {ratingOptions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              </div>
            </FormSection>

            <FormSection
              eyebrow="Narrative"
              title="Manager feedback"
              description="Share specific achievements, gaps, and what you want to see next cycle. This is what the employee reads."
            >
              <Field label="Manager notes" required>
                {({ id, invalid }) => (
                  <Textarea
                    id={id}
                    name="manager_notes"
                    value={formData.manager_notes}
                    onChange={handleChange}
                    rows={6}
                    required
                    invalid={invalid}
                    placeholder="Highlights, concerns, goals for the next cycle…"
                  />
                )}
              </Field>
            </FormSection>
          </div>

          <FormActions align="split" className="px-6 py-4 bg-surface-muted mt-0 border-t-0">
            <span className="text-[11px] text-ink-tertiary font-mono tabular-nums">
              Submitting will notify the employee to acknowledge.
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
                {loading ? "Submitting…" : "Submit review"}
              </Button>
            </div>
          </FormActions>
        </form>
      </div>
    </div>
  );
}
