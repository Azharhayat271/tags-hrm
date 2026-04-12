import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Briefcase, Calendar, Building, User, TrendingUp } from "lucide-react";
import EmployeeActions from "@/components/employees/EmployeeActions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is admin or super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  // Fetch employee details
  const { data: employee, error } = await supabase
    .from("employees")
    .select(`
      *,
      profiles!inner(full_name, email, phone, role),
      designation:designations(id, name),
      department:departments(id, name),
      manager:reports_to(
        id,
        profiles(full_name)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !employee) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
          style={{ color: "var(--tag-orange)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employees
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ fontSize: "2rem", lineHeight: "1.1", letterSpacing: "-0.64px" }}>
              {employee.profiles?.full_name}
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--tag-body)" }}>
              {employee.designation?.name || "Employee"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/employees/${id}/edit`}
              className="btn-primary flex items-center gap-2"
            >
              Edit Employee
            </Link>
            <Link
              href={`/admin/employees/${id}/kpi`}
              className="btn-ghost flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              View KPIs
            </Link>
            <Link
              href={`/admin/employees/${id}/lifecycle`}
              className="btn-ghost flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              View Timeline
            </Link>
            <EmployeeActions employeeId={id} currentStatus={employee.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card p-6">
          <div className="flex flex-col items-center text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, var(--tag-orange), var(--tag-amber))" }}
            >
              <User className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-xl font-light mb-1">{employee.profiles?.full_name}</h2>
            <span className="badge-orange mb-4 capitalize">
              {employee.profiles?.role?.replace("_", " ")}
            </span>
            <span
              className={`badge ${
                employee.status === "active"
                  ? "badge-success"
                  : employee.status === "on_leave"
                  ? "badge-warning"
                  : "badge-danger"
              }`}
            >
              {employee.status.replace("_", " ").toUpperCase()}
            </span>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-lg font-light mb-4" style={{ letterSpacing: "-0.22px" }}>
            Contact Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 mt-0.5" style={{ color: "var(--tag-orange)" }} />
              <div>
                <p className="text-xs" style={{ color: "var(--tag-label)" }}>
                  Email
                </p>
                <p className="text-sm font-light">{employee.profiles?.email}</p>
              </div>
            </div>
            {employee.profiles?.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-0.5" style={{ color: "var(--tag-orange)" }} />
                <div>
                  <p className="text-xs" style={{ color: "var(--tag-label)" }}>
                    Phone
                  </p>
                  <p className="text-sm font-light">{employee.profiles.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Employment Information */}
        <div className="card p-6 lg:col-span-3">
          <h3 className="text-lg font-light mb-4" style={{ letterSpacing: "-0.22px" }}>
            Employment Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 mt-0.5" style={{ color: "var(--tag-orange)" }} />
              <div>
                <p className="text-xs" style={{ color: "var(--tag-label)" }}>
                  Designation
                </p>
                <p className="text-sm font-light">{employee.designation?.name || "—"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 mt-0.5" style={{ color: "var(--tag-orange)" }} />
              <div>
                <p className="text-xs" style={{ color: "var(--tag-label)" }}>
                  Department
                </p>
                <p className="text-sm font-light">{employee.department?.name || "—"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 mt-0.5" style={{ color: "var(--tag-orange)" }} />
              <div>
                <p className="text-xs" style={{ color: "var(--tag-label)" }}>
                  Joining Date
                </p>
                <p className="text-sm font-light">
                  {employee.joining_date ? formatDate(employee.joining_date) : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 mt-0.5" style={{ color: "var(--tag-orange)" }} />
              <div>
                <p className="text-xs" style={{ color: "var(--tag-label)" }}>
                  Reports To
                </p>
                <p className="text-sm font-light">
                  {employee.manager?.profiles?.full_name || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 mt-0.5" style={{ color: "var(--tag-orange)" }} />
              <div>
                <p className="text-xs" style={{ color: "var(--tag-label)" }}>
                  Employment Type
                </p>
                <p className="text-sm font-light capitalize">
                  {employee.employment_type?.replace("_", " ") || "—"}
                </p>
              </div>
            </div>

            {employee.joining_date && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 mt-0.5" style={{ color: "var(--tag-orange)" }} />
                <div>
                  <p className="text-xs" style={{ color: "var(--tag-label)" }}>
                    Tenure
                  </p>
                  <p className="text-sm font-light">{calculateTenure(employee.joining_date)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateTenure(joiningDate: string): string {
  const start = new Date(joiningDate);
  const now = new Date();

  const years = now.getFullYear() - start.getFullYear();
  const months = now.getMonth() - start.getMonth();

  const totalMonths = years * 12 + months;
  const displayYears = Math.floor(totalMonths / 12);
  const displayMonths = totalMonths % 12;

  if (displayYears === 0) {
    return `${displayMonths} month${displayMonths !== 1 ? "s" : ""}`;
  } else if (displayMonths === 0) {
    return `${displayYears} year${displayYears !== 1 ? "s" : ""}`;
  } else {
    return `${displayYears} year${displayYears !== 1 ? "s" : ""}, ${displayMonths} month${
      displayMonths !== 1 ? "s" : ""
    }`;
  }
}
