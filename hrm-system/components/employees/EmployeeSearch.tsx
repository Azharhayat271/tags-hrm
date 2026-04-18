"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X } from "lucide-react";

interface EmployeeSearchProps {
  departments: string[];
  currentSearch?: string;
  currentStatus?: string;
  currentDepartment?: string;
}

export default function EmployeeSearch({
  departments,
  currentSearch = "",
  currentStatus = "all",
  currentDepartment = "all",
}: EmployeeSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);
  const [status, setStatus] = useState(currentStatus);
  const [department, setDepartment] = useState(currentDepartment);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    
    if (search) {
      params.set("search", search);
    }

    if (status && status !== "all") {
      params.set("status", status);
    }

    if (department && department !== "all") {
      params.set("department", department);
    }

    const debounce = setTimeout(() => {
      router.push(`/admin/employees?${params.toString()}`);
    }, 300);

    return () => clearTimeout(debounce);
  }, [search, status, department, router]);

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setDepartment("all");
  };

  const hasActiveFilters = search || (status && status !== "all") || (department && department !== "all");

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or designation..."
            className="w-full pl-10 pr-3 py-2 rounded text-sm"
            style={{
              border: '1px solid var(--tag-border)',
              backgroundColor: 'var(--tag-bg)',
              color: 'var(--tag-heading)',
            }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-ghost inline-flex items-center gap-2 ${showFilters ? 'bg-orange-50' : ''}`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn-ghost inline-flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
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
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="exited">Exited</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
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
      )}
    </div>
  );
}
