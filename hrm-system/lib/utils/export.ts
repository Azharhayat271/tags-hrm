export interface ExportRow {
  Employee: string;
  Email: string;
  [key: string]: string | number;
}

/**
 * Generate and download CSV file
 */
export function generateCSV(rows: ExportRow[], filename: string = "attendance.csv"): void {
  if (rows.length === 0) return;

  // Get all headers
  const headers = Object.keys(rows[0]);

  // Create CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value);
          return stringValue.includes(",") || stringValue.includes('"')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        })
        .join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadFile(blob, `${filename}.csv`);
}

/**
 * Generate and download Excel file (TSV format that Excel recognizes)
 */
export function generateExcel(rows: ExportRow[], filename: string = "attendance"): void {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);

  // Create TSV content (tab-separated) which Excel reads natively
  const tsvContent = [
    headers.join("\t"),
    ...rows.map((row) => headers.map((header) => row[header]).join("\t")),
  ].join("\n");

  const blob = new Blob([tsvContent], {
    type: "text/tab-separated-values;charset=utf-8;",
  });
  downloadFile(blob, `${filename}.xls`);
}

/**
 * Helper function to trigger file download
 */
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
