"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, Calendar } from "lucide-react";

export default function AttendanceReport() {
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const handleExport = async () => {
    setLoading(true);

    try {
      const supabase = createClient();
      const [year, monthNum] = month.split("-");
      const firstDay = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0);

      // Get attendance data with employee info
      const { data: attendance, error } = await supabase
        .from("attendance")
        .select(`
          *,
          employee:employees(
            id,
            profile:profiles(full_name, email),
            designation,
            department
          )
        `)
        .gte("date", firstDay.toISOString().split("T")[0])
        .lte("date", lastDay.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) throw error;

      // Convert to CSV
      const headers = ["Date", "Employee", "Email", "Department", "Check In", "Check Out", "Total Hours"];
      const rows = attendance?.map((record: any) => {
        const checkIn = record.check_in ? new Date(record.check_in).toLocaleTimeString() : "—";
        const checkOut = record.check_out ? new Date(record.check_out).toLocaleTimeString() : "—";
        
        let totalHours = "—";
        if (record.check_in && record.check_out) {
          const diff = new Date(record.check_out).getTime() - new Date(record.check_in).getTime();
          totalHours = (diff / (1000 * 60 * 60)).toFixed(2);
        }

        return [
          record.date,
          record.employee?.profile?.full_name || "—",
          record.employee?.profile?.email || "—",
          record.employee?.department || "—",
          checkIn,
          checkOut,
          totalHours,
        ];
      }) || [];

      const csv = [headers, ...rows].map(row => row.join(",")).join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-report-${month}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting attendance:", error);
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
            Attendance Report
          </h3>
          <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
            Export attendance records for a specific month
          </p>
        </div>
        <Calendar className="w-5 h-5" style={{ color: 'var(--tag-orange)' }} />
      </div>

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm mb-2" style={{ color: 'var(--tag-label)' }}>
            Select Month
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm"
            style={{
              border: '1px solid var(--tag-border)',
              backgroundColor: 'var(--tag-bg)',
              color: 'var(--tag-heading)',
            }}
          />
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
    </div>
  );
}
