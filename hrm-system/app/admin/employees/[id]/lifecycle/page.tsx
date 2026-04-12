import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import LifecycleTimeline from "@/components/lifecycle/LifecycleTimeline";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeLifecyclePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is admin or super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  // Get employee details
  const { data: employee, error } = await supabase
    .from("employees")
    .select(`
      *,
      profiles(full_name, email)
    `)
    .eq("id", id)
    .single();

  if (error || !employee) {
    notFound();
  }

  // Get lifecycle events
  const { data: events } = await supabase
    .from("lifecycle_events")
    .select(`
      *,
      added_by_profile:added_by(full_name)
    `)
    .eq("employee_id", id)
    .order("event_date", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/admin/employees/${id}`}
          className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
          style={{ color: "var(--tag-orange)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employee
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ fontSize: "2rem", lineHeight: "1.1", letterSpacing: "-0.64px" }}>
              {employee.profiles?.full_name}'s Journey
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--tag-body)" }}>
              Career timeline and milestones
            </p>
          </div>
          <Link
            href={`/admin/employees/${id}/lifecycle/add`}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </Link>
        </div>
      </div>

      <LifecycleTimeline events={events || []} />
    </div>
  );
}
