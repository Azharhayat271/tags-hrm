import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import AddLifecycleEventForm from "@/components/lifecycle/AddLifecycleEventForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AddLifecycleEventPage({ params }: PageProps) {
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

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/admin/employees/${id}/lifecycle`}
          className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
          style={{ color: "var(--tag-orange)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Timeline
        </Link>
        <h1 style={{ fontSize: "2rem", lineHeight: "1.1", letterSpacing: "-0.64px" }}>
          Add Lifecycle Event
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--tag-body)" }}>
          Record a milestone for {employee.profiles?.full_name}
        </p>
      </div>

      <div className="max-w-2xl">
        <AddLifecycleEventForm 
          employeeId={id}
          adminId={user?.id || ''}
        />
      </div>
    </div>
  );
}
