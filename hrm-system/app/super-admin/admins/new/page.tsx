import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import NewAdminForm from "@/components/admins/NewAdminForm";

export const dynamic = "force-dynamic";

export default async function NewAdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is super admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div>
      <Link
        href="/super-admin/admins"
        className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--tag-orange)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Admins
      </Link>

      <div className="mb-8">
        <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
          Add New Admin
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
          Create a new admin account with access to the system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NewAdminForm />
        </div>

        <div className="card p-6">
          <h3 className="text-base font-normal mb-4">About Admin Roles</h3>
          <div className="space-y-4 text-sm" style={{ color: 'var(--tag-body)' }}>
            <div>
              <p className="font-normal mb-1" style={{ color: 'var(--tag-label)' }}>Admin</p>
              <p>Can manage employees, approve leaves, upload payroll, and view reports.</p>
            </div>
            <div>
              <p className="font-normal mb-1" style={{ color: 'var(--tag-label)' }}>Super Admin</p>
              <p>Full system access including admin management, settings, and all employee data.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
