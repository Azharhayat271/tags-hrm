"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ArrowRight, UsersRound } from "lucide-react";
import { Badge, EmptyState, cn } from "@/components/ui";

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

function initialsFor(name?: string | null) {
  if (!name) return "—";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type StatusVariant = "success" | "warning" | "danger" | "neutral";
function statusMeta(status: string): { label: string; variant: StatusVariant } {
  switch (status) {
    case "active":     return { label: "Active", variant: "success" };
    case "on_leave":   return { label: "On leave", variant: "warning" };
    case "resigned":   return { label: "Resigned", variant: "danger" };
    case "terminated": return { label: "Terminated", variant: "danger" };
    case "inactive":   return { label: "Inactive", variant: "neutral" };
    default:           return { label: status.replace("_", " "), variant: "neutral" };
  }
}

export default function EmployeeTable({ employees }: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <EmptyState
        icon={<UsersRound className="w-5 h-5" />}
        title="No employees found"
        description="Adjust your search or department filters. You can also add a new employee from the header above."
      />
    );
  }

  return (
    <div className="rounded-md border border-line-subtle bg-surface-raised overflow-hidden shadow-e1">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-surface-sunken">
            <th className="text-left px-5 py-3 border-b border-line-subtle">
              <span className="eyebrow">Employee</span>
            </th>
            <th className="text-left px-4 py-3 border-b border-line-subtle">
              <span className="eyebrow">Designation</span>
            </th>
            <th className="text-left px-4 py-3 border-b border-line-subtle">
              <span className="eyebrow">Department</span>
            </th>
            <th className="text-left px-4 py-3 border-b border-line-subtle">
              <span className="eyebrow">Joined</span>
            </th>
            <th className="text-left px-4 py-3 border-b border-line-subtle">
              <span className="eyebrow">Status</span>
            </th>
            <th className="px-4 py-3 border-b border-line-subtle" style={{ width: 80 }} />
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => {
            const meta = statusMeta(employee.status);
            return (
              <tr
                key={employee.id}
                className="group border-b last:border-b-0 border-line-subtle hover:bg-surface-muted/60 transition-colors duration-fast"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="inline-flex items-center justify-center w-9 h-9 rounded-sm bg-surface-sunken border border-line-subtle text-[11px] font-medium text-ink-secondary shrink-0"
                    >
                      {initialsFor(employee.profiles?.full_name)}
                    </span>
                    <div className="min-w-0">
                      <div className="text-ink-primary truncate">
                        {employee.profiles?.full_name ?? "—"}
                      </div>
                      <div className="text-[11px] text-ink-tertiary font-mono truncate">
                        {employee.profiles?.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-secondary">
                  {employee.designation?.name ?? <span className="text-ink-quaternary">—</span>}
                </td>
                <td className="px-4 py-3 text-ink-secondary">
                  {employee.department?.name ?? <span className="text-ink-quaternary">—</span>}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums text-ink-secondary text-[12px]">
                  {employee.joining_date ? formatDate(employee.joining_date) : <span className="text-ink-quaternary">—</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={meta.variant} size="md" dot>
                    {meta.label}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/employees/${employee.id}`}
                    className={cn(
                      "inline-flex items-center gap-1 text-[12px] text-ink-tertiary",
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      "hover:text-ink-accent",
                    )}
                  >
                    View
                    <ArrowRight className="w-3 h-3" strokeWidth={2} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
