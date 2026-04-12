"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Target } from "lucide-react";

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

export default function ConductReviewForm({ employeeId, adminId, kpis, defaultCycle }: ConductReviewFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cycle: defaultCycle,
    overall_rating: "",
    manager_notes: "",
  });

  // Calculate weighted score from KPIs
  const totalWeight = kpis.reduce((sum, kpi) => sum + (kpi.weight || 1), 0);
  const weightedProgress = kpis.reduce((sum, kpi) => {
    const weight = kpi.weight || 1;
    const progress = kpi.progress || 0;
    return sum + (progress * weight);
  }, 0);
  const overallScore = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from("performance_reviews")
        .insert({
          employee_id: employeeId,
          cycle: formData.cycle,
          overall_rating: formData.overall_rating,
          overall_score: overallScore,
          manager_notes: formData.manager_notes || null,
          reviewed_by: adminId,
        });

      if (insertError) throw insertError;

      router.push(`/admin/employees/${employeeId}/kpi`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
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

  const ratingOptions = [
    "Exceeds Expectations",
    "Meets Expectations",
    "Needs Improvement",
    "Unsatisfactory",
  ];

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      <div className="card p-6">
        <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
          KPI Summary
        </h3>

        {kpis.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
            <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
              No KPIs found for this cycle
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {kpis.map((kpi) => (
                <div
                  key={kpi.id}
                  className="flex items-center justify-between p-3 rounded"
                  style={{ backgroundColor: 'var(--tag-bg-warm)' }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-normal">{kpi.title}</p>
                    <p className="text-xs" style={{ color: 'var(--tag-body)' }}>
                      Weight: {kpi.weight}x
                      {kpi.target && ` • Target: ${kpi.target} ${kpi.unit || ''}`}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-light tabular-nums" style={{ color: 'var(--tag-orange)' }}>
                      {kpi.progress}%
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t" style={{ borderColor: 'var(--tag-border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--tag-label)' }}>
                    Weighted Overall Score
                  </p>
                  <p className="text-xs" style={{ color: 'var(--tag-body)' }}>
                    Calculated from {kpis.length} KPI{kpis.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <p className="text-3xl font-light tabular-nums" style={{ color: 'var(--tag-orange)' }}>
                  {overallScore}%
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Review Form */}
      <div className="card p-6">
        <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
          Performance Review
        </h3>

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
            <label htmlFor="cycle" className="label">
              Review Cycle *
            </label>
            <input
              id="cycle"
              name="cycle"
              type="text"
              value={formData.cycle}
              onChange={handleChange}
              className="input"
              required
              readOnly
            />
          </div>

          <div>
            <label htmlFor="overall_rating" className="label">
              Overall Rating *
            </label>
            <select
              id="overall_rating"
              name="overall_rating"
              value={formData.overall_rating}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Select rating</option>
              {ratingOptions.map((rating) => (
                <option key={rating} value={rating}>
                  {rating}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="manager_notes" className="label">
              Manager Feedback *
            </label>
            <textarea
              id="manager_notes"
              name="manager_notes"
              value={formData.manager_notes}
              onChange={handleChange}
              className="input"
              rows={6}
              placeholder="Provide detailed feedback on performance, achievements, and areas for improvement..."
              required
            />
          </div>

          <div className="p-4 rounded" style={{ backgroundColor: 'rgba(249,115,22,0.08)' }}>
            <p className="text-sm mb-2" style={{ color: 'var(--tag-label)' }}>
              Review Summary
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm">Overall Score (Weighted):</span>
              <span className="text-xl font-light tabular-nums" style={{ color: 'var(--tag-orange)' }}>
                {overallScore}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: "var(--tag-border)" }}>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Submitting..." : "Submit Review"}
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
    </div>
  );
}
