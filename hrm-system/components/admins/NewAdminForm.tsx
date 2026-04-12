"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";

export default function NewAdminForm() {
  const router = useRouter();
  const { callApi } = useApiCall();
  const [loading, setLoading] = useState(false);
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

    try {
      const { error } = await callApi("/api/admins", {
        method: "POST",
        body: formData,
      });

      if (error) throw new Error(error);

      router.push("/super-admin/admins");
      router.refresh();
    } catch (error: any) {
      console.error("Error creating admin:", error);
      alert(error.message || "Failed to create admin. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-6">
      <div>
        <label className="block text-sm mb-2" style={{ color: 'var(--tag-label)' }}>
          Full Name
        </label>
        <input
          type="text"
          required
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className="w-full px-3 py-2 rounded text-sm"
          style={{
            border: '1px solid var(--tag-border)',
            backgroundColor: 'var(--tag-bg)',
            color: 'var(--tag-heading)',
          }}
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-sm mb-2" style={{ color: 'var(--tag-label)' }}>
          Email
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 rounded text-sm"
          style={{
            border: '1px solid var(--tag-border)',
            backgroundColor: 'var(--tag-bg)',
            color: 'var(--tag-heading)',
          }}
          placeholder="john@company.com"
        />
      </div>

      <div>
        <label className="block text-sm mb-2" style={{ color: 'var(--tag-label)' }}>
          Phone (Optional)
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2 rounded text-sm"
          style={{
            border: '1px solid var(--tag-border)',
            backgroundColor: 'var(--tag-bg)',
            color: 'var(--tag-heading)',
          }}
          placeholder="+1 234 567 8900"
        />
      </div>

      <div>
        <label className="block text-sm mb-2" style={{ color: 'var(--tag-label)' }}>
          Password
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-3 py-2 rounded text-sm"
          style={{
            border: '1px solid var(--tag-border)',
            backgroundColor: 'var(--tag-bg)',
            color: 'var(--tag-heading)',
          }}
          placeholder="Minimum 6 characters"
        />
      </div>

      <div>
        <label className="block text-sm mb-2" style={{ color: 'var(--tag-label)' }}>
          Role
        </label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "super_admin" })}
          className="w-full px-3 py-2 rounded text-sm"
          style={{
            border: '1px solid var(--tag-border)',
            backgroundColor: 'var(--tag-bg)',
            color: 'var(--tag-heading)',
          }}
        >
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? "Creating..." : "Create Admin"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
