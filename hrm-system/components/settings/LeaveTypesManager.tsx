"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import { Plus, Trash2, Loader2, Briefcase } from "lucide-react";

interface LeaveType {
  id: string;
  name: string;
  days_per_year: number;
  carry_forward_limit: number;
}

interface LeaveTypesManagerProps {
  leaveTypes: LeaveType[];
}

export default function LeaveTypesManager({ leaveTypes }: LeaveTypesManagerProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState({
    name: "",
    days_per_year: 15,
    carry_forward_limit: 0,
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await callApi("/api/settings/leave-types", {
        method: "POST",
        body: newLeaveType,
      });

      if (error) throw new Error(error);

      setNewLeaveType({ name: "", days_per_year: 15, carry_forward_limit: 0 });
      setIsAdding(false);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to add leave type");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await callApi(`/api/settings/leave-types/${id}`, {
        method: "DELETE",
      });

      if (error) throw new Error(error);

      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to delete leave type");
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Leave Type */}
      <div className="card p-6">
        {isAdding ? (
          <form onSubmit={handleAdd} className="space-y-4">
            <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
              Add New Leave Type
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Leave Type Name *</label>
                <input
                  type="text"
                  value={newLeaveType.name}
                  onChange={(e) => setNewLeaveType({ ...newLeaveType, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Annual Leave"
                  required
                />
              </div>

              <div>
                <label className="label">Days Per Year *</label>
                <input
                  type="number"
                  value={newLeaveType.days_per_year}
                  onChange={(e) => setNewLeaveType({ ...newLeaveType, days_per_year: parseInt(e.target.value) })}
                  className="input"
                  min="1"
                  max="365"
                  required
                />
              </div>

              <div>
                <label className="label">Carry Forward Limit</label>
                <input
                  type="number"
                  value={newLeaveType.carry_forward_limit}
                  onChange={(e) => setNewLeaveType({ ...newLeaveType, carry_forward_limit: parseInt(e.target.value) })}
                  className="input"
                  min="0"
                  max="365"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Leave Type
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewLeaveType({ name: "", days_per_year: 15, carry_forward_limit: 0 });
                }}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Leave Type
          </button>
        )}
      </div>

      {/* Existing Leave Types */}
      <div className="card p-6">
        <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
          Configured Leave Types
        </h3>

        {leaveTypes.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
            <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
              No leave types configured yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaveTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-4 rounded border"
                style={{ borderColor: 'var(--tag-border)' }}
              >
                <div className="flex-1">
                  <h4 className="text-base font-normal mb-1">{type.name}</h4>
                  <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--tag-body)' }}>
                    <span className="tabular-nums">{type.days_per_year} days/year</span>
                    <span className="tabular-nums">
                      Carry forward: {type.carry_forward_limit} days
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(type.id, type.name)}
                  className="p-2 rounded hover:bg-red-50 transition-colors"
                  style={{ color: 'var(--tag-danger)' }}
                  title="Delete leave type"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
