import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import LeaveBalance from "@/components/leave/LeaveBalance";
import LeaveHistory from "@/components/leave/LeaveHistory";
import PublicHolidaysCard from "@/components/leave/PublicHolidaysCard";

export const dynamic = "force-dynamic";

export default async function LeavePage() {
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
          Leave Management
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Employee record not found
        </p>
      </div>
    );
  }

  // Get leave types
  const { data: leaveTypes } = await supabase
    .from("leave_types")
    .select("*")
    .order("name");

  // Get employee's leave requests
  const { data: leaveRequests } = await supabase
    .from("leave_requests")
    .select(`
      *,
      leave_types(name),
      reviewed_by_profile:reviewed_by(full_name)
    `)
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false });

  // Get public holidays
  const { data: publicHolidays } = await supabase
    .from("public_holidays")
    .select("*")
    .gte("date", new Date().toISOString().split('T')[0])
    .order("date")
    .limit(5);

  // Calculate leave balances
  const currentYear = new Date().getFullYear();
  const leaveBalances = leaveTypes?.map(type => {
    const usedDays = leaveRequests
      ?.filter(req => 
        req.leave_type_id === type.id && 
        req.status === 'approved' &&
        new Date(req.start_date).getFullYear() === currentYear
      )
      .reduce((sum, req) => sum + req.days, 0) || 0;

    return {
      ...type,
      used: usedDays,
      remaining: type.days_per_year - usedDays,
    };
  }) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
            Leave Management
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
            Manage your leave requests and view balances
          </p>
        </div>
        <Link href="/leave/apply" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Apply for Leave
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Leave Balance */}
        <div className="lg:col-span-2">
          <LeaveBalance balances={leaveBalances} />
        </div>

        {/* Public Holidays */}
        <PublicHolidaysCard holidays={publicHolidays || []} />
      </div>

      {/* Leave History */}
      <LeaveHistory requests={leaveRequests || []} />
    </div>
  );
}
