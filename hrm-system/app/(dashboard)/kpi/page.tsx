import { createClient } from "@/lib/supabase/server";
import { Target, TrendingUp, Award } from "lucide-react";
import KPIList from "@/components/kpi/KPIList";
import ReviewHistory from "@/components/kpi/ReviewHistory";

export const dynamic = "force-dynamic";

export default async function KPIPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get employee record
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("profile_id", user?.id)
    .single();

  if (!employee) {
    return (
      <div>
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          KPI & Performance
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Employee record not found
        </p>
      </div>
    );
  }

  // Get current cycle (e.g., "Q1 2025")
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
  const currentCycle = `Q${currentQuarter} ${currentYear}`;

  // Get active KPIs for current cycle
  const { data: kpis } = await supabase
    .from("kpis")
    .select("*")
    .eq("employee_id", employee.id)
    .eq("cycle", currentCycle)
    .order("created_at", { ascending: true });

  // Calculate overall progress
  const totalWeight = kpis?.reduce((sum, kpi) => sum + (kpi.weight || 1), 0) || 0;
  const weightedProgress = kpis?.reduce((sum, kpi) => {
    const weight = kpi.weight || 1;
    const progress = kpi.progress || 0;
    return sum + (progress * weight);
  }, 0) || 0;
  const overallProgress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

  // Get performance reviews
  const { data: reviews } = await supabase
    .from("performance_reviews")
    .select(`
      *,
      reviewed_by_profile:reviewed_by(full_name)
    `)
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          KPI & Performance
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Track your goals and performance reviews
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-start gap-3 mb-3">
            <Target className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <div className="flex-1">
              <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                Active KPIs
              </p>
              <p className="text-2xl font-light tabular-nums">{kpis?.length || 0}</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {currentCycle}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-start gap-3 mb-3">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--tag-success)' }} />
            <div className="flex-1">
              <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                Overall Progress
              </p>
              <p className="text-2xl font-light tabular-nums">{overallProgress}%</p>
            </div>
          </div>
          <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--tag-border)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${overallProgress}%`,
                background: 'linear-gradient(90deg, var(--tag-orange), var(--tag-amber))',
              }}
            />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start gap-3 mb-3">
            <Award className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <div className="flex-1">
              <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                Reviews
              </p>
              <p className="text-2xl font-light tabular-nums">{reviews?.length || 0}</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Total completed
          </p>
        </div>
      </div>

      {/* Active KPIs */}
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
