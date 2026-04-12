"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, ExternalLink } from "lucide-react";

interface PDFViewerProps {
  pdfUrl: string;
}

export default function PDFViewer({ pdfUrl }: PDFViewerProps) {
  return (
    <div className="card p-6">
      <div className="flex flex-col items-center">
        {/* Embedded PDF viewer using iframe */}
        <div className="w-full" style={{ height: '80vh', minHeight: '600px' }}>
          <iframe
            src={pdfUrl}
            className="w-full h-full rounded border"
            style={{ borderColor: 'var(--tag-border)' }}
            title="Salary Slip PDF"
          />
        </div>

        {/* Alternative: Open in new tab */}
        <div className="mt-4">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </a>
        </div>
      </div>
    </div>
  );
}
