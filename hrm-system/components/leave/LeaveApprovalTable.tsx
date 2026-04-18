"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import { formatDate } from "@/lib/utils";
import { Check, X, Calendar, Loader2 } from "lucide-react";
import { statusLabel } from "@/lib/leave/balance";

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: string;
  review_note: string | null;
  created_at: string;
  employee: {
    id: string;
    profiles: {
      full_name: string;
      email: string;
    } | null;
  } | null;
  leave_types: {
    name: string;
  } | null;
  reviewed_by_profile: {
    full_name: string;
  } | null;
}

interface LeaveApprovalTableProps {
  requests: LeaveRequest[];
  adminId: string;
  isPending: boolean;
}

function badgeForStatus(status: string): string {
  if (status === "approved") return "badge-success";
  if (status === "rejected" || status === "cancelled") return "badge-danger";
  return "badge-warning";
}

export default function LeaveApprovalTable({ requests, adminId, isPending }: LeaveApprovalTableProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const handleApprove = async (requestId: string) => {
    setLoadingId(requestId);
    try {
      const { error } = await callApi(`/api/leave-requests/${requestId}/approve`, {
        method: "PATCH",
        body: { review_note: reviewNote || null },
      });

      if (error) throw new Error(error);

      setReviewingId(null);
      setReviewNote("");
      router.refresh();
    } catch (error) {
      console.error("Failed to approve:", error);
      alert("Failed to approve leave request");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!reviewNote.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setLoadingId(requestId);
    try {
      const { error } = await callApi(`/api/leave-requests/${requestId}/reject`, {
        method: "PATCH",
        body: { review_note: reviewNote },
      });

      if (error) throw new Error(error);

      setReviewingId(null);
      setReviewNote("");
      router.refresh();
    } catch (error) {
      console.error("Failed to reject:", error);
      alert("Failed to reject leave request");
    } finally {
      setLoadingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          {isPending ? 'No pending requests' : 'No reviewed requests'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="p-4 rounded border"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-base font-normal">
                  {request.employee?.profiles?.full_name}
                </h4>
                <span className={`badge ${badgeForStatus(request.status)}`}>
                  {statusLabel(request.status).toUpperCase()}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                {request.employee?.profiles?.email}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Applied
              </p>
              <p className="text-xs tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                {formatDate(request.created_at)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                Leave Type
              </p>
              <p className="text-sm">{request.leave_types?.name}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                Duration
              </p>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="w-3 h-3" />
                <span className="tabular-nums">
                  {formatDate(request.start_date)} - {formatDate(request.end_date)}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                Days
              </p>
              <p className="text-sm tabular-nums">
                {request.days} {request.days === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>

          {request.reason && (
            <div className="mb-3">
              <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                Reason
              </p>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                {request.reason}
              </p>
            </div>
          )}

          {isPending ? (
            reviewingId === request.id ? (
              <div className="pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="mb-3">
                  <label className="label">Note (optional for approval, required for rejection)</label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="input"
                    rows={2}
                    placeholder="Add a note..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={loadingId === request.id}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {loadingId === request.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={loadingId === request.id}
                    className="btn-destructive flex items-center gap-2 disabled:opacity-50"
                  >
                    {loadingId === request.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setReviewingId(null);
                      setReviewNote("");
                    }}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <button
                  onClick={() => setReviewingId(request.id)}
                  className="btn-primary text-sm"
                >
                  Review Request
                </button>
              </div>
            )
          ) : request.status === 'approved' ||
            request.status === 'rejected' ||
            request.status === 'cancelled' ? (
            <div className="pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                    {request.status === 'approved'
                      ? 'Approved by'
                      : request.status === 'cancelled'
                      ? 'Cancelled'
                      : 'Rejected by'}
                  </p>
                  <p className="text-sm">
                    {request.status === 'cancelled'
                      ? 'By employee'
                      : request.reviewed_by_profile?.full_name || '—'}
                  </p>
                </div>
                {request.review_note && (
                  <div className="text-right max-w-xs">
                    <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                      Note
                    </p>
                    <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                      {request.review_note}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-tertiary)" }}>
              {statusLabel(request.status)} — no action available in this view.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
