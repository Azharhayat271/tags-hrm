import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DepartmentsManager from "@/components/settings/DepartmentsManager";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
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

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Link href="/super-admin/settings" className="hover:opacity-70 transition-opacity">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
            Departments
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
            Configure company departments used when creating employees
          </p>
        </div>
      </div>

      <div className="card p-8">
        <DepartmentsManager />
      </div>
    </div>
  );
}
