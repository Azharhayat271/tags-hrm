import type { AttendanceMatrix } from "@/lib/attendance/aggregate";

export interface ExportRow {
  [key: string]: string | number;
}

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCSV(rows: ExportRow[], filename = "export"): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const body = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(",")),
  ].join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8;" });
  downloadFile(blob, `${filename}.csv`);
}

export function downloadMatrixCsv(matrix: AttendanceMatrix, filename: string): void {
  const headers = [
    "Employee",
    "Email",
    "Department",
    ...matrix.dayKeys,
    "Total",
    "Regular",
    "Overtime",
    "Present",
    "Partial",
    "Absent",
    "Attendance %",
  ];

  const rows = matrix.rows.map((row) => {
    const out: (string | number)[] = [
      row.employeeName,
      row.employeeEmail,
      row.departmentName ?? "",
      ...matrix.dayKeys.map((dk) => (row.dayHours[dk]?.total || 0).toFixed(2)),
      row.totals.totalHours.toFixed(2),
      row.totals.regularHours.toFixed(2),
      row.totals.overtimeHours.toFixed(2),
      row.totals.daysPresent,
      row.totals.daysPartial,
      row.totals.daysAbsent,
      `${row.totals.attendancePercentage}%`,
    ];
    return out;
  });

  const dailyTotals = matrix.dayKeys.map((dk) =>
    matrix.rows.reduce((s, r) => s + (r.dayHours[dk]?.total || 0), 0).toFixed(2)
  );
  const t = matrix.period.totalsAcrossEmployees;
  const totalsRow: (string | number)[] = [
    "Daily totals",
    "",
    "",
    ...dailyTotals,
    t.totalHours.toFixed(2),
    t.regularHours.toFixed(2),
    t.overtimeHours.toFixed(2),
    "",
    "",
    t.totalAbsentDays,
    `${t.attendancePercentage}%`,
  ];

  const body = [
    headers.map(escapeCsv).join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
    totalsRow.map(escapeCsv).join(","),
  ].join("\n");

  const blob = new Blob([body], { type: "text/csv;charset=utf-8;" });
  downloadFile(blob, `${filename}.csv`);
}

function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
