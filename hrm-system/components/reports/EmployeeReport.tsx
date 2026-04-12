"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, Users } from "lucide-react";

export default function EmployeeReport() {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    department: "all",
  });
  const [departments, setDepartments] = useState<string[]>([]);

  // Load departments on mount
  useState(() => {
    const loadDepartments = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("employees")
        .select("department")
        .not("department", "is", null);

      if (data) {
        const uniqueDepts = [...new Set(data.map((e: any) => e.department))].filter(Boolean);
        setDepartments(uniqueDepts as string[]);
      }
    };
    loadDepartments();
  });

  const handleExport = async () => {
    setLoading(true);

    try {
      const supabase = createClient();

      // Build query
      let query = supabase
        .from("employees")
        .select(`
          *,
          profile:profiles(full_name, email, phone, role),
          manager:reports_to(profile:profiles(full_name))
        `)
        .order("joining_date", { ascending: false });

      // Apply filters
      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters.department !== "all") {
        query = query.eq("department", filters.department);
      }

      const { data: employees, error } = await query;

      if (error) throw error;

      // Calculate tenure for each employee
      const employeesWithTenure = employees?.map((emp: any) => {
        let tenure = "—";
        if (emp.joining_date) {
          const joining = new Date(emp.joining_date);
          const now = new Date();
          const months = (now.getFullYear() - joining.getFullYear()) * 12 + (now.getMonth() - joining.getMonth());
          const years = Math.floor(months / 12);
          const remainingMonths = months % 12;
          tenure = years > 0 ? `${years}y ${remainingMonths}m` : `${remainingMonths}m`;
        }
        return { ...emp, tenure };
      });

      // Convert to CSV
      const headers = [
        "Name",
        "Email",
        "Phone",
        "Designation",
        "Department",
        "Employment Type",
        "Joining Date",
        "Tenure",
        "Reports To",
        "Status",
        "Role",
      ];

      const rows = employeesWithTenure?.map((emp: any) => [
        emp.profile?.full_name || "—",
        emp.profile?.email || "—",
        emp.profile?.phone || "—",
        emp.designation || "—",
        emp.department || "—",
        emp.employment_type || "—",
        emp.joining_date || "—",
        emp.tenure,
        emp.manager?.profile?.full_name || "—",
        emp.status || "—",
        emp.profile?.role || "—",
      ]) || [];

      const csv = [headers, ...rows].map(row => row.join(",")).join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `employee-report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting employee report:", error);
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
            Employee Report
          </h3>
          <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
            Export complete employee directory with filters
          </p>
        </div>
        <Users className="w-5 h-5" style={{ color: 'var(--tag-orange)' }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--tag-label)' }}>
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 rounded text-sm"
            style={{
              border: '1px solid var(--tag-border)',
              backgroundColor: 'var(--tag-bg)',
              color: 'var(--tag-heading)',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="exited">Exited</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--tag-label)' }}>
            Department
          </label>
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="w-full px-3 py-2 rounded text-sm"
            style={{
              border: '1px solid var(--tag-border)',
              backgroundColor: 'var(--tag-bg)',
              color: 'var(--tag-heading)',
            }}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
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
