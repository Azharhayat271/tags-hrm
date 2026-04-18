import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { getUserPermissions } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    console.error("[ADMIN LAYOUT] Profile fetch failed:", profileError);
    redirect("/login");
  }

  // Admins/super-admins always allowed. Employees may enter /admin only if
  // they hold at least one granular permission.
  const { permissions } = await getUserPermissions(user.id);
  const isAdmin = ["admin", "super_admin"].includes(profile.role);
  if (!isAdmin && permissions.size === 0) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-surface-canvas">
      <Header profile={profile} />
      <div className="flex">
        <Sidebar profile={profile} permissions={Array.from(permissions)} />
        <main className="flex-1 min-w-0 px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
