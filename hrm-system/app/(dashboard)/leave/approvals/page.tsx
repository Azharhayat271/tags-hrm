import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LeaveApprovalTable from "@/components/leave/LeaveApprovalTable";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TeamApprovalsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("employees")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!me) {
    redirect("/leave");
  }

  const managerId = (me as { id: string }).id;

  const { data: reports } = await supabase
    .from("employees")
    .select("id")
    .eq("reports_to", managerId);

  const reportIds = (reports || []).map((r: any) => r.id);

  let pending: any[] = [];
  let recent: any[] = [];

  if (reportIds.length > 0) {
    const { data: requests } = await supabase
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
      .in("employee_id", reportIds)
      .order("created_at", { ascending: false });

    const all = requests || [];
    pending = all.filter((r: any) => r.status === "pending_manager");
    recent = all.filter((r: any) => r.status !== "pending_manager").slice(0, 20);
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
          Team Approvals
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Approve or reject leave requests from your direct reports. After you approve, HR gives the final sign-off.
        </p>
      </div>

      {reportIds.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            No one reports to you directly.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-light mb-4" style={{ letterSpacing: "-0.26px" }}>
              Awaiting your approval
              {pending.length > 0 && (
                <span className="badge-warning ml-2">{pending.length}</span>
              )}
            </h2>
            <div className="card p-6">
              <LeaveApprovalTable
                requests={pending}
                adminId={user.id}
                isPending={true}
              />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-light mb-4" style={{ letterSpacing: "-0.26px" }}>
              Recent team activity
            </h2>
            <div className="card p-6">
              <LeaveApprovalTable
                requests={recent}
                adminId={user.id}
                isPending={false}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
