"use client";

import { formatDate } from "@/lib/utils";
import { Shield, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { useApiCall } from "@/lib/hooks/client";
import { useRouter } from "next/navigation";

interface Admin {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
}

interface AdminsTableProps {
  admins: Admin[];
}

export default function AdminsTable({ admins }: AdminsTableProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (adminId: string) => {
    if (!confirm("Are you sure you want to remove this admin? This will also delete their employee record if it exists.")) {
      return;
    }

    setDeletingId(adminId);

    try {
      const { error } = await callApi(`/api/admins/${adminId}`, {
        method: "DELETE",
      });

      if (error) throw new Error(error);

      router.refresh();
    } catch (error) {
      console.error("Error deleting admin:", error);
      alert("Failed to delete admin. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (admins.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
        <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
          No admins found
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ backgroundColor: 'var(--tag-bg-warm)' }}>
            <tr>
              <th className="text-left px-6 py-3 text-xs uppercase tracking-wider" style={{ color: 'var(--tag-label)' }}>
                Name
              </th>
              <th className="text-left px-6 py-3 text-xs uppercase tracking-wider" style={{ color: 'var(--tag-label)' }}>
                Email
              </th>
              <th className="text-left px-6 py-3 text-xs uppercase tracking-wider" style={{ color: 'var(--tag-label)' }}>
                Phone
              </th>
              <th className="text-left px-6 py-3 text-xs uppercase tracking-wider" style={{ color: 'var(--tag-label)' }}>
                Role
              </th>
              <th className="text-left px-6 py-3 text-xs uppercase tracking-wider" style={{ color: 'var(--tag-label)' }}>
                Added
              </th>
              <th className="text-right px-6 py-3 text-xs uppercase tracking-wider" style={{ color: 'var(--tag-label)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr
                key={admin.id}
                className="border-t hover:bg-opacity-50 transition-colors"
                style={{ borderColor: 'var(--tag-border)' }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--tag-bg-warm)' }}>
                      <Shield className="w-4 h-4" style={{ color: 'var(--tag-orange)' }} />
                    </div>
                    <span className="text-sm font-normal">{admin.full_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: 'var(--tag-body)' }}>
                  {admin.email}
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: 'var(--tag-body)' }}>
                  {admin.phone || '—'}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`badge ${
                      admin.role === 'super_admin' ? 'badge-orange' : 'badge-neutral'
                    }`}
                  >
                    {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm tabular-nums" style={{ color: 'var(--tag-body)' }}>
                  {formatDate(admin.created_at)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(admin.id)}
                    disabled={deletingId === admin.id}
                    className="text-sm px-3 py-1 rounded transition-colors"
                    style={{
                      color: 'var(--tag-danger)',
                      opacity: deletingId === admin.id ? 0.5 : 1,
                    }}
                  >
                    {deletingId === admin.id ? (
                      "Deleting..."
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
