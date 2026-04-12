"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Eye } from "lucide-react";

interface Employee {
  id: string;
  designation_id: string | null;
  department_id: string | null;
  employment_type: string | null;
  joining_date: string | null;
  status: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
  designation: {
    id: string;
    name: string;
  } | null;
  department: {
    id: string;
    name: string;
  } | null;
  manager: {
    id: string;
    profiles: {
      full_name: string;
    } | null;
  } | null;
}

interface EmployeeTableProps {
  employees: Employee[];
}

export default function EmployeeTable({ employees }: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--tag-body)' }}>No employees found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="w-full">
        <thead>
          <tr className="table-header">
            <th className="text-left px-4 py-3">Name</th>
            <th className="text-left px-4 py-3">Designation</th>
            <th className="text-left px-4 py-3">Department</th>
            <th className="text-left px-4 py-3">Joining Date</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-right px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id} className="table-row">
              <td className="px-4 py-3">
                <div>
                  <p className="font-normal">{employee.profiles?.full_name}</p>
                  <p className="text-xs" style={{ color: 'var(--tag-body)' }}>
                    {employee.profiles?.email}
                  </p>
                </div>
              </td>
              <td className="px-4 py-3">{employee.designation?.name || "—"}</td>
              <td className="px-4 py-3">{employee.department?.name || "—"}</td>
              <td className="px-4 py-3 tabular-nums">
                {employee.joining_date ? formatDate(employee.joining_date) : "—"}
              </td>
              <td className="px-4 py-3">
                <span className={`badge ${
                  employee.status === 'active' ? 'badge-success' :
                  employee.status === 'on_leave' ? 'badge-warning' :
                  'badge-danger'
                }`}>
                  {employee.status.replace("_", " ").toUpperCase()}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/employees/${employee.id}`}
                  className="inline-flex items-center gap-1 text-sm hover:underline"
                  style={{ color: 'var(--tag-orange)' }}
                >
                  <Eye className="w-4 h-4" />
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
