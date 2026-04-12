"use client";

import { formatDate } from "@/lib/utils";
import {
  UserPlus,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Shuffle,
  Briefcase,
  Star,
  AlertTriangle,
  FileText,
  UserMinus,
  MessageSquare,
  CheckSquare,
} from "lucide-react";

interface LifecycleEvent {
  id: string;
  event_type: string;
  event_date: string;
  description: string | null;
  metadata: any;
  added_by_profile: {
    full_name: string;
  } | null;
  created_at: string;
}

interface LifecycleTimelineProps {
  events: LifecycleEvent[];
}

export default function LifecycleTimeline({ events }: LifecycleTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="card p-6">
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
            No lifecycle events recorded yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-light mb-6" style={{ letterSpacing: '-0.22px' }}>
        Timeline
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div
          className="absolute left-6 top-0 bottom-0 w-0.5"
          style={{ backgroundColor: 'var(--tag-border)' }}
        />

        {/* Events */}
        <div className="space-y-6">
          {events.map((event, index) => {
            const config = getEventConfig(event.event_type);
            const Icon = config.icon;

            return (
              <div key={event.id} className="relative pl-16">
                {/* Icon */}
                <div
                  className="absolute left-0 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: config.bgColor }}
                >
                  <Icon className="w-6 h-6" style={{ color: config.color }} />
                </div>

                {/* Content */}
                <div
                  className="p-4 rounded border"
                  style={{
                    borderColor: config.borderColor,
                    backgroundColor: config.lightBg,
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-base font-normal mb-1">{config.title}</h4>
                      <p className="text-xs tabular-nums" style={{ color: 'var(--tag-label)' }}>
                        {formatDate(event.event_date)}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: config.bgColor,
                        color: config.color,
                      }}
                    >
                      {config.category}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-sm mb-3" style={{ color: 'var(--tag-body)' }}>
                      {event.description}
                    </p>
                  )}

                  {/* Metadata */}
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="mb-3 p-3 rounded" style={{ backgroundColor: 'var(--tag-bg-warm)' }}>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-xs" style={{ color: 'var(--tag-label)' }}>
                              {formatMetadataKey(key)}:
                            </span>
                            <span className="ml-2" style={{ color: 'var(--tag-body)' }}>
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--tag-label)' }}>
                    <span>Added by {event.added_by_profile?.full_name || "System"}</span>
                    <span className="tabular-nums">{formatDate(event.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getEventConfig(eventType: string) {
  const configs: Record<string, any> = {
    joining: {
      title: "Joined Company",
      category: "Start",
      icon: UserPlus,
      color: "var(--tag-success)",
      bgColor: "rgba(22,163,74,0.1)",
      borderColor: "rgba(22,163,74,0.3)",
      lightBg: "rgba(22,163,74,0.02)",
    },
    probation_completed: {
      title: "Probation Completed",
      category: "Milestone",
      icon: CheckCircle,
      color: "var(--tag-success)",
      bgColor: "rgba(22,163,74,0.1)",
      borderColor: "rgba(22,163,74,0.3)",
      lightBg: "rgba(22,163,74,0.02)",
    },
    promotion: {
      title: "Promotion",
      category: "Growth",
      icon: TrendingUp,
      color: "var(--tag-success)",
      bgColor: "rgba(22,163,74,0.1)",
      borderColor: "rgba(22,163,74,0.3)",
      lightBg: "rgba(22,163,74,0.02)",
    },
    salary_increment: {
      title: "Salary Increment",
      category: "Growth",
      icon: DollarSign,
      color: "var(--tag-success)",
      bgColor: "rgba(22,163,74,0.1)",
      borderColor: "rgba(22,163,74,0.3)",
      lightBg: "rgba(22,163,74,0.02)",
    },
    department_transfer: {
      title: "Department Transfer",
      category: "Change",
      icon: Shuffle,
      color: "var(--tag-orange)",
      bgColor: "rgba(249,115,22,0.1)",
      borderColor: "rgba(249,115,22,0.3)",
      lightBg: "rgba(249,115,22,0.02)",
    },
    role_change: {
      title: "Role Change",
      category: "Change",
      icon: Briefcase,
      color: "var(--tag-orange)",
      bgColor: "rgba(249,115,22,0.1)",
      borderColor: "rgba(249,115,22,0.3)",
      lightBg: "rgba(249,115,22,0.02)",
    },
    performance_review: {
      title: "Performance Review",
      category: "Review",
      icon: Star,
      color: "var(--tag-orange)",
      bgColor: "rgba(249,115,22,0.1)",
      borderColor: "rgba(249,115,22,0.3)",
      lightBg: "rgba(249,115,22,0.02)",
    },
    warning_issued: {
      title: "Warning Issued",
      category: "Action",
      icon: AlertTriangle,
      color: "var(--tag-warning)",
      bgColor: "rgba(217,119,6,0.1)",
      borderColor: "rgba(217,119,6,0.3)",
      lightBg: "rgba(217,119,6,0.02)",
    },
    pip_initiated: {
      title: "PIP Initiated",
      category: "Action",
      icon: FileText,
      color: "var(--tag-warning)",
      bgColor: "rgba(217,119,6,0.1)",
      borderColor: "rgba(217,119,6,0.3)",
      lightBg: "rgba(217,119,6,0.02)",
    },
    pip_closed: {
      title: "PIP Closed",
      category: "Action",
      icon: CheckSquare,
      color: "var(--tag-orange)",
      bgColor: "rgba(249,115,22,0.1)",
      borderColor: "rgba(249,115,22,0.3)",
      lightBg: "rgba(249,115,22,0.02)",
    },
    resignation: {
      title: "Resignation",
      category: "Exit",
      icon: UserMinus,
      color: "var(--tag-danger)",
      bgColor: "rgba(239,68,68,0.1)",
      borderColor: "rgba(239,68,68,0.3)",
      lightBg: "rgba(239,68,68,0.02)",
    },
    exit_interview: {
      title: "Exit Interview",
      category: "Exit",
      icon: MessageSquare,
      color: "var(--tag-danger)",
      bgColor: "rgba(239,68,68,0.1)",
      borderColor: "rgba(239,68,68,0.3)",
      lightBg: "rgba(239,68,68,0.02)",
    },
    full_and_final: {
      title: "Full & Final Settlement",
      category: "Exit",
      icon: CheckSquare,
      color: "var(--tag-danger)",
      bgColor: "rgba(239,68,68,0.1)",
      borderColor: "rgba(239,68,68,0.3)",
      lightBg: "rgba(239,68,68,0.02)",
    },
  };

  return configs[eventType] || {
    title: eventType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    category: "Event",
    icon: Briefcase,
    color: "var(--tag-body)",
    bgColor: "rgba(107,114,128,0.1)",
    borderColor: "rgba(107,114,128,0.3)",
    lightBg: "rgba(107,114,128,0.02)",
  };
}

function formatMetadataKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
