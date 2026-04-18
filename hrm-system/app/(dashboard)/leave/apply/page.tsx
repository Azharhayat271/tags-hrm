import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import ApplyLeaveForm from "@/components/leave/ApplyLeaveForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getBalances } from "@/lib/leave/balance";

export const dynamic = "force-dynamic";

export default async function ApplyLeavePage() {
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
    redirect("/leave");
  }

  // Get leave types
  const { data: leaveTypes } = await supabase
    .from("leave_types")
    .select("*")
    .order("name");

  // Get public holidays for calculation
  const { data: publicHolidays } = await supabase
    .from("public_holidays")
    .select("date")
    .order("date");

  const holidayDates = publicHolidays?.map(h => h.date) || [];

  // Balances use the admin client so the helper can read across years without RLS churn.
  const admin = await createAdminClient();
  const balances = await getBalances(admin as any, (employee as { id: string }).id);
  const balanceMap: Record<string, { remaining: number; used: number; pending: number; unlimited: boolean }> = {};
  for (const b of balances) {
    balanceMap[b.leaveTypeId] = {
      remaining: b.unlimited ? Number.POSITIVE_INFINITY : b.remaining,
      used: b.used,
      pending: b.pending,
      unlimited: b.unlimited,
    };
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/leave"
          className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
          style={{ color: "var(--accent)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leave
        </Link>
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Apply for Leave
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Submit a new leave request
        </p>
      </div>

      <div className="max-w-2xl">
        <ApplyLeaveForm
          employeeId={employee.id}
          leaveTypes={leaveTypes || []}
          holidayDates={holidayDates}
          balances={balanceMap}
        />
      </div>
    </div>
  );
}
