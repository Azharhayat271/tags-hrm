import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import LeaveTypesManager from "@/components/settings/LeaveTypesManager";

export const dynamic = "force-dynamic";

export default async function LeaveTypesPage() {
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

  // Get all leave types
  const { data: leaveTypes } = await supabase
    .from("leave_types")
    .select("*")
    .order("name");

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/super-admin/settings"
          className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
          style={{ color: "var(--tag-orange)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>
        <h1 style={{ fontSize: "2rem", lineHeight: "1.1", letterSpacing: "-0.64px" }}>
          Leave Types
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--tag-body)" }}>
          Configure available leave types and annual allowances
        </p>
      </div>

      <LeaveTypesManager leaveTypes={leaveTypes || []} />
    </div>
  );
}
