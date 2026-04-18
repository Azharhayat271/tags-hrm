"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "lucide-react";

interface Employee {
  id: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
  attendance_sessions: Array<{
    id: string;
    check_in: string;
    check_out: string | null;
    auto_closed_at: string | null;
    auto_close_reason: string | null;
  }>;
}

interface AttendanceReportTableProps {
  employees: Employee[];
  view: string;
  startDate: Date;
  endDate: Date;
  matrixData?: {
    periodStart: string;
    periodEnd: string;
    dayKeys: string[];
    rows: Array<{
      employeeId: string;
      employeeName: string;
      employeeEmail: string;
      dayHours: Record<string, number>;
      totalCompletedHours: number;
      completedSessions: number;
      openSessions: number;
      autoClosedSessions: number;
    }>;
  };
}

export default function AttendanceReportTable({ 
  employees, 
  view,
  startDate,
  endDate,
  matrixData,
}: AttendanceReportTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [monthlyMode, setMonthlyMode] = useState<"summary" | "matrix">("matrix");

  const calculateWorkHours = (sessions: Employee['attendance_sessions']) => {
    let totalMs = 0;
    let completedSessions = 0;
    let autoClosedSessions = 0;
    
    sessions.forEach(session => {
      if (session.auto_closed_at) {
        autoClosedSessions++;
      }
      if (session.check_in && session.check_out) {
        completedSessions++;
        const start = new Date(session.check_in);
        const end = new Date(session.check_out);
        totalMs += end.getTime() - start.getTime();
      }
    });
    
    const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const avgHoursPerDay = completedSessions > 0 ? (totalMs / completedSessions / (1000 * 60 * 60)).toFixed(1) : "0.0";
    
    // Count unique days worked
    const uniqueDays = new Set(
      sessions
        .filter(s => s.check_in)
        .map(s => new Date(s.check_in).toDateString())
    ).size;
    
    return {
      totalHours,
      totalMinutes,
      totalSessions: sessions.length,
      completedSessions,
      autoClosedSessions,
      daysWorked: uniqueDays,
      avgHoursPerDay,
    };
  };

  const handleViewChange = (newView: string) => {
    router.push(`/admin/attendance?view=${newView}`);
  };

  const handleMonthChange = (offset: number) => {
    const currentMonth = searchParams.get("month") ? parseInt(searchParams.get("month")!) : 0;
    router.push(`/admin/attendance?view=monthly&month=${currentMonth + offset}`);
  };

  const matrixSummary = useMemo(() => {
    if (!matrixData) {
      return {
        totalWorkHours: 0,
        totalCompletedSessions: 0,
        totalOpenSessions: 0,
        totalAutoClosedSessions: 0,
      };
    }

    return matrixData.rows.reduce(
      (acc, row) => {
        acc.totalWorkHours += row.totalCompletedHours;
        acc.totalCompletedSessions += row.completedSessions;
        acc.totalOpenSessions += row.openSessions;
        acc.totalAutoClosedSessions += row.autoClosedSessions;
        return acc;
      },
      {
        totalWorkHours: 0,
        totalCompletedSessions: 0,
        totalOpenSessions: 0,
        totalAutoClosedSessions: 0,
      }
    );
  }, [matrixData]);

  const getHoursCellStyle = (hours: number, dateStr?: string) => {
    // Check if date is in the future
    if (dateStr) {
      const cellDate = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Future dates - white background
      if (cellDate > today) {
        return {
          backgroundColor: "#ffffff",
          color: "var(--tag-body)",
          border: "1px solid var(--tag-border)",
        };
      }
    }

    // Past dates with data
    if (hours >= 8) {
      return {
        backgroundColor: "rgba(22,163,74,0.13)",
        color: "var(--tag-success)",
      };
    }

    // Yellow for 0 < hours < 8
    if (hours > 0) {
      return {
        backgroundColor: "rgba(234,179,8,0.15)",
        color: "var(--tag-warning)",
      };
    }

    // Red/pink for absent (0 hours)
    return {
      backgroundColor: "rgba(239,68,68,0.09)",
      color: "var(--tag-danger)",
    };
  };

  const isMonthlyMatrixMode = view === "monthly" && monthlyMode === "matrix" && !!matrixData;

  const renderMonthlyMatrix = () => {
    if (!matrixData) {
      return (
        <div className="text-center py-12">
          <p style={{ color: "var(--tag-body)" }}>No monthly matrix data available</p>
        </div>
      );
    }

    const dayTotals: Record<string, number> = {};
    matrixData.dayKeys.forEach((dayKey) => {
      dayTotals[dayKey] = matrixData.rows.reduce((sum, row) => sum + (row.dayHours[dayKey] || 0), 0);
    });

    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--tag-body)" }}>
            <Calendar className="w-4 h-4" />
            <span>{matrixData.dayKeys.length} calendar days in view</span>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--tag-body)" }}>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: "#ffffff", border: "1px solid #ccc" }} />
              Future Days
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: "rgba(22,163,74,0.13)" }} />
              Full day (8h+)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: "rgba(234,179,8,0.15)" }} />
              Partial (0-8h)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.09)" }} />
              Absent (0h)
            </span>
          </div>
        </div>

        <div className="table-container overflow-x-auto" style={{ border: "1px solid var(--tag-border)", borderRadius: "0.75rem" }}>
          <table className="w-full min-w-max">
            <thead>
              <tr className="table-header">
                <th
                  className="text-left px-4 py-3 sticky left-0 z-20"
                  style={{ backgroundColor: "var(--tag-paper, #fff)" }}
                >
                  Employee
                </th>
                {matrixData.dayKeys.map((dayKey) => {
                  const day = new Date(dayKey);
                  return (
                    <th key={dayKey} className="text-center px-2 py-3 min-w-[76px]">
                      <div className="text-[11px]" style={{ color: "var(--tag-label)" }}>
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div className="text-sm tabular-nums">{day.getDate()}</div>
                    </th>
                  );
                })}
                <th className="text-center px-4 py-3 sticky right-0 z-20" style={{ backgroundColor: "var(--tag-paper, #fff)" }}>
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {matrixData.rows.map((row) => (
                <tr key={row.employeeId} className="table-row">
                  <td
                    className="px-4 py-3 sticky left-0 z-10"
                    style={{ backgroundColor: "var(--tag-paper, #fff)" }}
                  >
                    <div>
                      <p className="font-normal leading-tight">{row.employeeName}</p>
                      <p className="text-xs" style={{ color: "var(--tag-body)" }}>
                        {row.employeeEmail}
                      </p>
                      {row.openSessions > 0 && (
                        <span className="badge badge-warning mt-2">{row.openSessions} open</span>
                      )}
                      {row.autoClosedSessions > 0 && (
                        <span className="badge badge-default mt-2" style={{ backgroundColor: 'rgba(100,116,139,0.1)', color: 'var(--tag-label)' }}>
                          ⚙️ {row.autoClosedSessions} auto-closed
                        </span>
                      )}
                    </div>
                  </td>

                  {matrixData.dayKeys.map((dayKey) => {
                    const hours = row.dayHours[dayKey] || 0;
                    const cellStyle = getHoursCellStyle(hours, dayKey);

                    return (
                      <td
                        key={`${row.employeeId}-${dayKey}`}
                        className="px-2 py-3 text-center tabular-nums"
                        title={`${row.employeeName} - ${dayKey}: ${hours.toFixed(2)}h`}
                        style={cellStyle}
                      >
                        {hours.toFixed(1)}
                      </td>
                    );
                  })}

                  <td
                    className="px-4 py-3 text-center tabular-nums font-medium sticky right-0 z-10"
                    style={{ backgroundColor: "var(--tag-paper, #fff)" }}
                  >
                    {row.totalCompletedHours.toFixed(1)}h
                    <div className="text-xs mt-1">
                      <Link
                        href={`/admin/attendance/${row.employeeId}?start=${startDate.toISOString()}&end=${endDate.toISOString()}`}
                        className="hover:underline"
                        style={{ color: "var(--tag-orange)" }}
                      >
                        details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              <tr className="table-row" style={{ backgroundColor: "var(--tag-bg-warm)" }}>
                <td className="px-4 py-3 font-medium sticky left-0 z-10" style={{ backgroundColor: "var(--tag-bg-warm)" }}>
                  Daily Total
                </td>
                {matrixData.dayKeys.map((dayKey) => (
                  <td key={`totals-${dayKey}`} className="px-2 py-3 text-center tabular-nums font-medium">
                    {dayTotals[dayKey].toFixed(1)}
                  </td>
                ))}
                <td className="px-4 py-3 text-center tabular-nums font-semibold sticky right-0 z-10" style={{ backgroundColor: "var(--tag-bg-warm)" }}>
                  {matrixSummary.totalWorkHours.toFixed(1)}h
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--tag-body)' }}>No attendance data found</p>
      </div>
    );
  }

  return (
    <div>
      {/* View Toggle and Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => handleViewChange("monthly")}
            className={view === "monthly" ? "btn-primary" : "btn-ghost"}
          >
            Monthly
          </button>
          <button
            onClick={() => handleViewChange("weekly")}
            className={view === "weekly" ? "btn-primary" : "btn-ghost"}
          >
            Weekly
          </button>

          {view === "monthly" && (
            <>
              <button
                onClick={() => setMonthlyMode("matrix")}
                className={monthlyMode === "matrix" ? "btn-primary" : "btn-ghost"}
              >
                Matrix
              </button>
              <button
                onClick={() => setMonthlyMode("summary")}
                className={monthlyMode === "summary" ? "btn-primary" : "btn-ghost"}
              >
                Summary Table
              </button>
            </>
          )}
        </div>

        {view === "monthly" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMonthChange(-1)}
              className="btn-ghost"
            >
              ← Previous
            </button>
            <button
              onClick={() => handleMonthChange(1)}
              className="btn-ghost"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {isMonthlyMatrixMode ? (
        renderMonthlyMatrix()
      ) : (
      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-4 py-3">Employee</th>
              <th className="text-center px-4 py-3">Days Worked</th>
              <th className="text-center px-4 py-3">Total Sessions</th>
              <th className="text-center px-4 py-3">Total Hours</th>
              <th className="text-center px-4 py-3">Avg Hours/Session</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-center px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => {
              const stats = calculateWorkHours(employee.attendance_sessions || []);
              const expectedHours = view === "weekly" ? 40 : 160;
              const hoursPercentage = expectedHours > 0 
                ? Math.round((stats.totalHours / expectedHours) * 100) 
                : 0;
              
              return (
                <tr key={employee.id} className="table-row">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-normal">{employee.profiles?.full_name}</p>
                      <p className="text-xs" style={{ color: 'var(--tag-body)' }}>
                        {employee.profiles?.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <span className="badge-primary">{stats.daysWorked}</span>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span style={{ color: 'var(--tag-body)' }}>
                        {stats.completedSessions}/{stats.totalSessions}
                      </span>
                      {stats.autoClosedSessions > 0 && (
                        <span className="badge badge-default" style={{ backgroundColor: 'rgba(100,116,139,0.1)', color: 'var(--tag-label)' }}>
                          ⚙️ {stats.autoClosedSessions}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <span className="font-medium">
                      {stats.totalHours}h {stats.totalMinutes}m
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <span style={{ color: 'var(--tag-body)' }}>
                      {stats.avgHoursPerDay}h
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <span
                      className={`badge ${
                        hoursPercentage >= 90 ? 'badge-success' :
                        hoursPercentage >= 75 ? 'badge-warning' :
                        'badge-danger'
                      }`}
                    >
                      {hoursPercentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/admin/attendance/${employee.id}?start=${startDate.toISOString()}&end=${endDate.toISOString()}`}
                      className="inline-flex items-center gap-1 text-sm hover:underline"
                      style={{ color: 'var(--tag-orange)' }}
                    >
                      View Details
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
            Total Employees
          </p>
          <p className="text-2xl font-light">{employees.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
            Auto-Closed Sessions
          </p>
          <p className="text-2xl font-light">
            {isMonthlyMatrixMode
              ? matrixSummary.totalAutoClosedSessions
              : employees.reduce((sum, emp) => {
                  const stats = calculateWorkHours(emp.attendance_sessions || []);
                  return sum + stats.autoClosedSessions;
                }, 0)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
            Total Work Hours
          </p>
          <p className="text-2xl font-light">
            {isMonthlyMatrixMode
              ? `${matrixSummary.totalWorkHours.toFixed(1)}h`
              : `${employees.reduce((sum, emp) => {
                  const stats = calculateWorkHours(emp.attendance_sessions || []);
                  return sum + stats.totalHours;
                }, 0)}h`}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
            {isMonthlyMatrixMode ? "Open Sessions" : "Avg Hours per Employee"}
          </p>
          <p className="text-2xl font-light">
            {isMonthlyMatrixMode
              ? matrixSummary.totalOpenSessions
              : `${employees.length > 0
                  ? (
                      employees.reduce((sum, emp) => {
                        const stats = calculateWorkHours(emp.attendance_sessions || []);
                        return sum + stats.totalHours;
                      }, 0) / employees.length
                    ).toFixed(1)
                  : 0}h`}
          </p>
        </div>
      </div>
    </div>
  );
}
