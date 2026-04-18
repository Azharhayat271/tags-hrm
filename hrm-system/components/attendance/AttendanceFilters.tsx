"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import {
  AVAILABLE_STATUS_CHIPS,
  filterStateToQueryString,
  type AttendanceFilterState,
  type PeriodMode,
  type ViewMode,
} from "@/lib/attendance/filters";
import { cn } from "@/components/ui";

interface AttendanceFiltersProps {
  state: AttendanceFilterState;
  periodLabel: string;
  departments?: Array<{ id: string; name: string }>;
}

export default function AttendanceFilters({
  state,
  periodLabel,
  departments = [],
}: AttendanceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(state.search);

  useEffect(() => setSearchDraft(state.search), [state.search]);

  const push = useCallback(
    (next: Partial<AttendanceFilterState>) => {
      const merged: AttendanceFilterState = {
        ...state,
        ...next,
        statusChips: next.statusChips ?? state.statusChips,
      };
      const qs = filterStateToQueryString(merged);
      router.push(`/admin/attendance${qs ? `?${qs}` : ""}`);
    },
    [state, router]
  );

  useEffect(() => {
    const current = searchParams.get("search") || "";
    if (searchDraft === current) return;
    const handle = setTimeout(() => {
      push({ search: searchDraft });
    }, 350);
    return () => clearTimeout(handle);
  }, [searchDraft, searchParams, push]);

  const toggleChip = (id: string) => {
    const next = new Set(state.statusChips);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    push({ statusChips: next });
  };

  const handlePeriod = (period: PeriodMode) => {
    push({ period, monthOffset: 0, weekOffset: 0 });
  };

  const offsetStep = (dir: 1 | -1) => {
    if (state.period === "month") push({ monthOffset: state.monthOffset + dir });
    else if (state.period === "week") push({ weekOffset: state.weekOffset + dir });
  };

  const handleToday = () => push({ monthOffset: 0, weekOffset: 0 });

  const chipRow = useMemo(() => AVAILABLE_STATUS_CHIPS, []);

  return (
    <div className="rounded-md border border-line-subtle bg-surface-raised shadow-e1 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2.5 px-4 py-2.5">
        {/* Period segmented control */}
        <SegmentedControl<PeriodMode>
          value={state.period}
          onChange={handlePeriod}
          options={[
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
            { value: "custom", label: "Custom" },
          ]}
        />

        {state.period !== "custom" && (
          <div className="inline-flex items-center gap-1">
            <IconBtn onClick={() => offsetStep(-1)} ariaLabel="Previous period">
              <ChevronLeft className="w-3.5 h-3.5" />
            </IconBtn>
            <div
              className={cn(
                "px-3 h-8 inline-flex items-center gap-1.5 rounded-sm",
                "bg-surface-sunken border border-line-subtle",
                "text-[12px] text-ink-primary font-mono tabular-nums",
              )}
              style={{ minWidth: "190px", justifyContent: "center" }}
            >
              <Calendar className="w-3.5 h-3.5 text-ink-tertiary" />
              <span>{periodLabel}</span>
            </div>
            <IconBtn onClick={() => offsetStep(1)} ariaLabel="Next period">
              <ChevronRight className="w-3.5 h-3.5" />
            </IconBtn>
            {(state.monthOffset !== 0 || state.weekOffset !== 0) && (
              <button
                onClick={handleToday}
                className={cn(
                  "h-8 px-2.5 rounded-sm border text-[11px] font-medium",
                  "border-line-subtle text-ink-accent hover:bg-accent-tint hover:border-[var(--accent-wash)]",
                  "transition-colors duration-fast",
                )}
              >
                Today
              </button>
            )}
          </div>
        )}

        {state.period === "custom" && (
          <div className="inline-flex items-center gap-2">
            <DateInput value={state.customStart ?? ""} onChange={(v) => push({ customStart: v || null })} />
            <span className="text-[11px] text-ink-tertiary uppercase tracking-wide">to</span>
            <DateInput value={state.customEnd ?? ""} onChange={(v) => push({ customEnd: v || null })} />
          </div>
        )}

        <span className="w-px h-6 bg-line-subtle" aria-hidden />

        {/* View segmented control */}
        <SegmentedControl<ViewMode>
          value={state.view}
          onChange={(v) => push({ view: v })}
          options={[
            { value: "matrix", label: "Matrix" },
            { value: "summary", label: "Summary" },
            { value: "calendar", label: "Calendar" },
          ]}
        />

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none" />
            <input
              type="text"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search name or email"
              className={cn(
                "w-full h-8 pl-8 pr-7 rounded-sm text-[12px]",
                "bg-surface-sunken border border-line-subtle text-ink-primary",
                "placeholder:text-ink-quaternary",
                "focus:outline-none focus:border-accent focus:shadow-focus focus:bg-surface-raised",
                "transition-all duration-fast",
              )}
            />
            {searchDraft && (
              <button
                onClick={() => setSearchDraft("")}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-ink-quaternary hover:text-ink-primary"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {departments.length > 1 && (
            <select
              value={state.departmentId ?? ""}
              onChange={(e) => push({ departmentId: e.target.value || null })}
              className={cn(
                "h-8 px-2.5 rounded-sm text-[12px]",
                "bg-surface-sunken border border-line-subtle text-ink-primary",
                "focus:outline-none focus:border-accent focus:shadow-focus",
                "transition-all duration-fast",
              )}
              style={{ minWidth: "160px" }}
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Chip row */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-t border-line-subtle bg-surface-muted">
        <span className="eyebrow mr-1">Show only</span>
        {chipRow.map((chip) => {
          const active = state.statusChips.has(chip.id);
          return (
            <button
              key={chip.id}
              onClick={() => toggleChip(chip.id)}
              className={cn(
                "inline-flex items-center h-7 px-2.5 rounded-pill border text-[11px] font-medium",
                "transition-all duration-fast ease-out-expo",
                active
                  ? "bg-ink-primary text-white border-ink-primary"
                  : "bg-surface-raised text-ink-secondary border-line-subtle hover:border-line hover:text-ink-primary",
              )}
            >
              {chip.label}
            </button>
          );
        })}
        {state.statusChips.size > 0 && (
          <button
            onClick={() => push({ statusChips: new Set() })}
            className="h-7 px-2 text-[11px] text-ink-tertiary hover:text-ink-primary transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="inline-flex h-8 p-0.5 rounded-sm bg-surface-sunken border border-line-subtle">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-2.5 h-7 rounded-xs text-[12px] font-medium transition-all duration-fast",
              active
                ? "bg-surface-raised text-ink-primary shadow-e1"
                : "text-ink-tertiary hover:text-ink-primary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function IconBtn({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "w-8 h-8 inline-flex items-center justify-center rounded-sm",
        "bg-surface-sunken border border-line-subtle text-ink-tertiary",
        "hover:text-ink-primary hover:bg-surface-raised hover:border-line",
        "transition-colors duration-fast",
      )}
    >
      {children}
    </button>
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-8 px-2.5 rounded-sm text-[12px] font-mono tabular-nums",
        "bg-surface-sunken border border-line-subtle text-ink-primary",
        "focus:outline-none focus:border-accent focus:shadow-focus focus:bg-surface-raised",
        "transition-all duration-fast",
      )}
      style={{ width: "140px" }}
    />
  );
}
