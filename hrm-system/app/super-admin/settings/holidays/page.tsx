import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PublicHolidaysManager from "@/components/settings/PublicHolidaysManager";

export const dynamic = "force-dynamic";

export default async function PublicHolidaysManagementPage() {
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

  // Get all public holidays
  const { data: holidays } = await supabase
    .from("public_holidays")
    .select("*")
    .order("date");

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/super-admin/settings"
          className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
          style={{ color: "var(--accent)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Public Holidays
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Manage public holidays calendar
        </p>
      </div>

      <PublicHolidaysManager holidays={holidays || []} />
    </div>
  );
}
