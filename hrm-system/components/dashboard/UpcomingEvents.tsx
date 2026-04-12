import { createClient } from "@/lib/supabase/server";
import { Calendar, Gift } from "lucide-react";

interface UpcomingEventsProps {
  role: string;
  employeeId?: string;
}

export default async function UpcomingEvents({ role, employeeId }: UpcomingEventsProps) {
  const supabase = await createClient();
  const events: any[] = [];

  // Get upcoming public holidays
  const today = new Date().toISOString().split("T")[0];
  const { data: holidays } = await supabase
    .from("public_holidays")
    .select("*")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(3);

  holidays?.forEach((holiday) => {
    events.push({
      type: "holiday",
      icon: Gift,
      title: holiday.name,
      date: holiday.date,
      color: "var(--tag-success)",
    });
  });

  if (employeeId) {
    // Get upcoming approved leaves
    const { data: leaves } = await supabase
      .from("leave_requests")
      .select("*, leave_type:leave_types(name)")
      .eq("employee_id", employeeId)
      .eq("status", "approved")
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(3);

    leaves?.forEach((leave) => {
      events.push({
        type: "leave",
        icon: Calendar,
        title: `${leave.leave_type?.name} - ${leave.days} day${leave.days > 1 ? "s" : ""}`,
        date: leave.start_date,
        color: "var(--tag-orange)",
      });
    });
  }

  // Sort by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="card p-6">
      <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
        Upcoming Events
      </h3>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
            No upcoming events
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.slice(0, 5).map((event, index) => {
            const Icon = event.icon;
            const eventDate = new Date(event.date);
            const daysUntil = Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

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
                  <Icon className="w-4 h-4" style={{ color: event.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-normal">{event.title}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--tag-body)' }}>
                    {eventDate.toLocaleDateString("en-US", { 
                      month: "short", 
                      day: "numeric",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <span className="text-xs tabular-nums" style={{ color: 'var(--tag-label)' }}>
                  {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
