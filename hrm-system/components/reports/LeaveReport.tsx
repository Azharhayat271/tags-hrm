"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, Calendar } from "lucide-react";

export default function LeaveReport() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [status, setStatus] = useState<string>("all");

  const handleExport = async () => {
    setLoading(true);

    try {
      const supabase = createClient();

      // Build query
      let query = supabase
        .from("leave_requests")
        .select(`
          *,
          employee:employees(
            id,
            profile:profiles(full_name, email),
            designation,
            department
          ),
          leave_type:leave_types(name),
          reviewer:reviewed_by(full_name)
        `)
        .gte("start_date", dateRange.startDate)
        .lte("end_date", dateRange.endDate)
        .order("created_at", { ascending: false });

      // Filter by status if not "all"
      if (status !== "all") {
        query = query.eq("status", status);
      }

      const { data: leaves, error } = await query;

      if (error) throw error;

      // Convert to CSV
      const headers = [
        "Employee",
        "Email",
        "Department",
        "Leave Type",
        "Start Date",
        "End Date",
        "Days",
        "Status",
        "Reason",
        "Reviewed By",
        "Review Note",
        "Applied On",
      ];

      const rows = leaves?.map((leave: any) => [
        leave.employee?.profile?.full_name || "—",
        leave.employee?.profile?.email || "—",
        leave.employee?.department || "—",
        leave.leave_type?.name || "—",
        leave.start_date,
        leave.end_date,
        leave.days,
        leave.status,
        leave.reason || "—",
        leave.reviewer?.full_name || "—",
        leave.review_note || "—",
        new Date(leave.created_at).toLocaleDateString(),
      ]) || [];

      const csv = [headers, ...rows].map(row => row.join(",")).join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leave-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting leave report:", error);
      alert("Failed to export report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-light mb-1" style={{ letterSpacing: '-0.22px' }}>
            Leave Report
          </h3>
          <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
            Export leave requests with filters
          </p>
        </div>
        <Calendar className="w-5 h-5" style={{ color: 'var(--tag-success)' }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--tag-label)' }}>
            Start Date
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="w-full px-3 py-2 rounded text-sm"
            style={{
              border: '1px solid var(--tag-border)',
              backgroundColor: 'var(--tag-bg)',
              color: 'var(--tag-heading)',
            }}
          />
        </div>

        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--tag-label)' }}>
            End Date
          </label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="w-full px-3 py-2 rounded text-sm"
            style={{
              border: '1px solid var(--tag-border)',
              backgroundColor: 'var(--tag-bg)',
              color: 'var(--tag-heading)',
            }}
          />
        </div>

        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--tag-label)' }}>
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm"
            style={{
              border: '1px solid var(--tag-border)',
              backgroundColor: 'var(--tag-bg)',
              color: 'var(--tag-heading)',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={loading}
        className="btn-primary inline-flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        {loading ? "Exporting..." : "Export CSV"}
      </button>
    </div>
  );
}
