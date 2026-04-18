"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText, File } from "lucide-react";
import type { AttendanceMatrix } from "@/lib/attendance/aggregate";

interface ExportButtonsProps {
  matrix: AttendanceMatrix;
  filename: string;
  periodLabel: string;
}

export default function ExportButtons({ matrix, filename, periodLabel }: ExportButtonsProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"xlsx" | "pdf" | "csv" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const close = () => setOpen(false);

  const handleXlsx = async () => {
    try {
      setBusy("xlsx");
      close();
      const { exportMatrixXlsx } = await import("@/lib/attendance/exporters/xlsx");
      await exportMatrixXlsx(matrix, { periodLabel }, filename);
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = async () => {
    try {
      setBusy("pdf");
      close();
      const { downloadMatrixPdf } = await import("@/lib/attendance/exporters/pdf");
      await downloadMatrixPdf(matrix, periodLabel, filename);
    } finally {
      setBusy(null);
    }
  };

  const handleCsv = async () => {
    try {
      setBusy("csv");
      close();
      const { downloadMatrixCsv } = await import("@/lib/utils/export");
      downloadMatrixCsv(matrix, filename);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
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
          <MenuItem icon={FileSpreadsheet} label="Excel (.xlsx)" onClick={handleXlsx} />
          <MenuItem icon={FileText} label="PDF (.pdf)" onClick={handlePdf} />
          <MenuItem icon={File} label="CSV (.csv)" onClick={handleCsv} />
        </div>
      )}
    </div>
  );
}

function MenuItem({
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
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
      style={{ color: "var(--text-primary)" }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--tag-bg-warm)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <Icon className="w-4 h-4" style={{ color: "var(--accent)" }} />
      {label}
    </button>
  );
}
