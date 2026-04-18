import { createClient } from "@/lib/supabase/server";
import { Calendar, Gift, CalendarCheck, CalendarX2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EmptyState, cn } from "@/components/ui";

interface UpcomingEventsProps {
  role: string;
  employeeId?: string;
}

type EventKind = "holiday" | "leave";

interface Evt {
  kind: EventKind;
  icon: LucideIcon;
  title: string;
  sub?: string;
  date: string;
}

export default async function UpcomingEvents({ employeeId }: UpcomingEventsProps) {
  const supabase = await createClient();
  const events: Evt[] = [];

  const today = new Date().toISOString().split("T")[0];

  const { data: holidays } = await supabase
    .from("public_holidays")
    .select("*")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(3);

  holidays?.forEach((holiday) => {
    events.push({
      kind: "holiday",
      icon: Gift,
      title: holiday.name,
      sub: "Public holiday",
      date: holiday.date,
    });
  });

  if (employeeId) {
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
        kind: "leave",
        icon: CalendarCheck,
        title: leave.leave_type?.name || "Leave",
        sub: `${leave.days} day${leave.days > 1 ? "s" : ""} approved`,
        date: leave.start_date,
      });
    });
  }

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const visible = events.slice(0, 5);

  return (
    <div className="rounded-md border border-line-subtle bg-surface-raised shadow-e1 overflow-hidden h-full flex flex-col">
      <div className="px-5 py-3.5 border-b border-line-subtle flex items-center justify-between">
        <div>
          <span className="eyebrow">Calendar</span>
          <h3 className="text-[15px] font-normal text-ink-primary mt-0.5">Upcoming</h3>
        </div>
        <span className="text-[11px] text-ink-quaternary font-mono tabular-nums">
          {visible.length} {visible.length === 1 ? "event" : "events"}
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="p-5 flex-1">
          <EmptyState
            icon={<CalendarX2 className="w-5 h-5" />}
            title="No upcoming events"
            description="Holidays and approved leaves will show up here."
            compact
          />
        </div>
      ) : (
        <ul>
          {visible.map((event, index) => {
            const Icon = event.icon;
            const evtDate = new Date(event.date);
            const daysUntil = Math.ceil(
              (evtDate.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000,
            );
            const chip = daysUntilChip(daysUntil);
            const isLast = index === visible.length - 1;

            return (
              <li
                key={index}
                className={cn(
                  "flex items-center gap-3 px-5 py-3",
                  !isLast && "border-b border-line-subtle",
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-9 h-9 rounded-sm shrink-0 border",
                    event.kind === "holiday"
                      ? "bg-[var(--success-tint)] text-[var(--success-text)] border-[var(--success-border)]"
                      : "bg-[var(--accent-tint)] text-[var(--accent-deep)] border-[var(--accent-wash)]",
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-ink-primary truncate">{event.title}</p>
                  <p className="text-[11px] text-ink-tertiary font-mono tabular-nums mt-0.5">
                    {evtDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    {event.sub && (
                      <>
                        <span className="text-ink-quaternary"> · </span>
                        {event.sub}
                      </>
                    )}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-[60px] px-2 py-1 rounded-sm border text-[11px] font-mono tabular-nums font-medium",
                    chip.className,
                  )}
                >
                  {chip.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {visible.length > 0 && (
        <div className="mt-auto px-5 py-2.5 border-t border-line-subtle bg-surface-muted">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-tertiary">
            <Calendar className="w-3 h-3" />
            Next event in{" "}
            <span className="text-ink-secondary font-mono tabular-nums">
              {Math.max(0, Math.ceil((new Date(visible[0].date).getTime() - Date.now()) / 86400000))}d
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

function daysUntilChip(days: number): { label: string; className: string } {
  if (days <= 0) {
    return {
      label: "Today",
      className: "bg-[var(--danger-tint)] text-[var(--danger-text)] border-[var(--danger-border)]",
    };
  }
  if (days === 1) {
    return {
      label: "Tomorrow",
      className: "bg-[var(--warning-tint)] text-[var(--warning-text)] border-[var(--warning-border)]",
    };
  }
  if (days <= 7) {
    return {
      label: `in ${days}d`,
      className: "bg-[var(--accent-tint)] text-[var(--accent-deep)] border-[var(--accent-wash)]",
    };
  }
  return {
    label: `in ${days}d`,
    className: "bg-surface-sunken text-ink-tertiary border-line-subtle",
  };
}
