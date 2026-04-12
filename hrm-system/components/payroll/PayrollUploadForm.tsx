"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import { Upload, Loader2, FileText, CheckCircle } from "lucide-react";

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

export default function PayrollUploadForm({ employees, adminId }: PayrollUploadFormProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    employee_id: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please select a PDF file");
        setSelectedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError("File size must be less than 10MB");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError("Please select a PDF file");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", selectedFile);
      formDataToSend.append("employee_id", formData.employee_id);
      formDataToSend.append("month", formData.month.toString());
      formDataToSend.append("year", formData.year.toString());

      const { error: uploadError } = await callApi("/api/payroll/upload-slip", {
        method: "POST",
        body: formDataToSend,
      });

      if (uploadError) throw new Error(uploadError);

      // Success
      setSuccess(true);
      setSelectedFile(null);
      setFormData({
        employee_id: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
      
      // Reset file input
      const fileInput = document.getElementById("file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      router.refresh();

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to upload salary slip");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="card p-6">
      <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
        Upload Salary Slip
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            className="text-sm p-3 rounded flex items-start gap-2"
            style={{
              backgroundColor: "var(--tag-danger-bg)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "var(--tag-danger)",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="text-sm p-3 rounded flex items-center gap-2"
            style={{
              backgroundColor: "var(--tag-success-bg)",
              border: "1px solid var(--tag-success-border)",
              color: "var(--tag-success)",
            }}
          >
            <CheckCircle className="w-4 h-4" />
            Salary slip uploaded successfully!
          </div>
        )}

        <div>
          <label htmlFor="employee_id" className="label">
            Employee *
          </label>
          <select
            id="employee_id"
            name="employee_id"
            value={formData.employee_id}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="">Select employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.profiles?.full_name} ({emp.profiles?.email})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="month" className="label">
              Month *
            </label>
            <select
              id="month"
              name="month"
              value={formData.month}
              onChange={handleChange}
              className="input"
              required
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="year" className="label">
              Year *
            </label>
            <select
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="input"
              required
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="file" className="label">
            PDF File *
          </label>
          <div className="mt-1">
            <label
              htmlFor="file"
              className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded cursor-pointer hover:border-orange-300 transition-colors"
              style={{ borderColor: selectedFile ? 'var(--tag-orange)' : 'var(--tag-border-dashed)' }}
            >
              {selectedFile ? (
                <>
                  <FileText className="w-6 h-6" style={{ color: 'var(--tag-orange)' }} />
                  <div className="text-center">
                    <p className="text-sm font-normal">{selectedFile.name}</p>
                    <p className="text-xs" style={{ color: 'var(--tag-body)' }}>
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6" style={{ color: 'var(--tag-body)' }} />
                  <div className="text-center">
                    <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs" style={{ color: 'var(--tag-body)' }}>
                      PDF files only (max 10MB)
                    </p>
                  </div>
                </>
              )}
            </label>
            <input
              id="file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              required
            />
          </div>
        </div>

        <div className="pt-4 border-t" style={{ borderColor: "var(--tag-border)" }}>
          <button
            type="submit"
            disabled={loading || !selectedFile}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Salary Slip
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
