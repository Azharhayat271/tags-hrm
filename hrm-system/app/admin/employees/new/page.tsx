import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewEmployeeForm from "@/components/employees/NewEmployeeForm";
import { requirePagePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function NewEmployeePage() {
  const ctx = await requirePagePermission("employees.manage");
  if (!ctx) redirect("/dashboard");
  const supabase = await createClient();

  // Fetch all employees for the "Reports To" dropdown
  const { data: employees, error: employeesError } = await supabase
    .from("employees")
    .select("id, profiles!inner(full_name)")
    .eq("status", "active")
    .order("profiles(full_name)");

  // Transform to match Manager type
  const managers = (employees || []).map(emp => ({
    id: emp.id,
    profiles: Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles
  }));

  console.log("Employees fetch result:", { count: employees?.length, employeesError });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Add New Employee
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Create a new employee record
        </p>
      </div>

      <div className="max-w-3xl">
        <NewEmployeeForm managers={managers} /> 
      </div>
    </div>
  );
}
