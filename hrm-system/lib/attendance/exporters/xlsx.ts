import ExcelJS from "exceljs";
import type { AttendanceMatrix, AttendanceMatrixRow } from "@/lib/attendance/aggregate";

const BRAND_ORANGE = "FFF97316";
const LIGHT_ORANGE = "FFFDECDC";
const WEEKEND_FILL = "FFF4F4F1";
const HOLIDAY_FILL = "FFEAEFF5";
const OT_FILL = "FFFFE6CC";
const GREEN_FILL = "FFDCF3E2";
const RED_FILL = "FFFBE0E0";
const AMBER_FILL = "FFFDEFC9";
const HEADER_FILL = "FF1F2937";

function triggerDownload(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDayLabel(dayKey: string): { top: string; bottom: string } {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    top: date.toLocaleDateString("en-US", { weekday: "short" }),
    bottom: `${date.toLocaleDateString("en-US", { month: "short" })} ${date.getDate()}`,
  };
}

function styleHeader(cell: ExcelJS.Cell) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 10 };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  cell.border = {
    top: { style: "thin", color: { argb: "FF4B5563" } },
    left: { style: "thin", color: { argb: "FF4B5563" } },
    bottom: { style: "thin", color: { argb: "FF4B5563" } },
    right: { style: "thin", color: { argb: "FF4B5563" } },
  };
}

function styleCell(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: "thin", color: { argb: "FFE5E7EB" } },
    left: { style: "thin", color: { argb: "FFE5E7EB" } },
    bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
    right: { style: "thin", color: { argb: "FFE5E7EB" } },
  };
}

export interface ExportMeta {
  periodLabel: string;
  generatedAt?: Date;
  companyName?: string;
}

export async function exportMatrixXlsx(
  matrix: AttendanceMatrix,
  meta: ExportMeta,
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = meta.companyName || "HRM System";
  workbook.created = meta.generatedAt || new Date();

  buildMatrixSheet(workbook, matrix, meta);
  buildSummarySheet(workbook, matrix, meta);

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer as ArrayBuffer, `${filename}.xlsx`);
}

function buildMatrixSheet(workbook: ExcelJS.Workbook, matrix: AttendanceMatrix, meta: ExportMeta) {
  const sheet = workbook.addWorksheet("Matrix", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 4 }],
  });

  sheet.mergeCells(1, 1, 1, matrix.dayKeys.length + 5);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `Attendance — ${meta.periodLabel}`;
  titleCell.font = { bold: true, size: 14, color: { argb: HEADER_FILL } };
  titleCell.alignment = { horizontal: "left", vertical: "middle" };
  sheet.getRow(1).height = 24;

  sheet.mergeCells(2, 1, 2, matrix.dayKeys.length + 5);
  const subCell = sheet.getCell(2, 1);
  subCell.value = `Generated ${new Date().toLocaleString()} · ${matrix.rows.length} employees · ${
    matrix.period.workingDayCount
  } working days`;
  subCell.font = { italic: true, color: { argb: "FF6B7280" }, size: 9 };

  sheet.getRow(3).values = []; // spacer

  const headerRowIdx = 4;
  const headerRow = sheet.getRow(headerRowIdx);

  const headers: Array<{ col: number; label: string; width: number }> = [
    { col: 1, label: "Employee", width: 28 },
  ];
  matrix.dayKeys.forEach((dk, i) => {
    const info = formatDayLabel(dk);
    headers.push({ col: 2 + i, label: `${info.top}\n${info.bottom}`, width: 10 });
  });
  const totalCol = 2 + matrix.dayKeys.length;
  headers.push({ col: totalCol, label: "Total", width: 11 });
  headers.push({ col: totalCol + 1, label: "Regular", width: 11 });
  headers.push({ col: totalCol + 2, label: "OT", width: 10 });

  headers.forEach((h) => {
    const cell = headerRow.getCell(h.col);
    cell.value = h.label;
    styleHeader(cell);
    sheet.getColumn(h.col).width = h.width;
  });
  headerRow.height = 34;

  matrix.dayKeys.forEach((dk, i) => {
    const isWknd = matrix.weekendDayKeys.has(dk);
    const isHol = matrix.holidayDayKeys.has(dk);
    if (isHol) {
      headerRow.getCell(2 + i).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: HOLIDAY_FILL },
      };
    } else if (isWknd) {
      headerRow.getCell(2 + i).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: WEEKEND_FILL },
      };
    }
  });

  matrix.rows.forEach((row, rowIdx) => {
    const excelRow = sheet.getRow(headerRowIdx + 1 + rowIdx);
    const nameCell = excelRow.getCell(1);
    nameCell.value = { richText: [
      { text: row.employeeName + "\n", font: { bold: true, size: 10 } },
      { text: row.employeeEmail, font: { color: { argb: "FF6B7280" }, size: 9 } },
    ] };
    nameCell.alignment = { vertical: "middle", wrapText: true };
    styleCell(nameCell);

    matrix.dayKeys.forEach((dk, i) => {
      const cell = excelRow.getCell(2 + i);
      const day = row.dayHours[dk];
      cell.value = day.total > 0 ? Number(day.total.toFixed(2)) : null;
      cell.numFmt = "0.0";
      cell.alignment = { horizontal: "center", vertical: "middle" };
      styleCell(cell);
      let fill: string | null = null;
      if (day.overtime > 0) fill = OT_FILL;
      else if (day.total >= 8) fill = GREEN_FILL;
      else if (day.total > 0) fill = AMBER_FILL;
      else if (!day.isWeekend && !day.isHoliday) fill = RED_FILL;
      else if (day.isHoliday) fill = HOLIDAY_FILL;
      else if (day.isWeekend) fill = WEEKEND_FILL;
      if (fill) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      }
    });

    const total = excelRow.getCell(totalCol);
    total.value = Number(row.totals.totalHours.toFixed(2));
    total.numFmt = "0.0";
    total.alignment = { horizontal: "center" };
    total.font = { bold: true };
    styleCell(total);

    const regular = excelRow.getCell(totalCol + 1);
    regular.value = Number(row.totals.regularHours.toFixed(2));
    regular.numFmt = "0.0";
    regular.alignment = { horizontal: "center" };
    styleCell(regular);

    const ot = excelRow.getCell(totalCol + 2);
    ot.value = row.totals.overtimeHours > 0 ? Number(row.totals.overtimeHours.toFixed(2)) : 0;
    ot.numFmt = "0.0";
    ot.alignment = { horizontal: "center" };
    styleCell(ot);
    if (row.totals.overtimeHours > 0) {
      ot.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_ORANGE } };
      ot.font = { color: { argb: BRAND_ORANGE.slice(2) }, bold: true };
    }

  });

  const footerRow = sheet.getRow(headerRowIdx + 1 + matrix.rows.length);
  const footerName = footerRow.getCell(1);
  footerName.value = "Daily totals";
  footerName.font = { bold: true };
  styleCell(footerName);
  footerName.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
  matrix.dayKeys.forEach((dk, i) => {
    const total = matrix.rows.reduce((s, r) => s + (r.dayHours[dk]?.total || 0), 0);
    const cell = footerRow.getCell(2 + i);
    cell.value = total > 0 ? Number(total.toFixed(2)) : null;
    cell.numFmt = "0.0";
    cell.alignment = { horizontal: "center" };
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
    styleCell(cell);
  });
  const t = matrix.period.totalsAcrossEmployees;
  const footerTotal = footerRow.getCell(totalCol);
  footerTotal.value = Number(t.totalHours.toFixed(2));
  footerTotal.numFmt = "0.0";
  footerTotal.font = { bold: true };
  footerTotal.alignment = { horizontal: "center" };
  footerTotal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
  styleCell(footerTotal);
  const footerRegular = footerRow.getCell(totalCol + 1);
  footerRegular.value = Number(t.regularHours.toFixed(2));
  footerRegular.numFmt = "0.0";
  footerRegular.font = { bold: true };
  footerRegular.alignment = { horizontal: "center" };
  footerRegular.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
  styleCell(footerRegular);
  const footerOt = footerRow.getCell(totalCol + 2);
  footerOt.value = Number(t.overtimeHours.toFixed(2));
  footerOt.numFmt = "0.0";
  footerOt.font = { bold: true, color: { argb: BRAND_ORANGE.slice(2) } };
  footerOt.alignment = { horizontal: "center" };
  footerOt.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_ORANGE } };
  styleCell(footerOt);
}

function buildSummarySheet(workbook: ExcelJS.Workbook, matrix: AttendanceMatrix, meta: ExportMeta) {
  const sheet = workbook.addWorksheet("Summary");
  sheet.mergeCells(1, 1, 1, 10);
  const title = sheet.getCell(1, 1);
  title.value = `Summary — ${meta.periodLabel}`;
  title.font = { bold: true, size: 14 };

  const headerRow = sheet.getRow(3);
  const labels = [
    { label: "Employee", width: 28 },
    { label: "Department", width: 18 },
    { label: "Present", width: 10 },
    { label: "Partial", width: 10 },
    { label: "Absent", width: 10 },
    { label: "Total (h)", width: 12 },
    { label: "Regular (h)", width: 12 },
    { label: "Overtime (h)", width: 14 },
    { label: "Attendance %", width: 14 },
  ];
  labels.forEach((l, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = l.label;
    styleHeader(cell);
    sheet.getColumn(i + 1).width = l.width;
  });

  matrix.rows.forEach((row, i) => {
    const r = sheet.getRow(4 + i);
    r.getCell(1).value = row.employeeName;
    r.getCell(2).value = row.departmentName ?? "—";
    r.getCell(3).value = row.totals.daysPresent;
    r.getCell(4).value = row.totals.daysPartial;
    r.getCell(5).value = row.totals.daysAbsent;
    r.getCell(6).value = Number(row.totals.totalHours.toFixed(2));
    r.getCell(7).value = Number(row.totals.regularHours.toFixed(2));
    r.getCell(8).value = Number(row.totals.overtimeHours.toFixed(2));
    r.getCell(9).value = row.totals.attendancePercentage / 100;
    r.getCell(9).numFmt = "0%";
    for (let c = 1; c <= 9; c++) {
      styleCell(r.getCell(c));
      if (c >= 3) r.getCell(c).alignment = { horizontal: "center" };
    }
    if (row.totals.overtimeHours > 0) {
      r.getCell(8).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_ORANGE } };
    }
    if (row.totals.daysAbsent > 0) {
      r.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: RED_FILL } };
    }
  });
}

export async function exportEmployeeXlsx(
  row: AttendanceMatrixRow,
  matrix: AttendanceMatrix,
  sessions: Array<{ check_in: string; check_out: string | null; is_manual_entry?: boolean | null; auto_closed_at?: string | null }>,
  meta: ExportMeta,
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = meta.companyName || "HRM System";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Attendance");

  sheet.mergeCells(1, 1, 1, 5);
  const title = sheet.getCell(1, 1);
  title.value = `${row.employeeName} · ${meta.periodLabel}`;
  title.font = { bold: true, size: 14 };

  sheet.mergeCells(2, 1, 2, 5);
  sheet.getCell(2, 1).value = row.employeeEmail + (row.departmentName ? ` · ${row.departmentName}` : "");
  sheet.getCell(2, 1).font = { color: { argb: "FF6B7280" }, italic: true, size: 10 };

  const kpis = [
    ["Total hours", `${row.totals.totalHours.toFixed(1)}h`],
    ["Regular hours", `${row.totals.regularHours.toFixed(1)}h`],
    ["Overtime", `${row.totals.overtimeHours.toFixed(1)}h`],
    ["Days present", String(row.totals.daysPresent)],
    ["Days absent", String(row.totals.daysAbsent)],
    ["Attendance", `${row.totals.attendancePercentage}%`],
  ];
  kpis.forEach((k, i) => {
    const r = sheet.getRow(4 + i);
    r.getCell(1).value = k[0];
    r.getCell(1).font = { color: { argb: "FF6B7280" } };
    r.getCell(2).value = k[1];
    r.getCell(2).font = { bold: true };
  });
  sheet.getColumn(1).width = 22;
  sheet.getColumn(2).width = 16;

  const daysHeaderRow = 4 + kpis.length + 2;
  const daysHeader = sheet.getRow(daysHeaderRow);
  ["Date", "Weekday", "Hours", "Regular", "OT", "First check-in", "Flags"].forEach((l, i) => {
    const c = daysHeader.getCell(i + 1);
    c.value = l;
    styleHeader(c);
  });
  [12, 12, 10, 10, 10, 16, 32].forEach((w, i) => (sheet.getColumn(i + 1).width = w));

  matrix.dayKeys.forEach((dk, i) => {
    const cell = row.dayHours[dk];
    const r = sheet.getRow(daysHeaderRow + 1 + i);
    r.getCell(1).value = dk;
    const [y, m, d] = dk.split("-").map(Number);
    r.getCell(2).value = new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
    r.getCell(3).value = Number(cell.total.toFixed(2));
    r.getCell(3).numFmt = "0.0";
    r.getCell(4).value = Number(cell.regular.toFixed(2));
    r.getCell(4).numFmt = "0.0";
    r.getCell(5).value = Number(cell.overtime.toFixed(2));
    r.getCell(5).numFmt = "0.0";
    r.getCell(6).value = cell.firstCheckIn ?? "—";
    r.getCell(7).value = cell.flags.join(", ") || (cell.isWeekend ? "weekend" : cell.isHoliday ? "holiday" : "");
    for (let c = 1; c <= 7; c++) styleCell(r.getCell(c));
    if (cell.isWeekend || cell.isHoliday) {
      for (let c = 1; c <= 7; c++) {
        r.getCell(c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: cell.isHoliday ? HOLIDAY_FILL : WEEKEND_FILL },
        };
      }
    }
    if (cell.overtime > 0) {
      r.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_ORANGE } };
      r.getCell(5).font = { bold: true };
    }
  });

  const sessionsHeaderRow = daysHeaderRow + 1 + matrix.dayKeys.length + 2;
  sheet.mergeCells(sessionsHeaderRow - 1, 1, sessionsHeaderRow - 1, 5);
  const sessionsTitle = sheet.getCell(sessionsHeaderRow - 1, 1);
  sessionsTitle.value = "Sessions";
  sessionsTitle.font = { bold: true, size: 12 };
  const sessionsHeader = sheet.getRow(sessionsHeaderRow);
  ["Date", "Check in", "Check out", "Duration", "Type"].forEach((l, i) => {
    const c = sessionsHeader.getCell(i + 1);
    c.value = l;
    styleHeader(c);
  });
  sessions.forEach((s, i) => {
    const r = sheet.getRow(sessionsHeaderRow + 1 + i);
    const checkIn = new Date(s.check_in);
    r.getCell(1).value = checkIn.toLocaleDateString("en-US");
    r.getCell(2).value = checkIn.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    r.getCell(3).value = s.check_out
      ? new Date(s.check_out).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "—";
    if (s.check_out) {
      const ms = new Date(s.check_out).getTime() - checkIn.getTime();
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      r.getCell(4).value = `${h}h ${m}m`;
    } else {
      r.getCell(4).value = "—";
    }
    const type = s.is_manual_entry ? "Manual" : s.auto_closed_at ? "Auto-closed" : "Regular";
    r.getCell(5).value = type;
    for (let c = 1; c <= 5; c++) styleCell(r.getCell(c));
  });

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer as ArrayBuffer, `${filename}.xlsx`);
}
