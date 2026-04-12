import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import LifecycleTimeline from "@/components/lifecycle/LifecycleTimeline";
import { Briefcase } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LifecyclePage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get employee record
  const { data: employee } = await supabase
    .from("employees")
    .select("id, joining_date, designation, department")
    .eq("profile_id", user?.id)
    .single();

  if (!employee) {
    return (
      <div>
        <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
          My Journey
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
          Employee record not found
        </p>
      </div>
    );
  }

  // Get lifecycle events
  const { data: events } = await supabase
    .from("lifecycle_events")
    .select(`
      *,
      added_by_profile:added_by(full_name)
    `)
    .eq("employee_id", employee.id)
    .order("event_date", { ascending: false });

  // Calculate tenure
  const joiningDate = employee.joining_date ? new Date(employee.joining_date) : null;
  const today = new Date();
  let tenure = "";
  
  if (joiningDate) {
    const years = today.getFullYear() - joiningDate.getFullYear();
    const months = today.getMonth() - joiningDate.getMonth();
    const totalMonths = years * 12 + months;
    const displayYears = Math.floor(totalMonths / 12);
    const displayMonths = totalMonths % 12;
    
    if (displayYears === 0) {
      tenure = `${displayMonths} month${displayMonths !== 1 ? 's' : ''}`;
    } else if (displayMonths === 0) {
      tenure = `${displayYears} year${displayYears !== 1 ? 's' : ''}`;
    } else {
      tenure = `${displayYears} year${displayYears !== 1 ? 's' : ''}, ${displayMonths} month${displayMonths !== 1 ? 's' : ''}`;
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
          My Journey
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
          Your career timeline at TAG Solutions
        </p>
      </div>

      {/* Summary Card */}
      <div className="card p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded" style={{ backgroundColor: 'rgba(249,115,22,0.1)' }}>
            <Briefcase className="w-8 h-8" style={{ color: 'var(--tag-orange)' }} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-light mb-1">{employee.designation || "Employee"}</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--tag-body)' }}>
              {employee.department || "—"}
            </p>
            <div className="flex items-center gap-6">
              {joiningDate && (
                <div>
                  <p className="text-xs" style={{ color: 'var(--tag-label)' }}>Joined</p>
                  <p className="text-sm font-normal">{formatDate(joiningDate)}</p>
                </div>
              )}
              {tenure && (
                <div>
                  <p className="text-xs" style={{ color: 'var(--tag-label)' }}>Tenure</p>
                  <p className="text-sm font-normal">{tenure}</p>
                </div>
              )}
              <div>
                <p className="text-xs" style={{ color: 'var(--tag-label)' }}>Milestones</p>
                <p className="text-sm font-normal tabular-nums">{events?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <LifecycleTimeline events={events || []} />
    </div>
  );
}
