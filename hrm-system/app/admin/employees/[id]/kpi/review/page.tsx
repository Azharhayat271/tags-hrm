import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ConductReviewForm from "@/components/kpi/ConductReviewForm";
import { requirePagePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConductReviewPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requirePagePermission("kpi.review");
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

  // Get current cycle
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
  const currentCycle = `Q${currentQuarter} ${currentYear}`;

  // Get KPIs for current cycle
  const { data: kpis } = await supabase
    .from("kpis")
    .select("*")
    .eq("employee_id", id)
    .eq("cycle", currentCycle)
    .order("created_at", { ascending: true });

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/admin/employees/${id}/kpi`}
          className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
          style={{ color: "var(--accent)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to KPIs
        </Link>
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Conduct Performance Review
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Review {employee.profiles?.full_name}'s performance for {currentCycle}
        </p>
      </div>

      <div className="max-w-3xl">
        <ConductReviewForm 
          employeeId={id}
          adminId={ctx.userId}
          kpis={kpis || []}
          defaultCycle={currentCycle}
        />
      </div>
    </div>
  );
}
