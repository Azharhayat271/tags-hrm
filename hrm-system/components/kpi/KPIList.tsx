"use client";

import { Target, TrendingUp } from "lucide-react";

interface KPI {
  id: string;
  title: string;
  description: string | null;
  target: number | null;
  unit: string | null;
  weight: number;
  progress: number;
  cycle: string;
}

interface KPIListProps {
  kpis: KPI[];
}

export default function KPIList({ kpis }: KPIListProps) {
  if (kpis.length === 0) {
    return (
      <div className="card p-6">
        <div className="text-center py-12">
          <Target className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            No KPIs assigned for this cycle
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {kpis.map((kpi) => {
        const progressPercentage = kpi.progress || 0;
        const isOnTrack = progressPercentage >= 70;
        const isExceeding = progressPercentage >= 100;

        return (
          <div key={kpi.id} className="card p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-base font-normal">{kpi.title}</h4>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--tag-bg-warm)', color: 'var(--tag-label)' }}>
                    Weight: {kpi.weight}x
                  </span>
                </div>
                {kpi.description && (
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    {kpi.description}
                  </p>
                )}
              </div>
              <div className="text-right ml-4">
                <p className="text-2xl font-light tabular-nums" style={{ color: isExceeding ? 'var(--tag-success)' : 'var(--tag-orange)' }}>
                  {progressPercentage}%
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Progress
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="w-full h-3 rounded-full" style={{ backgroundColor: 'var(--tag-border)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(progressPercentage, 100)}%`,
                    background: isExceeding 
                      ? 'var(--tag-success)' 
                      : isOnTrack 
                      ? 'linear-gradient(90deg, var(--tag-orange), var(--tag-amber))' 
                      : 'var(--tag-warning)',
                  }}
                />
              </div>
            </div>

            {/* Target Info */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {kpi.target && (
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                    <span style={{ color: "var(--text-tertiary)" }}>
                      Target: {kpi.target} {kpi.unit || ''}
                    </span>
                  </div>
                )}
              </div>
              <span
                className={`badge ${
                  isExceeding ? 'badge-success' :
                  isOnTrack ? 'badge-orange' :
                  'badge-warning'
                }`}
              >
                {isExceeding ? 'Exceeding' : isOnTrack ? 'On Track' : 'Needs Attention'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
