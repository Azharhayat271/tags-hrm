export type PeriodMode = "week" | "month" | "custom";
export type ViewMode = "matrix" | "summary" | "calendar";

export interface AttendanceFilterState {
  period: PeriodMode;
  view: ViewMode;
  monthOffset: number;
  weekOffset: number;
  customStart: string | null;
  customEnd: string | null;
  search: string;
  departmentId: string | null;
  statusChips: Set<string>;
}

export const AVAILABLE_STATUS_CHIPS = [
  { id: "overtime", label: "Overtime" },
  { id: "open", label: "Open sessions" },
  { id: "auto_closed", label: "Auto-closed" },
  { id: "manual", label: "Manual entries" },
];

export function parseFilterParams(params: URLSearchParams): AttendanceFilterState {
  const period = (params.get("period") as PeriodMode) || "month";
  const view = (params.get("view") as ViewMode) || "matrix";
  const monthOffset = parseInt(params.get("monthOffset") || "0", 10) || 0;
  const weekOffset = parseInt(params.get("weekOffset") || "0", 10) || 0;
  const customStart = params.get("start");
  const customEnd = params.get("end");
  const search = params.get("search") || "";
  const departmentId = params.get("department");
  const chipsParam = params.get("chips") || "";
  const statusChips = new Set(chipsParam.split(",").filter(Boolean));

  return {
    period,
    view,
    monthOffset,
    weekOffset,
    customStart,
    customEnd,
    search,
    departmentId,
    statusChips,
  };
}

export function filterStateToQueryString(state: AttendanceFilterState): string {
  const params = new URLSearchParams();
  params.set("period", state.period);
  params.set("view", state.view);
  if (state.period === "month" && state.monthOffset !== 0) {
    params.set("monthOffset", String(state.monthOffset));
  }
  if (state.period === "week" && state.weekOffset !== 0) {
    params.set("weekOffset", String(state.weekOffset));
  }
  if (state.period === "custom") {
    if (state.customStart) params.set("start", state.customStart);
    if (state.customEnd) params.set("end", state.customEnd);
  }
  if (state.search) params.set("search", state.search);
  if (state.departmentId) params.set("department", state.departmentId);
  if (state.statusChips.size > 0) {
    params.set("chips", Array.from(state.statusChips).join(","));
  }
  return params.toString();
}
