"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";
import {
  Button,
  Field,
  Select,
  FormError,
  FormSection,
  FormActions,
  useToast,
  cn,
} from "@/components/ui";

interface Employee {
  id: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

interface PayrollUploadFormProps {
  employees: Employee[];
  adminId: string;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export default function PayrollUploadForm({ employees }: PayrollUploadFormProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const toast = useToast();

  const inputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const validateAndSet = useCallback((file: File | undefined | null) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please select a PDF file.");
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("File size must be less than 10 MB.");
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    validateAndSet(e.dataTransfer.files?.[0]);
  }, [validateAndSet]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  }, [dragActive]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const clearFile = () => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a PDF file.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("employee_id", formData.employee_id);
      fd.append("month", formData.month.toString());
      fd.append("year", formData.year.toString());

      const { error: uploadError } = await callApi("/api/payroll/upload-slip", {
        method: "POST",
        body: fd,
      });

      if (uploadError) throw new Error(uploadError);

      const employee = employees.find((emp) => emp.id === formData.employee_id);
      toast.success(
        "Salary slip uploaded",
        employee
          ? `Sent to ${employee.profiles?.full_name ?? "employee"} for ${monthName(formData.month)} ${formData.year}.`
          : undefined,
      );

      clearFile();
      setFormData((prev) => ({ ...prev, employee_id: "" }));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to upload salary slip");
      toast.error("Upload failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="rounded-md border border-line-subtle bg-surface-raised shadow-e1 overflow-hidden">
      <div className="px-6 pt-5 pb-1">
        <span className="eyebrow">Payroll</span>
        <h2 className="text-[1.25rem] font-light tracking-[-0.015em] text-ink-primary mt-0.5">
          Upload salary slip
        </h2>
        <p className="text-[13px] text-ink-tertiary mt-1 leading-relaxed">
          Attach a PDF payslip, pick the employee and period, and send it to their profile.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="px-6 pt-4">
            <FormError>{error}</FormError>
          </div>
        )}

        <div className="px-6 divide-y divide-line-subtle">
          <FormSection
            eyebrow="Recipient"
            title="Who is this for?"
            description="Choose the employee and the payslip's month + year."
          >
            <Field label="Employee" required>
              {({ id, invalid }) => (
                <Select
                  id={id}
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  required
                  invalid={invalid}
                >
                  <option value="">Select an employee…</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.profiles?.full_name} · {emp.profiles?.email}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Month" required>
                {({ id }) => (
                  <Select id={id} name="month" value={formData.month} onChange={handleChange} required>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {monthName(m)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Year" required>
                {({ id }) => (
                  <Select id={id} name="year" value={formData.year} onChange={handleChange} required>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          </FormSection>

          <FormSection
            eyebrow="File"
            title="Payslip PDF"
            description="Drag the file onto the drop zone or click to browse. PDF only, up to 10 MB."
          >
            <label
              htmlFor="payroll-file"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                "relative flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-sm",
                "border border-dashed cursor-pointer text-center",
                "transition-[border-color,background-color] duration-base ease-out-expo",
                selectedFile
                  ? "border-[var(--accent-wash)] bg-accent-tint/40"
                  : dragActive
                  ? "border-accent bg-accent-tint/60"
                  : "border-line hover:border-line-strong hover:bg-surface-muted",
              )}
            >
              {selectedFile ? (
                <>
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-sm bg-surface-raised border border-line-subtle shadow-e1">
                    <FileText className="w-5 h-5 text-ink-accent" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 max-w-full">
                    <p className="text-[13px] text-ink-primary truncate font-medium">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-ink-tertiary font-mono tabular-nums mt-1">
                      {formatBytes(selectedFile.size)} · PDF
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--success-text)]">
                      <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
                      Ready to upload
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        clearFile();
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 text-[11px] text-ink-tertiary",
                        "hover:text-[var(--danger-text)] transition-colors",
                      )}
                    >
                      <X className="w-3 h-3" strokeWidth={2} />
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-sm bg-surface-sunken border border-line-subtle text-ink-tertiary">
                    <Upload className="w-5 h-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-[13px] text-ink-primary">
                      {dragActive ? "Drop it here" : "Drop a PDF or click to browse"}
                    </p>
                    <p className="text-[11px] text-ink-tertiary mt-1 font-mono tabular-nums">
                      PDF only · max 10 MB
                    </p>
                  </div>
                </>
              )}
              <input
                ref={inputRef}
                id="payroll-file"
                type="file"
                accept="application/pdf"
                onChange={(e) => validateAndSet(e.target.files?.[0])}
                className="sr-only"
                required
              />
            </label>
          </FormSection>
        </div>

        <FormActions align="split" className="px-6 py-4 bg-surface-muted mt-0 border-t-0">
          <span className="text-[11px] text-ink-tertiary font-mono tabular-nums">
            Files are stored privately and linked to the selected employee only.
          </span>
          <Button type="submit" disabled={!selectedFile} loading={loading}>
            {loading ? "Uploading…" : "Upload salary slip"}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}

function monthName(m: number): string {
  return [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][Math.max(0, Math.min(11, m - 1))];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
