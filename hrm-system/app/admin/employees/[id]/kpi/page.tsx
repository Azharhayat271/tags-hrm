import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import KPIList from "@/components/kpi/KPIList";
import ReviewHistory from "@/components/kpi/ReviewHistory";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeKPIPage({ params }: PageProps) {
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

  // Get performance reviews
  const { data: reviews } = await supabase
    .from("performance_reviews")
    .select(`
      *,
      reviewed_by_profile:reviewed_by(full_name)
    `)
    .eq("employee_id", id)
    .order("created_at", { ascending: false });

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
              {employee.profiles?.full_name}'s KPIs
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--tag-body)" }}>
              Manage goals and performance reviews
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/employees/${id}/kpi/add`}
              className="btn-ghost flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add KPI
            </Link>
            <Link
              href={`/admin/employees/${id}/kpi/review`}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Conduct Review
            </Link>
          </div>
        </div>
      </div>

      {/* Current KPIs */}
      <div className="mb-8">
        <h3 className="text-xl font-light mb-4" style={{ letterSpacing: '-0.26px' }}>
          Current KPIs ({currentCycle})
        </h3>
        <KPIList kpis={kpis || []} />
      </div>

      {/* Review History */}
      <ReviewHistory reviews={reviews || []} />
    </div>
  );
}
