import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Upload, FileText } from "lucide-react";
import PayrollUploadForm from "@/components/payroll/PayrollUploadForm";
import RecentUploads from "@/components/payroll/RecentUploads";

export const dynamic = "force-dynamic";

export default async function PayrollUploadPage() {
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

  // Get all active employees
  const { data: employees } = await supabase
    .from("employees")
    .select("id, profiles(full_name, email)")
    .eq("status", "active")
    .order("profiles(full_name)");

  const normalizedEmployees = (employees ?? []).map((employee) => ({
    ...employee,
    profiles: Array.isArray(employee.profiles)
      ? employee.profiles[0] ?? null
      : employee.profiles,
  }));

  // Get recent uploads
  const { data: recentUploads } = await supabase
    .from("salary_slips")
    .select(`
      *,
      employee:employees(
        id,
        profiles(full_name, email)
      ),
      uploaded_by_profile:uploaded_by(full_name)
    `)
    .order("uploaded_at", { ascending: false })
    .limit(10);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Payroll Upload
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Upload salary slips for employees
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-2">
          <PayrollUploadForm 
            employees={normalizedEmployees}
            adminId={user?.id || ''}
          />
        </div>

        {/* Recent Uploads */}
        <div>
          <RecentUploads uploads={recentUploads || []} />
        </div>
      </div>
    </div>
  );
}
