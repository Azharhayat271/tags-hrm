"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import Link from "next/link";
import {
  Button,
  Field,
  Input,
  PasswordInput,
  Select,
  FormError,
  FormSection,
  FormActions,
  Skeleton,
  useToast,
} from "@/components/ui";

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

interface NewEmployeeFormProps {
  managers: Manager[];
}

export default function NewEmployeeForm({ managers }: NewEmployeeFormProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    designation_id: "",
    department_id: "",
    employment_type: "full_time",
    joining_date: "",
    reports_to: "",
  });

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      if (isMounted) {
        setFetchingData(false);
        setError("Failed to load form data. Please refresh the page.");
      }
    }, 20000);

    (async () => {
      try {
        const [designationsRes, departmentsRes] = await Promise.all([
          callApi("/api/settings/designations", { method: "GET" }),
          callApi("/api/settings/departments", { method: "GET" }),
        ]);
        if (designationsRes.error) throw new Error(designationsRes.error);
        if (departmentsRes.error) throw new Error(departmentsRes.error);
        if (!isMounted) return;
        setDesignations(designationsRes.data || []);
        setDepartments(departmentsRes.data || []);
        setFetchingData(false);
        clearTimeout(timeout);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || "Failed to load designations and departments");
        setFetchingData(false);
        clearTimeout(timeout);
      }
    })();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [callApi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: apiError } = await callApi("/api/employees/create", {
        method: "POST",
        body: {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          designation_id: formData.designation_id,
          department_id: formData.department_id,
          employment_type: formData.employment_type,
          joining_date: formData.joining_date,
          reports_to: formData.reports_to,
        },
      });

      if (apiError) throw new Error(apiError);

      toast.success("Employee created", `${formData.full_name} has been added to the roster.`);
      router.push("/admin/employees");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create employee");
      toast.error("Could not create employee", err.message);
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (fetchingData) {
    return (
      <div className="rounded-md border border-line-subtle bg-surface-raised shadow-e1 p-8">
        <div className="space-y-8">
          <Skeleton height={14} width={120} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton height={10} width={80} />
                <Skeleton height={36} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-line-subtle bg-surface-raised shadow-e1 overflow-hidden">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="px-6 pt-5">
            <FormError>{error}</FormError>
          </div>
        )}

        <div className="px-6 divide-y divide-line-subtle">
          <FormSection
            eyebrow="01 · Person"
            title="Personal information"
            description="Basic details used for login, communication, and payroll."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full name" required>
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    invalid={invalid}
                    placeholder="Jane Doe"
                  />
                )}
              </Field>
              <Field label="Work email" required>
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    invalid={invalid}
                    placeholder="jane@tagsolutions.com"
                  />
                )}
              </Field>
              <Field label="Phone" optional>
                {({ id }) => (
                  <Input
                    id={id}
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+92 300 1234567"
                  />
                )}
              </Field>
              <Field
                label="Temporary password"
                required
                hint="Must be at least 6 characters. The user can change this after first sign-in."
              >
                {({ id, invalid }) => (
                  <PasswordInput
                    id={id}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    invalid={invalid}
                    autoComplete="new-password"
                  />
                )}
              </Field>
            </div>
          </FormSection>

          <FormSection
            eyebrow="02 · Role"
            title="Employment details"
            description="Where this person fits in the organization and when they joined."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Designation" required>
                {({ id, invalid }) => (
                  <Select
                    id={id}
                    name="designation_id"
                    value={formData.designation_id}
                    onChange={handleChange}
                    required
                    invalid={invalid}
                  >
                    <option value="">Select a designation…</option>
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Department" required>
                {({ id, invalid }) => (
                  <Select
                    id={id}
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    required
                    invalid={invalid}
                  >
                    <option value="">Select a department…</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Employment type" required>
                {({ id, invalid }) => (
                  <Select
                    id={id}
                    name="employment_type"
                    value={formData.employment_type}
                    onChange={handleChange}
                    required
                    invalid={invalid}
                  >
                    <option value="full_time">Full time</option>
                    <option value="part_time">Part time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </Select>
                )}
              </Field>
              <Field label="Joining date" optional>
                {({ id }) => (
                  <Input
                    id={id}
                    name="joining_date"
                    type="date"
                    value={formData.joining_date}
                    onChange={handleChange}
                    className="font-mono tabular-nums"
                  />
                )}
              </Field>
              <Field label="Reports to" optional>
                {({ id }) => (
                  <Select
                    id={id}
                    name="reports_to"
                    value={formData.reports_to}
                    onChange={handleChange}
                  >
                    <option value="">No manager</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.profiles?.full_name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          </FormSection>
        </div>

        <FormActions align="split" className="px-6 py-4 bg-surface-muted mt-0 border-t-0">
          <span className="text-[11px] text-ink-tertiary font-mono tabular-nums">
            A temporary password will be emailed to the user.
          </span>
          <div className="flex items-center gap-2">
            <Link href="/admin/employees">
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
            <Button type="submit" loading={loading}>
              {loading ? "Creating…" : "Create employee"}
            </Button>
          </div>
        </FormActions>
      </form>
    </div>
  );
}
