"use client";

import { formatDate } from "@/lib/utils";
import { Award, MessageSquare, CheckCircle } from "lucide-react";
import Link from "next/link";

interface PerformanceReview {
  id: string;
  cycle: string;
  overall_rating: string | null;
  overall_score: number | null;
  manager_notes: string | null;
  employee_notes: string | null;
  acknowledged_at: string | null;
  created_at: string;
  reviewed_by_profile: {
    full_name: string;
  } | null;
}

interface ReviewHistoryProps {
  reviews: PerformanceReview[];
}

export default function ReviewHistory({ reviews }: ReviewHistoryProps) {
  if (reviews.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
          Review History
        </h3>
        <div className="text-center py-12">
          <Award className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            No performance reviews yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
        Review History
      </h3>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-4 rounded border"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-base font-normal">{review.cycle}</h4>
                  {review.acknowledged_at && (
                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--tag-success)' }} />
                  )}
                </div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
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
                  <p className="text-lg font-light tabular-nums mt-1" style={{ color: "var(--accent)" }}>
                    {review.overall_score}%
                  </p>
                )}
              </div>
            </div>

            {review.manager_notes && (
              <div className="mb-3 p-3 rounded" style={{ backgroundColor: "var(--surface-muted)" }}>
                <div className="flex items-start gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 mt-0.5" style={{ color: "var(--accent)" }} />
                  <p className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>
                    Manager Feedback
                  </p>
                </div>
                <p className="text-sm ml-6" style={{ color: "var(--text-tertiary)" }}>
                  {review.manager_notes}
                </p>
              </div>
            )}

            {review.employee_notes && (
              <div className="mb-3 p-3 rounded" style={{ backgroundColor: 'rgba(249,115,22,0.05)' }}>
                <div className="flex items-start gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 mt-0.5" style={{ color: "var(--accent)" }} />
                  <p className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>
                    Your Comments
                  </p>
                </div>
                <p className="text-sm ml-6" style={{ color: "var(--text-tertiary)" }}>
                  {review.employee_notes}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
              <span>Reviewed on {formatDate(review.created_at)}</span>
              {review.acknowledged_at ? (
                <span className="text-success">Acknowledged {formatDate(review.acknowledged_at)}</span>
              ) : (
                <Link
                  href={`/kpi/review/${review.id}`}
                  className="btn-ghost text-xs px-3 py-1"
                >
                  Acknowledge Review
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
