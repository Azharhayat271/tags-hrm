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
    <div
      className="rounded-md border"
      style={{
        backgroundColor: "var(--tag-bg)",
        borderColor: "var(--tag-border)",
      }}
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="inline-flex rounded-md border overflow-hidden" style={{ borderColor: "var(--tag-border)" }}>
          {(["week", "month", "custom"] as PeriodMode[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriod(p)}
              className="px-3 py-1.5 text-sm transition-colors"
              style={{
                backgroundColor: state.period === p ? "var(--tag-orange)" : "transparent",
                color: state.period === p ? "#fff" : "var(--tag-label)",
                textTransform: "capitalize",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {state.period !== "custom" && (
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => offsetStep(-1)}
              aria-label="Previous period"
              className="p-1.5 rounded-md border hover:bg-opacity-50"
              style={{ borderColor: "var(--tag-border)", backgroundColor: "var(--tag-bg-warm)" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div
              className="px-3 py-1.5 rounded-md border text-sm inline-flex items-center gap-2"
              style={{ borderColor: "var(--tag-border)", backgroundColor: "var(--tag-bg-warm)", minWidth: "180px", justifyContent: "center" }}
            >
              <Calendar className="w-3.5 h-3.5" style={{ color: "var(--tag-body)" }} />
              <span>{periodLabel}</span>
            </div>
            <button
              onClick={() => offsetStep(1)}
              aria-label="Next period"
              className="p-1.5 rounded-md border hover:bg-opacity-50"
              style={{ borderColor: "var(--tag-border)", backgroundColor: "var(--tag-bg-warm)" }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {(state.monthOffset !== 0 || state.weekOffset !== 0) && (
              <button onClick={handleToday} className="text-xs px-2 py-1 rounded-md border hover:bg-opacity-50" style={{ borderColor: "var(--tag-border-orange)", color: "var(--tag-orange)" }}>
                Today
              </button>
            )}
          </div>
        )}

        {state.period === "custom" && (
          <div className="inline-flex items-center gap-2">
            <input
              type="date"
              value={state.customStart ?? ""}
              onChange={(e) => push({ customStart: e.target.value || null })}
              className="input"
              style={{ width: "150px", padding: "0.375rem 0.5rem" }}
            />
            <span className="text-sm" style={{ color: "var(--tag-body)" }}>
              to
            </span>
            <input
              type="date"
              value={state.customEnd ?? ""}
              onChange={(e) => push({ customEnd: e.target.value || null })}
              className="input"
              style={{ width: "150px", padding: "0.375rem 0.5rem" }}
            />
          </div>
        )}

        <div className="inline-flex rounded-md border overflow-hidden" style={{ borderColor: "var(--tag-border)" }}>
          {(["matrix", "summary", "calendar"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => push({ view: v })}
              className="px-3 py-1.5 text-sm transition-colors"
              style={{
                backgroundColor: state.view === v ? "var(--tag-orange)" : "transparent",
                color: state.view === v ? "#fff" : "var(--tag-label)",
                textTransform: "capitalize",
              }}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--tag-body)" }}
          />
          <input
            type="text"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search name or email"
            className="input pl-9"
            style={{ padding: "0.375rem 0.5rem 0.375rem 2.25rem" }}
          />
          {searchDraft && (
            <button
              onClick={() => setSearchDraft("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5"
            >
              <X className="w-3.5 h-3.5" style={{ color: "var(--tag-body)" }} />
            </button>
          )}
        </div>

        {departments.length > 1 && (
          <select
            value={state.departmentId ?? ""}
            onChange={(e) => push({ departmentId: e.target.value || null })}
            className="input"
            style={{ width: "180px", padding: "0.375rem 0.5rem" }}
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

      <div
        className="flex flex-wrap items-center gap-2 px-4 py-2 border-t"
        style={{ borderColor: "var(--tag-border)", backgroundColor: "var(--tag-bg-warm)" }}
      >
        <span className="text-xs uppercase tracking-wide" style={{ color: "var(--tag-label)" }}>
          Show only
        </span>
        {chipRow.map((chip) => {
          const active = state.statusChips.has(chip.id);
          return (
            <button
              key={chip.id}
              onClick={() => toggleChip(chip.id)}
              className="text-xs px-2.5 py-1 rounded-full border transition-colors"
              style={{
                backgroundColor: active ? "var(--tag-orange)" : "transparent",
                color: active ? "#fff" : "var(--tag-label)",
                borderColor: active ? "var(--tag-orange)" : "var(--tag-border)",
              }}
            >
              {chip.label}
            </button>
          );
        })}
        {state.statusChips.size > 0 && (
          <button
            onClick={() => push({ statusChips: new Set() })}
            className="text-xs px-2 py-1"
            style={{ color: "var(--tag-body)" }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
