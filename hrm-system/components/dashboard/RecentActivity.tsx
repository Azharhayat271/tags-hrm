import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Clock, Calendar, FileText, TrendingUp } from "lucide-react";

interface RecentActivityProps {
  role: string;
  employeeId?: string;
}

export default async function RecentActivity({ role, employeeId }: RecentActivityProps) {
  const supabase = await createClient();
  const activities: any[] = [];

  if (role === "admin" || role === "super_admin") {
    // Get recent leave requests
    const { data: leaves } = await supabase
      .from("leave_requests")
      .select(`
        id,
        status,
        created_at,
        employees(
          id,
          profiles(id, full_name)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(5);

    leaves?.forEach((leave: any) => {
      const employee = leave.employees;
      const profile = Array.isArray(employee?.profiles)
        ? employee.profiles[0]
        : employee?.profiles;

      activities.push({
        type: "leave",
        icon: Calendar,
        title: `${profile?.full_name || "Unknown"} requested leave`,
        status: leave.status,
        date: leave.created_at,
      });
    });

    // Get recent lifecycle events
    const { data: events } = await supabase
      .from("lifecycle_events")
      .select(`
        id,
        event_type,
        created_at,
        employees(
          id,
          profiles(id, full_name)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(3);

    events?.forEach((event: any) => {
      const employee = event.employees;
      const profile = Array.isArray(employee?.profiles)
        ? employee.profiles[0]
        : employee?.profiles;

      activities.push({
        type: "lifecycle",
        icon: TrendingUp,
        title: `${profile?.full_name || "Unknown"} - ${event.event_type}`,
        status: "info",
        date: event.created_at,
      });
    });
  } else if (employeeId) {
    // Get employee's recent activities
    const { data: leaves } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(3);

    leaves?.forEach((leave) => {
      activities.push({
        type: "leave",
        icon: Calendar,
        title: `Leave request ${leave.status}`,
        status: leave.status,
        date: leave.created_at,
      });
    });

    // Get recent attendance
    const { data: attendance } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", employeeId)
      .order("date", { ascending: false })
      .limit(3);

    attendance?.forEach((record) => {
      activities.push({
        type: "attendance",
        icon: Clock,
        title: `Checked ${record.check_out ? "in and out" : "in"}`,
        status: "complete",
        date: record.date,
      });
    });

    // Get recent reviews
    const { data: reviews } = await supabase
      .from("performance_reviews")
      .select("*")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(2);

    reviews?.forEach((review) => {
      activities.push({
        type: "review",
        icon: TrendingUp,
        title: `Performance review - ${review.cycle}`,
        status: review.acknowledged_at ? "acknowledged" : "pending",
        date: review.created_at,
      });
    });
  }

  // Sort by date
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="card p-6">
      <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
        Recent Activity
      </h3>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
            No recent activity
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.slice(0, 8).map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 pb-4 border-b last:border-b-0"
                style={{ borderColor: 'var(--tag-border)' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--tag-bg-warm)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: 'var(--tag-orange)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-normal">{activity.title}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--tag-body)' }}>
                    {formatDate(activity.date)}
                  </p>
                </div>
                <span
                  className={`badge ${
                    activity.status === "approved" || activity.status === "complete" || activity.status === "acknowledged"
                      ? "badge-success"
                      : activity.status === "pending"
                      ? "badge-warning"
                      : activity.status === "rejected"
                      ? "badge-danger"
                      : "badge-neutral"
                  }`}
                >
                  {activity.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
