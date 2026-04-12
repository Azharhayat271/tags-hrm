"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Manager {
  id: string;
  profiles: {
    full_name: string;
  } | null;
}

interface Designation {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  profile_id: string;
  designation_id: string | null;
  department_id: string | null;
  employment_type: string | null;
  joining_date: string | null;
  reports_to: string | null;
  profiles: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
}

interface EditEmployeeFormProps {
  employee: Employee;
  managers: Manager[];
}

export default function EditEmployeeForm({ employee, managers }: EditEmployeeFormProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [formData, setFormData] = useState({
    full_name: employee.profiles?.full_name || "",
    email: employee.profiles?.email || "",
    phone: employee.profiles?.phone || "",
    designation_id: employee.designation_id || "",
    department_id: employee.department_id || "",
    employment_type: employee.employment_type || "full_time",
    joining_date: employee.joining_date || "",
    reports_to: employee.reports_to || "",
  });

  useEffect(() => {
    console.log("EditEmployeeForm mounted, starting data fetch...");
    
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        console.log("Fetching designations and departments...");
        const [designationsRes, departmentsRes] = await Promise.all([
          callApi("/api/settings/designations", { method: "GET" }),
          callApi("/api/settings/departments", { method: "GET" }),
        ]);

        console.log("Designations Response:", designationsRes);
        console.log("Departments Response:", departmentsRes);

        if (designationsRes.error) throw new Error(designationsRes.error);
        if (departmentsRes.error) throw new Error(departmentsRes.error);

        if (isMounted) {
          setDesignations(designationsRes.data || []);
          setDepartments(departmentsRes.data || []);
          setFetchingData(false);
          clearTimeout(timeoutId);
          console.log("Successfully loaded designations and departments");
        }
      } catch (err: any) {
        console.error("Error fetching:", err);
        if (isMounted) {
          setError(err.message || "Failed to load designations and departments");
          setFetchingData(false);
          clearTimeout(timeoutId);
        }
      }
    };

    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.error("Data fetch timeout - still loading after 20 seconds");
        setFetchingData(false);
        setError("Failed to load form data. Please refresh the page.");
      }
    }, 20000);

    fetchData();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [callApi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: apiError } = await callApi(`/api/employees/${employee.id}`, {
        method: "PATCH",
        body: {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          designation_id: formData.designation_id,
          department_id: formData.department_id,
          employment_type: formData.employment_type,
          joining_date: formData.joining_date,
          reports_to: formData.reports_to,
        },
      });

      if (apiError) {
        throw new Error(apiError);
      }

      // Success - redirect to employee detail page
      router.push(`/admin/employees/${employee.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update employee");
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (fetchingData) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading form data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div
            className="text-sm p-3 rounded"
            style={{
              backgroundColor: "var(--tag-danger-bg)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "var(--tag-danger)",
            }}
          >
            {error}
          </div>
        )}

        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-light mb-4" style={{ letterSpacing: "-0.22px" }}>
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="full_name" className="label">
                Full Name *
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="label">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div>
          <h3 className="text-lg font-light mb-4" style={{ letterSpacing: "-0.22px" }}>
            Employment Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="designation_id" className="label">
                Designation *
              </label>
              <select
                id="designation_id"
                name="designation_id"
                value={formData.designation_id}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Select a designation</option>
                {designations.map((des) => (
                  <option key={des.id} value={des.id}>
                    {des.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="department_id" className="label">
                Department *
              </label>
              <select
                id="department_id"
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Select a department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="employment_type" className="label">
                Employment Type *
              </label>
              <select
                id="employment_type"
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>

            <div>
              <label htmlFor="joining_date" className="label">
                Joining Date
              </label>
              <input
                id="joining_date"
                name="joining_date"
                type="date"
                value={formData.joining_date}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="reports_to" className="label">
                Reports To
              </label>
              <select
                id="reports_to"
                name="reports_to"
                value={formData.reports_to}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select Manager</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.profiles?.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: "var(--tag-border)" }}>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Updating..." : "Update Employee"}
          </button>
          <Link href={`/admin/employees/${employee.id}`} className="btn-ghost">
            <ArrowLeft className="w-4 h-4 mr-2 inline" />
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
