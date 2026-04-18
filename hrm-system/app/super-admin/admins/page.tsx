import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shield, UserPlus } from "lucide-react";
import AdminsTable from "@/components/admins/AdminsTable";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
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

  // Get all admin users
  const { data: admins } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      phone,
      role,
      created_at
    `)
    .in("role", ["admin", "super_admin"])
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
            Admin Management
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
            Manage admin accounts and their permissions
          </p>
        </div>
        <Link href="/super-admin/admins/new" className="btn-primary inline-flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add Admin
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                Total Admins
              </p>
              <p className="text-2xl font-light tabular-nums">
                {admins?.filter(a => a.role === 'admin').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5" style={{ color: 'var(--tag-amber)' }} />
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                Super Admins
              </p>
              <p className="text-2xl font-light tabular-nums">
                {admins?.filter(a => a.role === 'super_admin').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5" style={{ color: 'var(--tag-success)' }} />
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                Total Users
              </p>
              <p className="text-2xl font-light tabular-nums">
                {admins?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admins Table */}
      <AdminsTable admins={admins || []} />
    </div>
  );
}
