import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EmployeePermissionsForm from "@/components/employees/EmployeePermissionsForm";
import { PERMISSIONS, PERMISSION_KEYS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeePermissionsPage({ params }: PageProps) {
  const { id: employeeId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  if (
    !actorProfile ||
    !["admin", "super_admin"].includes(actorProfile.role)
  ) {
    redirect("/dashboard");
  }

  // Load employee + their profile
  const { data: employee, error } = await supabase
    .from("employees")
    .select(
      `
      id,
      profile_id,
      profiles!inner(id, full_name, email, role),
      designation:designations(name)
    `
    )
    .eq("id", employeeId)
    .single();

  if (error || !employee) {
    notFound();
  }

  const profile = Array.isArray(employee.profiles)
    ? employee.profiles[0]
    : employee.profiles;

  if (!profile) {
    notFound();
  }

  const designation = Array.isArray(employee.designation)
    ? employee.designation[0]
    : employee.designation;

  // Load current grants
  const { data: grantRows } = await supabase
    .from("user_permissions")
    .select("permission_key")
    .eq("user_id", profile.id)
    .is("revoked_at", null);

  const granted = (grantRows ?? [])
    .map((r: any) => r.permission_key as string)
    .filter((k: string) => PERMISSION_KEYS.includes(k as (typeof PERMISSION_KEYS)[number]));

  const isTargetAdmin = profile.role === "admin" || profile.role === "super_admin";

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/admin/employees/${employeeId}`}
          className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
          style={{ color: "var(--accent)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to employee
        </Link>
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Access permissions
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          {profile.full_name}
          {designation?.name ? ` · ${designation.name}` : ""}
          {" · "}
          {profile.email}
        </p>
      </div>

      {isTargetAdmin ? (
        <div className="max-w-2xl rounded-md border border-line-subtle bg-surface-raised p-5">
          <p className="text-sm text-ink-secondary">
            This user is an{" "}
            <span className="font-medium text-ink-primary">{profile.role}</span>{" "}
            and already has full access. Granular permissions only apply to
            regular employees.
          </p>
        </div>
      ) : (
        <div className="max-w-3xl">
          <EmployeePermissionsForm
            targetUserId={profile.id}
            definitions={PERMISSIONS}
            initialGranted={granted}
          />
        </div>
      )}
    </div>
  );
}
