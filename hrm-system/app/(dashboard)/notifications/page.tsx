import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Bell, CheckCircle, AlertCircle, Info } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get employee record
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  // Build notifications from various sources
  const notifications: any[] = [];

  if (employee) {
    // Leave request updates
    const { data: leaves } = await supabase
      .from("leave_requests")
      .select(`
        *,
        leave_type:leave_types(name),
        reviewer:reviewed_by(full_name)
      `)
      .eq("employee_id", employee.id)
      .in("status", ["approved", "rejected"])
      .order("updated_at", { ascending: false })
      .limit(10);

    leaves?.forEach((leave) => {
      notifications.push({
        type: leave.status === "approved" ? "success" : "error",
        icon: leave.status === "approved" ? CheckCircle : AlertCircle,
        title: `Leave Request ${leave.status === "approved" ? "Approved" : "Rejected"}`,
        message: `Your ${leave.leave_type?.name} request for ${leave.days} day(s) has been ${leave.status}${leave.review_note ? `: ${leave.review_note}` : ""}`,
        date: leave.updated_at,
      });
    });

    // Performance reviews
    const { data: reviews } = await supabase
      .from("performance_reviews")
      .select(`
        *,
        reviewer:reviewed_by(full_name)
      `)
      .eq("employee_id", employee.id)
      .is("acknowledged_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

    reviews?.forEach((review) => {
      notifications.push({
        type: "info",
        icon: Info,
        title: "New Performance Review",
        message: `Your ${review.cycle} performance review is ready. Please review and acknowledge.`,
        date: review.created_at,
      });
    });

    // Lifecycle events
    const { data: events } = await supabase
      .from("lifecycle_events")
      .select("*")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false })
      .limit(5);

    events?.forEach((event) => {
      notifications.push({
        type: "info",
        icon: Info,
        title: "Lifecycle Event Added",
        message: `${event.event_type}: ${event.description || "No description"}`,
        date: event.created_at,
      });
    });
  }

  // Manager: requests from direct reports awaiting their approval
  if (employee) {
    const { data: directReports } = await supabase
      .from("employees")
      .select("id")
      .eq("reports_to", employee.id);
    const reportIds = (directReports || []).map((r: any) => r.id);

    if (reportIds.length > 0) {
      const { data: teamPending } = await supabase
        .from("leave_requests")
        .select(`
          *,
          employee:employees(profile:profiles(full_name)),
          leave_type:leave_types(name)
        `)
        .eq("status", "pending_manager")
        .in("employee_id", reportIds)
        .order("created_at", { ascending: false })
        .limit(10);

      teamPending?.forEach((leave) => {
        notifications.push({
          type: "warning",
          icon: AlertCircle,
          title: "Approval needed",
          message: `${leave.employee?.profile?.full_name} requested ${leave.leave_type?.name} for ${leave.days} day(s) — awaiting your approval`,
          date: leave.created_at,
        });
      });
    }
  }

  // HR/admin notifications: final sign-off queue
  if (profile?.role === "admin" || profile?.role === "super_admin") {
    const { data: pendingLeaves } = await supabase
      .from("leave_requests")
      .select(`
        *,
        employee:employees(profile:profiles(full_name)),
        leave_type:leave_types(name)
      `)
      .in("status", ["pending", "pending_hr"])
      .order("created_at", { ascending: false })
      .limit(10);

    pendingLeaves?.forEach((leave) => {
      notifications.push({
        type: "warning",
        icon: AlertCircle,
        title: "Pending HR approval",
        message: `${leave.employee?.profile?.full_name} requested ${leave.leave_type?.name} for ${leave.days} day(s)`,
        date: leave.created_at,
      });
    });
  }

  // Sort by date
  notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Notifications
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Stay updated with your latest activities
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            No notifications yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification, index) => {
            const Icon = notification.icon;
            return (
              <div
                key={index}
                className="card p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor:
                        notification.type === "success"
                          ? "var(--tag-success-bg)"
                          : notification.type === "error"
                          ? "var(--tag-danger-bg)"
                          : notification.type === "warning"
                          ? "var(--tag-warning-bg)"
                          : "rgba(249,115,22,0.1)",
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{
                        color:
                          notification.type === "success"
                            ? "var(--tag-success)"
                            : notification.type === "error"
                            ? "var(--tag-danger)"
                            : notification.type === "warning"
                            ? "var(--tag-warning)"
                            : "var(--tag-orange)",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-normal mb-1">{notification.title}</h3>
                    <p className="text-sm mb-2" style={{ color: "var(--text-tertiary)" }}>
                      {notification.message}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {formatDate(notification.date)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
