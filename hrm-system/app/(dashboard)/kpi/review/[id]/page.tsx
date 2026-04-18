import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import AcknowledgeReviewForm from "@/components/kpi/AcknowledgeReviewForm";

export const dynamic = "force-dynamic";

export default async function AcknowledgeReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get employee record
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("profile_id", user?.id)
    .single();

  if (!employee) {
    redirect("/dashboard");
  }

  // Get the review
  const { data: review } = await supabase
    .from("performance_reviews")
    .select(`
      *,
      reviewed_by_profile:reviewed_by(full_name)
    `)
    .eq("id", id)
    .eq("employee_id", employee.id)
    .single();

  if (!review) {
    redirect("/kpi");
  }

  // If already acknowledged, redirect back
  if (review.acknowledged_at) {
    redirect("/kpi");
  }

  return (
    <div>
      <Link
        href="/kpi"
        className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-70 transition-opacity"
        style={{ color: "var(--accent)" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to KPI
      </Link>

      <div className="mb-8">
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Acknowledge Review
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Review and acknowledge your performance evaluation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Review Details */}
        <div className="lg:col-span-2">
          <div className="card p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-light mb-1" style={{ letterSpacing: '-0.26px' }}>
                  {review.cycle}
                </h2>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Reviewed by {review.reviewed_by_profile?.full_name || '—'}
                </p>
              </div>
              <div className="text-right">
                {review.overall_rating && (
                  <span
                    className={`badge ${
                      review.overall_rating.toLowerCase().includes('exceed') ? 'badge-success' :
                      review.overall_rating.toLowerCase().includes('meet') ? 'badge-orange' :
                      'badge-warning'
                    }`}
                  >
                    {review.overall_rating}
                  </span>
                )}
                {review.overall_score !== null && (
                  <p className="text-2xl font-light tabular-nums mt-2" style={{ color: "var(--accent)" }}>
                    {review.overall_score}%
                  </p>
                )}
              </div>
            </div>

            {review.manager_notes && (
              <div className="p-4 rounded" style={{ backgroundColor: "var(--surface-muted)" }}>
                <p className="text-xs font-normal mb-2" style={{ color: "var(--text-secondary)" }}>
                  Manager Feedback
                </p>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  {review.manager_notes}
                </p>
              </div>
            )}
          </div>

          <AcknowledgeReviewForm reviewId={review.id} />
        </div>

        {/* Info Sidebar */}
        <div className="card p-6">
          <h3 className="text-base font-normal mb-4">About Acknowledgment</h3>
          <div className="space-y-4 text-sm" style={{ color: "var(--text-tertiary)" }}>
            <p>
              Acknowledging your review confirms that you have read and understood the feedback provided by your manager.
            </p>
            <p>
              You can add your own comments or reflections about the review. This is optional but encouraged.
            </p>
            <p>
              Once acknowledged, you cannot modify your comments, but you can always view the review in your history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
