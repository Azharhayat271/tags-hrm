import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import AddLifecycleEventForm from "@/components/lifecycle/AddLifecycleEventForm";
import { requirePagePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AddLifecycleEventPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requirePagePermission("employees.manage");
  if (!ctx) redirect("/dashboard");
  const supabase = await createClient();

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
          style={{ color: "var(--accent)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Timeline
        </Link>
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Add Lifecycle Event
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Record a milestone for {employee.profiles?.full_name}
        </p>
      </div>

      <div className="max-w-2xl">
        <AddLifecycleEventForm 
          employeeId={id}
          adminId={ctx.userId}
        />
      </div>
    </div>
  );
}
