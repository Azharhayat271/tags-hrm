"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import {
  Button,
  Field,
  Input,
  PasswordInput,
  Select,
  FormError,
  FormSection,
  FormActions,
  useToast,
} from "@/components/ui";

export default function NewAdminForm() {
  const router = useRouter();
  const { callApi } = useApiCall();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "admin" as "admin" | "super_admin",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: apiError } = await callApi("/api/admins", {
        method: "POST",
        body: formData,
      });

      if (apiError) throw new Error(apiError);

      toast.success(
        "Admin created",
        `${formData.fullName} can now sign in with ${formData.email}.`,
      );
      router.push("/super-admin/admins");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create admin");
      toast.error("Could not create admin", err.message);
      setLoading(false);
    }
  };

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
            eyebrow="Identity"
            title="Who is this admin?"
            description="Use the admin's real name and work email. They'll get an invitation at this address."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full name" required>
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                  />
                )}
              </Field>
            </div>
          </FormSection>

          <FormSection
            eyebrow="Access"
            title="Role & password"
            description="Pick the access level. A temporary password will let them sign in on first use."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Role" required>
                {({ id }) => (
                  <Select
                    id={id}
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as "admin" | "super_admin",
                      })
                    }
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super admin</option>
                  </Select>
                )}
              </Field>
              <Field label="Temporary password" required hint="Minimum 6 characters.">
                {({ id, invalid }) => (
                  <PasswordInput
                    id={id}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    invalid={invalid}
                    autoComplete="new-password"
                  />
                )}
              </Field>
            </div>
          </FormSection>
        </div>

        <FormActions align="split" className="px-6 py-4 bg-surface-muted mt-0 border-t-0">
          <span className="text-[11px] text-ink-tertiary font-mono tabular-nums">
            Super admins can create other admins and change system settings.
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {loading ? "Creating…" : "Create admin"}
            </Button>
          </div>
        </FormActions>
      </form>
    </div>
  );
}
