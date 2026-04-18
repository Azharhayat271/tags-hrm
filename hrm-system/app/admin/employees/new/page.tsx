import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewEmployeeForm from "@/components/employees/NewEmployeeForm";

export const dynamic = "force-dynamic";

export default async function NewEmployeePage() {
  console.log("NewEmployeePage server component rendering...");
  
  const supabase = await createClient();
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("User fetch result:", { userId: user?.id, userError });

  if (!user) {
    console.log("No user found, redirecting to login");
    redirect("/login");
  }

  // Check if user is admin or super_admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  console.log("Profile fetch result:", { role: profile?.role, profileError });

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    console.log("User is not admin/super_admin, redirecting to dashboard");
    redirect("/dashboard");
  }

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
