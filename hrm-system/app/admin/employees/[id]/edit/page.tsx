import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import EditEmployeeForm from "@/components/employees/EditEmployeeForm";
import { requirePagePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEmployeePage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requirePagePermission("employees.manage");
  if (!ctx) redirect("/dashboard");
  const supabase = await createClient();

  // Fetch employee details
  const { data: employee, error } = await supabase
    .from("employees")
    .select(`
      *,
      profiles!inner(full_name, email, phone)
    `)
    .eq("id", id)
    .single();

  if (error || !employee) {
    notFound();
  }

  // Fetch all employees for the "Reports To" dropdown
  const { data: managers } = await supabase
    .from("employees")
    .select("id, profiles!inner(full_name)")
    .eq("status", "active")
    .neq("id", id) // Exclude current employee
    .order("profiles(full_name)");

  const normalizedEmployee = {
    ...employee,
    profiles: Array.isArray(employee.profiles)
      ? employee.profiles[0] ?? null
      : employee.profiles,
  };

  const normalizedManagers = (managers ?? []).map((manager) => ({
    ...manager,
    profiles: Array.isArray(manager.profiles)
      ? manager.profiles[0] ?? null
      : manager.profiles,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Edit Employee
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Update employee information
        </p>
      </div>

      <div className="max-w-3xl">
        <EditEmployeeForm employee={normalizedEmployee} managers={normalizedManagers} />
      </div>
    </div>
  );
}
