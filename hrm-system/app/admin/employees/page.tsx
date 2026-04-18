import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import EmployeeTable from "@/components/employees/EmployeeTable";
import EmployeeSearch from "@/components/employees/EmployeeSearch";

export const dynamic = "force-dynamic";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; department?: string }>;
}) {
  const params = await searchParams;
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

  // Build query with filters
  let query = supabase
    .from("employees")
    .select(`
      *,
      profiles!inner(full_name, email, phone),
      designation:designations(id, name),
      department:departments(id, name),
      manager:reports_to(
        id,
        profiles(full_name)
      )
    `);

  // Apply search filter
  if (params.search) {
    query = query.or(`profiles.full_name.ilike.%${params.search}%,profiles.email.ilike.%${params.search}%,designations.name.ilike.%${params.search}%`);
  }

  // Apply status filter
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  // Apply department filter
  if (params.department && params.department !== "all") {
    query = query.eq("departments.name", params.department);
  }

  const { data: employees } = await query.order("created_at", { ascending: false });

  // Get unique departments for filter
  const { data: allDepartments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  const departments = allDepartments?.map(d => d.name) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
            Employees
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
            Manage employee records and information
          </p>
        </div>
        <Link href="/admin/employees/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Employee
        </Link>
      </div>

      <EmployeeSearch 
        departments={departments}
        currentSearch={params.search}
        currentStatus={params.status}
        currentDepartment={params.department}
      />

      <EmployeeTable employees={employees || []} />
    </div>
  );
}
