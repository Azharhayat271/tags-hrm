"use client";

import React, { useState } from "react";
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
  }>;
}

interface AttendanceReportTableProps {
  employees: Employee[];
  view: string;
  startDate: Date;
  endDate: Date;
}

export default function AttendanceReportTable({ 
  employees, 
  view,
  startDate,
  endDate 
}: AttendanceReportTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const calculateWorkHours = (sessions: Employee['attendance_sessions']) => {
    let totalMs = 0;
    let completedSessions = 0;
    
    sessions.forEach(session => {
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
                    <span style={{ color: 'var(--tag-body)' }}>
                      {stats.completedSessions}/{stats.totalSessions}
                    </span>
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
            Total Sessions
          </p>
          <p className="text-2xl font-light">
            {employees.reduce((sum, emp) => {
              const stats = calculateWorkHours(emp.attendance_sessions || []);
              return sum + stats.totalSessions;
            }, 0)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
            Total Work Hours
          </p>
          <p className="text-2xl font-light">
            {employees.reduce((sum, emp) => {
              const stats = calculateWorkHours(emp.attendance_sessions || []);
              return sum + stats.totalHours;
            }, 0)}h
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
            Avg Hours per Employee
          </p>
          <p className="text-2xl font-light">
            {employees.length > 0
              ? (
                  employees.reduce((sum, emp) => {
                    const stats = calculateWorkHours(emp.attendance_sessions || []);
                    return sum + stats.totalHours;
                  }, 0) / employees.length
                ).toFixed(1)
              : 0}h
          </p>
        </div>
      </div>
    </div>
  );
}
