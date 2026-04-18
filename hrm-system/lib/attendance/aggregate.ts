export interface RawSession {
  id: string;
  employee_id: string;
  check_in: string;
  check_out: string | null;
  auto_closed_at?: string | null;
  auto_close_reason?: string | null;
  is_manual_entry?: boolean | null;
  manual_added_at?: string | null;
}

export interface RawEmployee {
  id: string;
  full_name: string;
  email: string;
  department_id?: string | null;
  department_name?: string | null;
}

export interface RawHoliday {
  date: string;
  name: string;
}

export interface AggregateConfig {
  standardDailyHours: number;
  standardWeeklyHours: number;
}

export const DEFAULT_AGGREGATE_CONFIG: AggregateConfig = {
  standardDailyHours: 8,
  standardWeeklyHours: 40,
};

export type DayFlag =
  | "weekend_work"
  | "holiday_work"
  | "manual"
  | "auto_closed"
  | "open";

export interface DayCell {
  total: number;
  regular: number;
  overtime: number;
  firstCheckIn: string | null;
  firstCheckInMinutes: number | null;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  flags: DayFlag[];
  sessionCount: number;
  hasOpenSession: boolean;
}

export interface EmployeeTotals {
  totalHours: number;
  regularHours: number;
  dailyOvertimeHours: number;
  weeklyOvertimeHours: number;
  overtimeHours: number;
  daysPresent: number;
  daysPartial: number;
  daysAbsent: number;
  daysWeekendWorked: number;
  daysHolidayWorked: number;
  workingDaysInPeriod: number;
  avgHoursPerWorkDay: number;
  attendancePercentage: number;
  openSessions: number;
  autoClosedSessions: number;
  manualEntrySessions: number;
  totalSessions: number;
  completedSessions: number;
}

export interface AttendanceMatrixRow {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  departmentId: string | null;
  departmentName: string | null;
  dayHours: Record<string, DayCell>;
  totals: EmployeeTotals;
}

export interface PeriodSummary {
  start: string;
  end: string;
  workingDayCount: number;
  totalsAcrossEmployees: {
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    totalAbsentDays: number;
    attendancePercentage: number;
    openSessions: number;
    autoClosedSessions: number;
    manualEntrySessions: number;
  };
}

export interface AttendanceMatrix {
  dayKeys: string[];
  weekendDayKeys: Set<string>;
  holidayDayKeys: Map<string, string>;
  workingDayKeys: Set<string>;
  rows: AttendanceMatrixRow[];
  period: PeriodSummary;
  config: AggregateConfig;
}

export interface ComputeMatrixInput {
  employees: RawEmployee[];
  sessions: RawSession[];
  holidays?: RawHoliday[];
  range: { start: Date; end: Date };
  config?: Partial<AggregateConfig>;
}

export function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function enumerateDayKeys(start: Date, end: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const stop = new Date(end);
  stop.setHours(0, 0, 0, 0);
  while (cursor <= stop) {
    keys.push(toDayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function emptyCell(isWeekendDay: boolean, isHolidayDay: boolean, holidayName: string | null): DayCell {
  return {
    total: 0,
    regular: 0,
    overtime: 0,
    firstCheckIn: null,
    firstCheckInMinutes: null,
    isWeekend: isWeekendDay,
    isHoliday: isHolidayDay,
    holidayName,
    flags: [],
    sessionCount: 0,
    hasOpenSession: false,
  };
}

function pushFlag(cell: DayCell, flag: DayFlag) {
  if (!cell.flags.includes(flag)) {
    cell.flags.push(flag);
  }
}

export function computeAttendanceMatrix(input: ComputeMatrixInput): AttendanceMatrix {
  const config: AggregateConfig = {
    ...DEFAULT_AGGREGATE_CONFIG,
    ...(input.config ?? {}),
  };

  const dayKeys = enumerateDayKeys(input.range.start, input.range.end);

  const weekendDayKeys = new Set<string>();
  const holidayDayKeys = new Map<string, string>();
  (input.holidays ?? []).forEach((h) => {
    holidayDayKeys.set(h.date, h.name);
  });

  dayKeys.forEach((key) => {
    const d = parseDayKey(key);
    if (isWeekend(d)) weekendDayKeys.add(key);
  });

  const workingDayKeys = new Set<string>(
    dayKeys.filter((k) => !weekendDayKeys.has(k) && !holidayDayKeys.has(k))
  );

  const sessionsByEmployee = new Map<string, RawSession[]>();
  input.sessions.forEach((s) => {
    const list = sessionsByEmployee.get(s.employee_id) ?? [];
    list.push(s);
    sessionsByEmployee.set(s.employee_id, list);
  });

  const rows: AttendanceMatrixRow[] = input.employees.map((emp) => {
    const empSessions = sessionsByEmployee.get(emp.id) ?? [];
    const dayHours: Record<string, DayCell> = {};
    dayKeys.forEach((key) => {
      dayHours[key] = emptyCell(
        weekendDayKeys.has(key),
        holidayDayKeys.has(key),
        holidayDayKeys.get(key) ?? null
      );
    });

    let openSessions = 0;
    let autoClosedSessions = 0;
    let manualEntrySessions = 0;
    let totalSessions = 0;
    let completedSessions = 0;

    empSessions.forEach((session) => {
      totalSessions += 1;
      const checkIn = new Date(session.check_in);
      const dayKey = toDayKey(checkIn);
      const cell = dayHours[dayKey];
      if (!cell) return;
      cell.sessionCount += 1;

      if (session.is_manual_entry) {
        manualEntrySessions += 1;
        pushFlag(cell, "manual");
      }
      if (session.auto_closed_at) {
        autoClosedSessions += 1;
        pushFlag(cell, "auto_closed");
      }

      const checkInMinutes = checkIn.getHours() * 60 + checkIn.getMinutes();
      if (cell.firstCheckInMinutes === null || checkInMinutes < cell.firstCheckInMinutes) {
        cell.firstCheckInMinutes = checkInMinutes;
        cell.firstCheckIn = `${String(checkIn.getHours()).padStart(2, "0")}:${String(
          checkIn.getMinutes()
        ).padStart(2, "0")}`;
      }

      if (!session.check_out) {
        openSessions += 1;
        cell.hasOpenSession = true;
        pushFlag(cell, "open");
        return;
      }

      const checkOut = new Date(session.check_out);
      const durationMs = Math.max(0, checkOut.getTime() - checkIn.getTime());
      const hours = durationMs / (1000 * 60 * 60);
      cell.total += hours;
      completedSessions += 1;
    });

    let totalHours = 0;
    let regularHours = 0;
    let dailyOvertimeHours = 0;
    let daysPresent = 0;
    let daysPartial = 0;
    let daysAbsent = 0;
    let daysWeekendWorked = 0;
    let daysHolidayWorked = 0;

    const weeklyTotals = new Map<string, number>();

    dayKeys.forEach((key) => {
      const cell = dayHours[key];
      cell.regular = Math.min(cell.total, config.standardDailyHours);
      cell.overtime = Math.max(0, cell.total - config.standardDailyHours);

      if (cell.isWeekend && cell.total > 0) {
        pushFlag(cell, "weekend_work");
        daysWeekendWorked += 1;
      }
      if (cell.isHoliday && cell.total > 0) {
        pushFlag(cell, "holiday_work");
        daysHolidayWorked += 1;
      }

      totalHours += cell.total;
      regularHours += cell.regular;
      dailyOvertimeHours += cell.overtime;

      if (workingDayKeys.has(key)) {
        if (cell.total >= config.standardDailyHours) daysPresent += 1;
        else if (cell.total > 0) daysPartial += 1;
        else daysAbsent += 1;
      }

      const weekKey = isoWeekKey(parseDayKey(key));
      weeklyTotals.set(weekKey, (weeklyTotals.get(weekKey) ?? 0) + cell.total);
    });

    let weeklyOvertimeHours = 0;
    weeklyTotals.forEach((hours) => {
      if (hours > config.standardWeeklyHours) {
        weeklyOvertimeHours += hours - config.standardWeeklyHours;
      }
    });

    const overtimeHours = Math.max(dailyOvertimeHours, weeklyOvertimeHours);
    const workingDaysInPeriod = workingDayKeys.size;
    const attendedWorkDays = daysPresent + daysPartial;
    const avgHoursPerWorkDay = attendedWorkDays > 0 ? totalHours / attendedWorkDays : 0;
    const attendancePercentage =
      workingDaysInPeriod > 0
        ? Math.round(((daysPresent + 0.5 * daysPartial) / workingDaysInPeriod) * 100)
        : 0;

    const totals: EmployeeTotals = {
      totalHours: round1(totalHours),
      regularHours: round1(regularHours),
      dailyOvertimeHours: round1(dailyOvertimeHours),
      weeklyOvertimeHours: round1(weeklyOvertimeHours),
      overtimeHours: round1(overtimeHours),
      daysPresent,
      daysPartial,
      daysAbsent,
      daysWeekendWorked,
      daysHolidayWorked,
      workingDaysInPeriod,
      avgHoursPerWorkDay: round1(avgHoursPerWorkDay),
      attendancePercentage,
      openSessions,
      autoClosedSessions,
      manualEntrySessions,
      totalSessions,
      completedSessions,
    };

    return {
      employeeId: emp.id,
      employeeName: emp.full_name || "Unknown Employee",
      employeeEmail: emp.email || "",
      departmentId: emp.department_id ?? null,
      departmentName: emp.department_name ?? null,
      dayHours,
      totals,
    };
  });

  const totalsAcrossEmployees = rows.reduce(
    (acc, r) => {
      acc.totalHours += r.totals.totalHours;
      acc.regularHours += r.totals.regularHours;
      acc.overtimeHours += r.totals.overtimeHours;
      acc.totalAbsentDays += r.totals.daysAbsent;
      acc.openSessions += r.totals.openSessions;
      acc.autoClosedSessions += r.totals.autoClosedSessions;
      acc.manualEntrySessions += r.totals.manualEntrySessions;
      return acc;
    },
    {
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      totalAbsentDays: 0,
      openSessions: 0,
      autoClosedSessions: 0,
      manualEntrySessions: 0,
      attendancePercentage: 0,
    }
  );

  const totalExpected = rows.length * workingDayKeys.size;
  const totalAttendedEquivalent = rows.reduce(
    (s, r) => s + r.totals.daysPresent + 0.5 * r.totals.daysPartial,
    0
  );
  totalsAcrossEmployees.attendancePercentage =
    totalExpected > 0 ? Math.round((totalAttendedEquivalent / totalExpected) * 100) : 0;

  totalsAcrossEmployees.totalHours = round1(totalsAcrossEmployees.totalHours);
  totalsAcrossEmployees.regularHours = round1(totalsAcrossEmployees.regularHours);
  totalsAcrossEmployees.overtimeHours = round1(totalsAcrossEmployees.overtimeHours);

  return {
    dayKeys,
    weekendDayKeys,
    holidayDayKeys,
    workingDayKeys,
    rows,
    period: {
      start: toDayKey(input.range.start),
      end: toDayKey(input.range.end),
      workingDayCount: workingDayKeys.size,
      totalsAcrossEmployees,
    },
    config,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 60) return `${h + 1}h`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
