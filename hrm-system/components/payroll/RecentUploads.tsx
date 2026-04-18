"use client";

import { formatDate } from "@/lib/utils";
import { FileText, Clock } from "lucide-react";

interface Upload {
  id: string;
  month: number;
  year: number;
  uploaded_at: string;
  employee: {
    id: string;
    profiles: {
      full_name: string;
      email: string;
    } | null;
  } | null;
  uploaded_by_profile: {
    full_name: string;
  } | null;
}

interface RecentUploadsProps {
  uploads: Upload[];
}

export default function RecentUploads({ uploads }: RecentUploadsProps) {
  const getMonthName = (month: number): string => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5" style={{ color: "var(--accent)" }} />
        <h3 className="text-lg font-light" style={{ letterSpacing: '-0.22px' }}>
          Recent Uploads
        </h3>
      </div>

      {uploads.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            No uploads yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="p-3 rounded"
              style={{ backgroundColor: "var(--surface-muted)" }}
            >
              <div className="flex items-start gap-2 mb-1">
                <FileText className="w-4 h-4 mt-0.5" style={{ color: "var(--accent)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-normal truncate">
                    {upload.employee?.profiles?.full_name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {getMonthName(upload.month)} {upload.year}
                  </p>
                </div>
              </div>
              <p className="text-xs ml-6" style={{ color: "var(--text-secondary)" }}>
                {formatDate(upload.uploaded_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
