"use client";

import { formatDate } from "@/lib/utils";
import { Calendar, Clock } from "lucide-react";
import { isPendingStatus, statusLabel } from "@/lib/leave/balance";

function badgeFor(status: string): string {
  if (status === "approved") return "badge-success";
  if (status === "rejected" || status === "cancelled") return "badge-danger";
  return "badge-warning";
}

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: string;
  review_note: string | null;
  created_at: string;
  leave_types: {
    name: string;
  } | null;
  reviewed_by_profile: {
    full_name: string;
  } | null;
}

interface LeaveHistoryProps {
  requests: LeaveRequest[];
}

export default function LeaveHistory({ requests }: LeaveHistoryProps) {
  if (requests.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
          Leave History
        </h3>
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            No leave requests yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
        Leave History
      </h3>

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
                  <h4 className="text-base font-normal">{request.leave_types?.name}</h4>
                  <span className={`badge ${badgeFor(request.status)}`}>
                    {statusLabel(request.status).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm" style={{ color: "var(--text-tertiary)" }}>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span className="tabular-nums">
                      {formatDate(request.start_date)} - {formatDate(request.end_date)}
                    </span>
                  </div>
                  <span className="tabular-nums">
                    {request.days} {request.days === 1 ? 'day' : 'days'}
                  </span>
                </div>
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

            {!isPendingStatus(request.status) && (
              <div className="pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                      {request.status === 'approved' ? 'Approved by' : 'Reviewed by'}
                    </p>
                    <p className="text-sm">{request.reviewed_by_profile?.full_name || '—'}</p>
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
