import { createClient } from "@/lib/supabase/server";
import { Clock, Calendar, TrendingUp, Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge, EmptyState, cn } from "@/components/ui";

interface RecentActivityProps {
  role: string;
  employeeId?: string;
}

type ActivityStatus = "pending" | "approved" | "rejected" | "acknowledged" | "complete" | "info";

interface Activity {
  icon: LucideIcon;
  title: string;
  status: ActivityStatus;
  date: string;
}

const statusVariant: Record<ActivityStatus, Parameters<typeof Badge>[0]["variant"]> = {
  approved: "success",
  acknowledged: "success",
  complete: "success",
  pending: "warning",
  rejected: "danger",
  info: "neutral",
};

const statusLabel: Record<ActivityStatus, string> = {
  approved: "Approved",
  acknowledged: "Acknowledged",
  complete: "Complete",
  pending: "Pending",
  rejected: "Rejected",
  info: "Event",
};

function formatRelative(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function RecentActivity({ role, employeeId }: RecentActivityProps) {
  const supabase = await createClient();
  const activities: Activity[] = [];

  if (role === "admin" || role === "super_admin") {
    const { data: leaves } = await supabase
      .from("leave_requests")
      .select(`id, status, created_at, employees(id, profiles(id, full_name))`)
      .order("created_at", { ascending: false })
      .limit(5);

    leaves?.forEach((leave: any) => {
      const employee = leave.employees;
      const profile = Array.isArray(employee?.profiles) ? employee.profiles[0] : employee?.profiles;
      activities.push({
        icon: Calendar,
        title: `${profile?.full_name || "Someone"} requested leave`,
        status: leave.status as ActivityStatus,
        date: leave.created_at,
      });
    });

    const { data: events } = await supabase
      .from("lifecycle_events")
      .select(`id, event_type, created_at, employees(id, profiles(id, full_name))`)
      .order("created_at", { ascending: false })
      .limit(3);

    events?.forEach((event: any) => {
      const employee = event.employees;
      const profile = Array.isArray(employee?.profiles) ? employee.profiles[0] : employee?.profiles;
      activities.push({
        icon: TrendingUp,
        title: `${profile?.full_name || "Someone"} · ${event.event_type}`,
        status: "info",
        date: event.created_at,
      });
    });
  } else if (employeeId) {
    const { data: leaves } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(3);

    leaves?.forEach((leave) => {
      activities.push({
        icon: Calendar,
        title: `Leave request ${leave.status}`,
        status: leave.status as ActivityStatus,
        date: leave.created_at,
      });
    });

    const { data: attendance } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", employeeId)
      .order("date", { ascending: false })
      .limit(3);

    attendance?.forEach((record) => {
      activities.push({
        icon: Clock,
        title: `Checked ${record.check_out ? "in and out" : "in"}`,
        status: "complete",
        date: record.date,
      });
    });

    const { data: reviews } = await supabase
      .from("performance_reviews")
      .select("*")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(2);

    reviews?.forEach((review) => {
      activities.push({
        icon: TrendingUp,
        title: `Performance review · ${review.cycle}`,
        status: review.acknowledged_at ? "acknowledged" : "pending",
        date: review.created_at,
      });
    });
  }

  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const visible = activities.slice(0, 8);

  return (
    <div className="rounded-md border border-line-subtle bg-surface-raised shadow-e1 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-line-subtle flex items-center justify-between">
        <div>
          <span className="eyebrow">Timeline</span>
          <h3 className="text-[15px] font-normal text-ink-primary mt-0.5">Recent activity</h3>
        </div>
        <span className="text-[11px] text-ink-quaternary font-mono tabular-nums">
          {visible.length} {visible.length === 1 ? "event" : "events"}
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<Inbox className="w-5 h-5" />}
            title="Nothing recent yet"
            description="Activity will appear here as you use the system."
            compact
          />
        </div>
      ) : (
        <ol className="relative">
          {visible.map((activity, index) => {
            const Icon = activity.icon;
            const isLast = index === visible.length - 1;
            return (
              <li
                key={index}
                className={cn(
                  "relative flex items-start gap-3 px-5 py-3",
                  !isLast && "border-b border-line-subtle",
                )}
              >
                {/* Vertical connector */}
                {!isLast && (
                  <span
                    aria-hidden
                    className="absolute left-[32px] top-11 bottom-0 w-px bg-line-subtle"
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 inline-flex items-center justify-center w-7 h-7 rounded-sm shrink-0",
                    "bg-surface-sunken border border-line-subtle text-ink-tertiary",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-ink-primary leading-tight">{activity.title}</p>
                  <p className="text-[11px] text-ink-tertiary font-mono tabular-nums mt-0.5">
                    {formatRelative(activity.date)}
                  </p>
                </div>
                <Badge variant={statusVariant[activity.status]} size="sm" dot>
                  {statusLabel[activity.status]}
                </Badge>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
