import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LeaveApprovalTable from "@/components/leave/LeaveApprovalTable";
import { requirePagePermission } from "@/lib/permissions";
import { isPendingStatus } from "@/lib/leave/balance";

export const dynamic = "force-dynamic";

const PENDING_HR_STATUSES = ["pending", "pending_hr"];

export default async function LeaveApprovalsPage() {
  const ctx = await requirePagePermission("leave.approve");
  if (!ctx) redirect("/dashboard");
  const supabase = await createClient();

  const { data: leaveRequests } = await supabase
    .from("leave_requests")
    .select(`
      *,
      employee:employees(
        id,
        profiles(full_name, email)
      ),
      leave_types(name),
      reviewed_by_profile:reviewed_by(full_name)
    `)
    .order("created_at", { ascending: false });

  const all = leaveRequests || [];
  // HR only acts on pending_hr/pending. pending_manager still sits with the manager.
  const pendingForHr = all.filter((r: any) => PENDING_HR_STATUSES.includes(r.status));
  const awaitingManager = all.filter((r: any) => r.status === "pending_manager");
  const reviewed = all.filter((r: any) => !isPendingStatus(r.status));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Leave Approvals
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Final HR sign-off. Manager approval happens first for employees with a direct manager.
        </p>
      </div>

      {/* Pending HR approval — actionable */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-light" style={{ letterSpacing: '-0.26px' }}>
            Pending HR approval
            {pendingForHr.length > 0 && (
              <span className="badge-warning ml-2">{pendingForHr.length}</span>
            )}
          </h2>
        </div>

        <div className="card p-6">
          <LeaveApprovalTable
            requests={pendingForHr}
            adminId={ctx.userId}
            isPending={true}
          />
        </div>
      </div>

      {/* Awaiting manager — visibility only */}
      {awaitingManager.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-light mb-4" style={{ letterSpacing: '-0.26px' }}>
            Awaiting manager approval
            <span className="badge-warning ml-2">{awaitingManager.length}</span>
          </h2>

          <div className="card p-6">
            <LeaveApprovalTable
              requests={awaitingManager}
              adminId={ctx.userId}
              isPending={false}
            />
          </div>
        </div>
      )}

      {/* Reviewed Requests */}
      <div>
        <h2 className="text-xl font-light mb-4" style={{ letterSpacing: '-0.26px' }}>
          Reviewed Requests
        </h2>

        <div className="card p-6">
          <LeaveApprovalTable
            requests={reviewed}
            adminId={ctx.userId}
            isPending={false}
          />
        </div>
      </div>
    </div>
  );
}
