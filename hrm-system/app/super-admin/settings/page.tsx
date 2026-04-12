import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Briefcase, Settings as SettingsIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Get counts
  const { count: leaveTypesCount } = await supabase
    .from("leave_types")
    .select("*", { count: 'exact', head: true });

  const { count: holidaysCount } = await supabase
    .from("public_holidays")
    .select("*", { count: 'exact', head: true });

  const { count: designationsCount } = await supabase
    .from("designations")
    .select("*", { count: 'exact', head: true });

  const { count: departmentsCount } = await supabase
    .from("departments")
    .select("*", { count: 'exact', head: true });

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
          System Settings
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
          Configure system-wide settings and policies
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Leave Types */}
        <Link href="/super-admin/settings/leave-types" className="card p-6 hover:shadow-tag-elevated-hover transition-shadow">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded" style={{ backgroundColor: 'rgba(249,115,22,0.1)' }}>
              <Briefcase className="w-6 h-6" style={{ color: 'var(--tag-orange)' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-light mb-1" style={{ letterSpacing: '-0.22px' }}>
                Leave Types
              </h3>
              <p className="text-sm mb-3" style={{ color: 'var(--tag-body)' }}>
                Configure available leave types and annual allowances
              </p>
              <div className="flex items-center gap-2">
                <span className="badge-orange">{leaveTypesCount || 0} types</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Public Holidays */}
        <Link href="/super-admin/settings/holidays" className="card p-6 hover:shadow-tag-elevated-hover transition-shadow">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded" style={{ backgroundColor: 'rgba(249,115,22,0.1)' }}>
              <Calendar className="w-6 h-6" style={{ color: 'var(--tag-orange)' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-light mb-1" style={{ letterSpacing: '-0.22px' }}>
                Public Holidays
              </h3>
              <p className="text-sm mb-3" style={{ color: 'var(--tag-body)' }}>
                Manage public holidays calendar
              </p>
              <div className="flex items-center gap-2">
                <span className="badge-orange">{holidaysCount || 0} holidays</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Designations (Job Titles) */}
        <Link href="/super-admin/settings/designations" className="card p-6 hover:shadow-tag-elevated-hover transition-shadow">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded" style={{ backgroundColor: 'rgba(249,115,22,0.1)' }}>
              <Briefcase className="w-6 h-6" style={{ color: 'var(--tag-orange)' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-light mb-1" style={{ letterSpacing: '-0.22px' }}>
                Job Designations
              </h3>
              <p className="text-sm mb-3" style={{ color: 'var(--tag-body)' }}>
                Configure job titles and roles
              </p>
              <div className="flex items-center gap-2">
                <span className="badge-orange">{designationsCount || 0} designations</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Departments */}
        <Link href="/super-admin/settings/departments" className="card p-6 hover:shadow-tag-elevated-hover transition-shadow">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded" style={{ backgroundColor: 'rgba(249,115,22,0.1)' }}>
              <Briefcase className="w-6 h-6" style={{ color: 'var(--tag-orange)' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-light mb-1" style={{ letterSpacing: '-0.22px' }}>
                Departments
              </h3>
              <p className="text-sm mb-3" style={{ color: 'var(--tag-body)' }}>
                Manage company departments
              </p>
              <div className="flex items-center gap-2">
                <span className="badge-orange">{departmentsCount || 0} departments</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Company Settings - Placeholder */}
        <div className="card p-6" style={{ opacity: 0.6 }}>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded" style={{ backgroundColor: 'rgba(107,114,128,0.1)' }}>
              <SettingsIcon className="w-6 h-6" style={{ color: 'var(--tag-body)' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-light mb-1" style={{ letterSpacing: '-0.22px' }}>
                Company Settings
              </h3>
              <p className="text-sm mb-3" style={{ color: 'var(--tag-body)' }}>
                Coming in Phase 8
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
