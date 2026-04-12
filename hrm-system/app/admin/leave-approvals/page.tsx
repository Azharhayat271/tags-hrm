import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LeaveApprovalTable from "@/components/leave/LeaveApprovalTable";
import { Filter } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeaveApprovalsPage() {
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

  // Get all leave requests
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

  // Separate pending and reviewed requests
  const pendingRequests = leaveRequests?.filter(req => req.status === 'pending') || [];
  const reviewedRequests = leaveRequests?.filter(req => req.status !== 'pending') || [];

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
          Leave Approvals
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
          Review and approve employee leave requests
        </p>
      </div>

      {/* Pending Requests */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-light" style={{ letterSpacing: '-0.26px' }}>
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="badge-warning ml-2">{pendingRequests.length}</span>
            )}
          </h2>
        </div>
        
        <div className="card p-6">
          <LeaveApprovalTable 
            requests={pendingRequests}
            adminId={user?.id || ''}
            isPending={true}
          />
        </div>
      </div>

      {/* Reviewed Requests */}
      <div>
        <h2 className="text-xl font-light mb-4" style={{ letterSpacing: '-0.26px' }}>
          Reviewed Requests
        </h2>
        
        <div className="card p-6">
          <LeaveApprovalTable 
            requests={reviewedRequests}
            adminId={user?.id || ''}
            isPending={false}
          />
        </div>
      </div>
    </div>
  );
}
