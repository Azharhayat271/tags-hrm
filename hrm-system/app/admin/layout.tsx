import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

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

  // Ensure user is admin or super_admin
  if (!["admin", "super_admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--tag-bg-warm)' }}>
      <Header user={user} profile={profile} />
      <div className="flex">
        <Sidebar profile={profile} />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
