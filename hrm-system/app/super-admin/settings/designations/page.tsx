import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DesignationsManager from "@/components/settings/DesignationsManager";

export const dynamic = "force-dynamic";

export default async function DesignationsPage() {
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
          <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
            Job Designations
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
            Configure job titles used when creating employees
          </p>
        </div>
      </div>

      <div className="card p-8">
        <DesignationsManager />
      </div>
    </div>
  );
}
