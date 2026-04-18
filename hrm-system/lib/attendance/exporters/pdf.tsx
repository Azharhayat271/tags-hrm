import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { AttendanceMatrix, AttendanceMatrixRow } from "@/lib/attendance/aggregate";

const COLORS = {
  text: "#1a1a1a",
  muted: "#6b7280",
  border: "#e5e7eb",
  orange: "#f97316",
  orangeLight: "#fed7aa",
  green: "#16a34a",
  greenBg: "#dcf3e2",
  yellow: "#d97706",
  yellowBg: "#fdefc9",
  red: "#dc2626",
  redBg: "#fbe0e0",
  weekend: "#f4f4f1",
  holiday: "#eaeff5",
  brand: "#1f2937",
};

const baseStyles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: COLORS.text,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 9, color: COLORS.muted, marginTop: 2 },
  metaRight: { fontSize: 9, color: COLORS.muted, textAlign: "right" },
  kpiStrip: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  kpi: {
    flex: 1,
    padding: 6,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 3,
  },
  kpiLabel: {
    fontSize: 7,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  kpiValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  kpiSub: { fontSize: 7, color: COLORS.muted, marginTop: 1 },
  table: { width: "100%", marginBottom: 8 },
  tr: { flexDirection: "row" },
  thead: {
    backgroundColor: COLORS.brand,
  },
  th: {
    color: "white",
    fontSize: 7,
    padding: 3,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    borderRight: "1px solid #4b5563",
  },
  td: {
    fontSize: 7,
    padding: 3,
    textAlign: "center",
    borderBottom: `0.5px solid ${COLORS.border}`,
    borderRight: `0.5px solid ${COLORS.border}`,
  },
  tdName: {
    textAlign: "left",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  footerRow: { backgroundColor: "#f3f4f6" },
  footerCell: { fontFamily: "Helvetica-Bold" },
  pageFooter: {
    position: "absolute",
    bottom: 12,
    left: 24,
    right: 24,
    fontSize: 7,
    color: COLORS.muted,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

interface MatrixPdfProps {
  matrix: AttendanceMatrix;
  periodLabel: string;
  generatedAt: string;
}

function fmtDay(dk: string) {
  const [y, m, d] = dk.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "narrow" }),
    day: date.getDate(),
  };
}

function cellBg(cell: AttendanceMatrix["rows"][number]["dayHours"][string]): string | undefined {
  if (cell.isHoliday) return COLORS.holiday;
  if (cell.isWeekend) return cell.total > 0 ? COLORS.orangeLight : COLORS.weekend;
  if (cell.overtime > 0) return COLORS.orangeLight;
  if (cell.total >= 8) return COLORS.greenBg;
  if (cell.total > 0) return COLORS.yellowBg;
  return COLORS.redBg;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function MatrixReportPdf({ matrix, periodLabel, generatedAt }: MatrixPdfProps) {
  const t = matrix.period.totalsAcrossEmployees;
  const pages = chunk(matrix.rows, 18);
  const dayCols = matrix.dayKeys;
  const dayWidth = Math.max(22, Math.min(40, 520 / Math.max(dayCols.length, 1)));

  return (
    <Document>
      {pages.map((pageRows, pageIdx) => (
        <Page key={pageIdx} size="A4" orientation="landscape" style={baseStyles.page}>
          <View style={baseStyles.header}>
            <View>
              <Text style={baseStyles.title}>Attendance Report</Text>
              <Text style={baseStyles.subtitle}>
                {periodLabel} · {matrix.rows.length} employees · {matrix.period.workingDayCount} working days
              </Text>
            </View>
            <Text style={baseStyles.metaRight}>
              Generated {generatedAt}{"\n"}Page {pageIdx + 1} of {pages.length}
            </Text>
          </View>

          {pageIdx === 0 && (
            <View style={baseStyles.kpiStrip}>
              <View style={baseStyles.kpi}>
                <Text style={baseStyles.kpiLabel}>Total hours</Text>
                <Text style={baseStyles.kpiValue}>{t.totalHours.toFixed(1)}h</Text>
                <Text style={baseStyles.kpiSub}>{t.regularHours.toFixed(1)}h regular</Text>
              </View>
              <View style={baseStyles.kpi}>
                <Text style={baseStyles.kpiLabel}>Overtime</Text>
                <Text style={[baseStyles.kpiValue, { color: COLORS.orange }]}>
                  {t.overtimeHours.toFixed(1)}h
                </Text>
                <Text style={baseStyles.kpiSub}>across team</Text>
              </View>
              <View style={baseStyles.kpi}>
                <Text style={baseStyles.kpiLabel}>Attendance</Text>
                <Text style={[baseStyles.kpiValue, { color: COLORS.green }]}>
                  {t.attendancePercentage}%
                </Text>
                <Text style={baseStyles.kpiSub}>{matrix.period.workingDayCount} working days</Text>
              </View>
              <View style={baseStyles.kpi}>
                <Text style={baseStyles.kpiLabel}>Absent</Text>
                <Text style={[baseStyles.kpiValue, { color: COLORS.red }]}>
                  {t.totalAbsentDays}
                </Text>
                <Text style={baseStyles.kpiSub}>day-entries</Text>
              </View>
            </View>
          )}

          <View style={baseStyles.table}>
            <View style={[baseStyles.tr, baseStyles.thead]} fixed>
              <Text style={[baseStyles.th, { width: 110, textAlign: "left" }]}>Employee</Text>
              {dayCols.map((dk) => {
                const info = fmtDay(dk);
                const isWknd = matrix.weekendDayKeys.has(dk);
                const isHol = matrix.holidayDayKeys.has(dk);
                return (
                  <Text
                    key={dk}
                    style={[
                      baseStyles.th,
                      {
                        width: dayWidth,
                        backgroundColor: isHol ? COLORS.holiday : isWknd ? COLORS.weekend : undefined,
                        color: isHol || isWknd ? COLORS.muted : "white",
                      },
                    ]}
                  >
                    {info.weekday} {info.day}
                  </Text>
                );
              })}
              <Text style={[baseStyles.th, { width: 36 }]}>Total</Text>
              <Text style={[baseStyles.th, { width: 30 }]}>OT</Text>
            </View>

            {pageRows.map((row) => (
              <View key={row.employeeId} style={baseStyles.tr} wrap={false}>
                <Text style={[baseStyles.td, baseStyles.tdName, { width: 110 }]}>
                  {row.employeeName}
                </Text>
                {dayCols.map((dk) => {
                  const cell = row.dayHours[dk];
                  const bg = cellBg(cell);
                  return (
                    <Text
                      key={dk}
                      style={[
                        baseStyles.td,
                        {
                          width: dayWidth,
                          backgroundColor: bg,
                          color: COLORS.text,
                        },
                      ]}
                    >
                      {cell.total > 0 ? cell.total.toFixed(1) : "—"}
                    </Text>
                  );
                })}
                <Text
                  style={[baseStyles.td, { width: 36, fontFamily: "Helvetica-Bold" }]}
                >
                  {row.totals.totalHours.toFixed(1)}
                </Text>
                <Text
                  style={[
                    baseStyles.td,
                    {
                      width: 30,
                      color: row.totals.overtimeHours > 0 ? COLORS.orange : COLORS.muted,
                      fontFamily: row.totals.overtimeHours > 0 ? "Helvetica-Bold" : "Helvetica",
                    },
                  ]}
                >
                  {row.totals.overtimeHours > 0 ? row.totals.overtimeHours.toFixed(1) : "—"}
                </Text>
              </View>
            ))}

            {pageIdx === pages.length - 1 && (
              <View style={[baseStyles.tr, baseStyles.footerRow]}>
                <Text style={[baseStyles.td, baseStyles.footerCell, { width: 110, textAlign: "left" }]}>
                  Daily totals
                </Text>
                {dayCols.map((dk) => {
                  const total = matrix.rows.reduce(
                    (s, r) => s + (r.dayHours[dk]?.total || 0),
                    0
                  );
                  return (
                    <Text
                      key={dk}
                      style={[baseStyles.td, baseStyles.footerCell, { width: dayWidth }]}
                    >
                      {total > 0 ? total.toFixed(1) : "—"}
                    </Text>
                  );
                })}
                <Text style={[baseStyles.td, baseStyles.footerCell, { width: 36 }]}>
                  {t.totalHours.toFixed(1)}
                </Text>
                <Text
                  style={[
                    baseStyles.td,
                    baseStyles.footerCell,
                    { width: 30, color: COLORS.orange },
                  ]}
                >
                  {t.overtimeHours.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          <View style={baseStyles.pageFooter} fixed>
            <Text>HRM Attendance Report</Text>
            <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </Page>
      ))}
    </Document>
  );
}

interface EmployeePdfProps {
  row: AttendanceMatrixRow;
  matrix: AttendanceMatrix;
  periodLabel: string;
  generatedAt: string;
  sessions: Array<{
    check_in: string;
    check_out: string | null;
    is_manual_entry?: boolean | null;
    auto_closed_at?: string | null;
  }>;
}

export function EmployeeReportPdf({
  row,
  matrix,
  periodLabel,
  generatedAt,
  sessions,
}: EmployeePdfProps) {
  const dailyRows = matrix.dayKeys
    .map((dk) => ({ dk, cell: row.dayHours[dk] }))
    .filter((d) => d.cell.total > 0 || (!d.cell.isWeekend && !d.cell.isHoliday));

  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <View style={baseStyles.header}>
          <View>
            <Text style={baseStyles.title}>{row.employeeName}</Text>
            <Text style={baseStyles.subtitle}>
              {row.employeeEmail}
              {row.departmentName ? ` · ${row.departmentName}` : ""}
            </Text>
            <Text style={baseStyles.subtitle}>Attendance · {periodLabel}</Text>
          </View>
          <Text style={baseStyles.metaRight}>Generated {generatedAt}</Text>
        </View>

        <View style={baseStyles.kpiStrip}>
          <View style={baseStyles.kpi}>
            <Text style={baseStyles.kpiLabel}>Total</Text>
            <Text style={baseStyles.kpiValue}>{row.totals.totalHours.toFixed(1)}h</Text>
          </View>
          <View style={baseStyles.kpi}>
            <Text style={baseStyles.kpiLabel}>Regular</Text>
            <Text style={baseStyles.kpiValue}>{row.totals.regularHours.toFixed(1)}h</Text>
          </View>
          <View style={baseStyles.kpi}>
            <Text style={baseStyles.kpiLabel}>Overtime</Text>
            <Text style={[baseStyles.kpiValue, { color: COLORS.orange }]}>
              {row.totals.overtimeHours.toFixed(1)}h
            </Text>
          </View>
          <View style={baseStyles.kpi}>
            <Text style={baseStyles.kpiLabel}>Attendance</Text>
            <Text style={[baseStyles.kpiValue, { color: COLORS.green }]}>
              {row.totals.attendancePercentage}%
            </Text>
          </View>
        </View>

        <View style={baseStyles.kpiStrip}>
          <View style={baseStyles.kpi}>
            <Text style={baseStyles.kpiLabel}>Present</Text>
            <Text style={baseStyles.kpiValue}>{row.totals.daysPresent}</Text>
          </View>
          <View style={baseStyles.kpi}>
            <Text style={baseStyles.kpiLabel}>Partial</Text>
            <Text style={baseStyles.kpiValue}>{row.totals.daysPartial}</Text>
          </View>
          <View style={baseStyles.kpi}>
            <Text style={baseStyles.kpiLabel}>Absent</Text>
            <Text style={[baseStyles.kpiValue, { color: COLORS.red }]}>
              {row.totals.daysAbsent}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 6 }}>
          Daily breakdown
        </Text>
        <View style={baseStyles.table}>
          <View style={[baseStyles.tr, baseStyles.thead]} fixed>
            <Text style={[baseStyles.th, { width: 80, textAlign: "left" }]}>Date</Text>
            <Text style={[baseStyles.th, { width: 70 }]}>Weekday</Text>
            <Text style={[baseStyles.th, { width: 60 }]}>Hours</Text>
            <Text style={[baseStyles.th, { width: 60 }]}>Regular</Text>
            <Text style={[baseStyles.th, { width: 60 }]}>OT</Text>
            <Text style={[baseStyles.th, { width: 80 }]}>First in</Text>
            <Text style={[baseStyles.th, { width: 120, textAlign: "left" }]}>Flags</Text>
          </View>
          {dailyRows.map((d) => {
            const [y, m, day] = d.dk.split("-").map(Number);
            const date = new Date(y, m - 1, day);
            return (
              <View key={d.dk} style={baseStyles.tr} wrap={false}>
                <Text style={[baseStyles.td, { width: 80, textAlign: "left" }]}>{d.dk}</Text>
                <Text style={[baseStyles.td, { width: 70 }]}>
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </Text>
                <Text style={[baseStyles.td, { width: 60, fontFamily: "Helvetica-Bold" }]}>
                  {d.cell.total.toFixed(1)}
                </Text>
                <Text style={[baseStyles.td, { width: 60 }]}>{d.cell.regular.toFixed(1)}</Text>
                <Text
                  style={[
                    baseStyles.td,
                    { width: 60, color: d.cell.overtime > 0 ? COLORS.orange : COLORS.muted },
                  ]}
                >
                  {d.cell.overtime > 0 ? d.cell.overtime.toFixed(1) : "—"}
                </Text>
                <Text style={[baseStyles.td, { width: 80 }]}>
                  {d.cell.firstCheckIn ?? "—"}
                </Text>
                <Text style={[baseStyles.td, { width: 120, textAlign: "left" }]}>
                  {d.cell.flags.join(", ") || "—"}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 6 }}>
          Sessions
        </Text>
        <View style={baseStyles.table}>
          <View style={[baseStyles.tr, baseStyles.thead]} fixed>
            <Text style={[baseStyles.th, { width: 80, textAlign: "left" }]}>Date</Text>
            <Text style={[baseStyles.th, { width: 60 }]}>Check in</Text>
            <Text style={[baseStyles.th, { width: 60 }]}>Check out</Text>
            <Text style={[baseStyles.th, { width: 70 }]}>Duration</Text>
            <Text style={[baseStyles.th, { width: 70 }]}>Type</Text>
          </View>
          {sessions.map((s, idx) => {
            const checkIn = new Date(s.check_in);
            const date = checkIn.toLocaleDateString("en-US");
            const inStr = checkIn.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });
            let outStr = "—";
            let dur = "—";
            if (s.check_out) {
              const co = new Date(s.check_out);
              outStr = co.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              const ms = co.getTime() - checkIn.getTime();
              const h = Math.floor(ms / 3600000);
              const m = Math.floor((ms % 3600000) / 60000);
              dur = `${h}h ${m}m`;
            }
            const type = s.is_manual_entry ? "Manual" : s.auto_closed_at ? "Auto-closed" : "Regular";
            return (
              <View key={idx} style={baseStyles.tr} wrap={false}>
                <Text style={[baseStyles.td, { width: 80, textAlign: "left" }]}>{date}</Text>
                <Text style={[baseStyles.td, { width: 60 }]}>{inStr}</Text>
                <Text style={[baseStyles.td, { width: 60 }]}>{outStr}</Text>
                <Text style={[baseStyles.td, { width: 70 }]}>{dur}</Text>
                <Text style={[baseStyles.td, { width: 70 }]}>{type}</Text>
              </View>
            );
          })}
        </View>

        <View style={baseStyles.pageFooter} fixed>
          <Text>{row.employeeName} · Attendance report</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function downloadMatrixPdf(
  matrix: AttendanceMatrix,
  periodLabel: string,
  filename: string
): Promise<void> {
  const generatedAt = new Date().toLocaleString();
  const blob = await pdf(
    <MatrixReportPdf matrix={matrix} periodLabel={periodLabel} generatedAt={generatedAt} />
  ).toBlob();
  triggerDownload(blob, `${filename}.pdf`);
}

export async function downloadEmployeePdf(
  row: AttendanceMatrixRow,
  matrix: AttendanceMatrix,
  periodLabel: string,
  sessions: EmployeePdfProps["sessions"],
  filename: string
): Promise<void> {
  const generatedAt = new Date().toLocaleString();
  const blob = await pdf(
    <EmployeeReportPdf
      row={row}
      matrix={matrix}
      periodLabel={periodLabel}
      generatedAt={generatedAt}
      sessions={sessions}
    />
  ).toBlob();
  triggerDownload(blob, `${filename}.pdf`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
