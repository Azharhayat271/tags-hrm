"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";
import type { AttendanceMatrix, AttendanceMatrixRow } from "@/lib/attendance/aggregate";

interface EmployeeExportButtonsProps {
  matrix: AttendanceMatrix;
  row: AttendanceMatrixRow;
  sessions: Array<{
    check_in: string;
    check_out: string | null;
    is_manual_entry?: boolean | null;
    auto_closed_at?: string | null;
  }>;
  periodLabel: string;
  filename: string;
}

export default function EmployeeExportButtons({
  matrix,
  row,
  sessions,
  periodLabel,
  filename,
}: EmployeeExportButtonsProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"xlsx" | "pdf" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const handleXlsx = async () => {
    try {
      setBusy("xlsx");
      setOpen(false);
      const { exportEmployeeXlsx } = await import("@/lib/attendance/exporters/xlsx");
      await exportEmployeeXlsx(row, matrix, sessions, { periodLabel }, filename);
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = async () => {
    try {
      setBusy("pdf");
      setOpen(false);
      const { downloadEmployeePdf } = await import("@/lib/attendance/exporters/pdf");
      await downloadEmployeePdf(row, matrix, periodLabel, sessions, filename);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy !== null}
        className="btn-primary inline-flex items-center gap-2"
        style={{ opacity: busy ? 0.7 : 1 }}
      >
        <Download className="w-4 h-4" />
        {busy ? `Exporting ${busy.toUpperCase()}…` : "Export"}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-md border overflow-hidden"
          style={{
            minWidth: "200px",
            backgroundColor: "var(--tag-bg)",
            borderColor: "var(--tag-border)",
            boxShadow: "var(--tag-shadow-standard)",
            zIndex: 50,
          }}
        >
          <Item icon={FileSpreadsheet} label="Excel (.xlsx)" onClick={handleXlsx} />
          <Item icon={FileText} label="PDF (.pdf)" onClick={handlePdf} />
        </div>
      )}
    </div>
  );
}

function Item({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof FileSpreadsheet;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left"
      style={{ color: "var(--text-primary)" }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--tag-bg-warm)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <Icon className="w-4 h-4" style={{ color: "var(--accent)" }} />
      {label}
    </button>
  );
}
