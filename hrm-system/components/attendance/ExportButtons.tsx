"use client";

import { Download } from "lucide-react";
import { generateCSV, generateExcel } from "@/lib/utils/export";

interface ExportButtonsProps {
  data: Record<string, string | number>[];
  filename: string;
}

export default function ExportButtons({ data, filename }: ExportButtonsProps) {
  const handleExportCSV = () => {
    generateCSV(data as any, filename);
  };

  const handleExportExcel = () => {
    generateExcel(data as any, filename);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportCSV}
        className="btn-ghost flex items-center gap-2"
        title="Export as CSV"
      >
        <Download className="w-4 h-4" />
        Export CSV
      </button>
      <button
        onClick={handleExportExcel}
        className="btn-ghost flex items-center gap-2"
        title="Export as Excel"
      >
        <Download className="w-4 h-4" />
        Export Excel
      </button>
    </div>
  );
}
