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
          style={{ color: "var(--accent)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employee
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
              {employee.profiles?.full_name}'s Journey
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
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
