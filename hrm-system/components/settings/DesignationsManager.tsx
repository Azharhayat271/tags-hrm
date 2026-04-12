"use client";

import { useState, useEffect } from "react";
import { useApiCall } from "@/lib/hooks/client";
import { Plus, Trash2, Edit2, X } from "lucide-react";

interface Designation {
  id: string;
  name: string;
  description: string | null;
}

export default function DesignationsManager() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const { callApi } = useApiCall();

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    setLoading(true);
    try {
      const { data, error } = await callApi("/api/settings/designations", {
        method: "GET",
      });

      if (error) {
        setError(error);
      } else {
        setDesignations(data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      if (editingId) {
        // Update existing
        const { error } = await callApi(`/api/settings/designations/${editingId}`, {
          method: "PATCH",
          body: formData,
        });
        if (error) throw new Error(error);
      } else {
        // Create new
        const { error } = await callApi("/api/settings/designations", {
          method: "POST",
          body: formData,
        });
        if (error) throw new Error(error);
      }

      setFormData({ name: "", description: "" });
      setEditingId(null);
      setShowForm(false);
      fetchDesignations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (designation: Designation) => {
    setFormData({ name: designation.name, description: designation.description || "" });
    setEditingId(designation.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this designation?")) return;
    
    try {
      const { error } = await callApi(`/api/settings/designations/${id}`, {
        method: "DELETE",
      });
      if (error) throw new Error(error);

      fetchDesignations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "" });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading designations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-light" style={{ letterSpacing: "-0.22px" }}>
          Job Designations
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Designation
          </button>
        )}
      </div>

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

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label htmlFor="name" className="label">
              Designation Name *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              {editingId ? "Update" : "Create"} Designation
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {designations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No designations yet. Create one to get started.
          </div>
        ) : (
          designations.map((designation) => (
            <div key={designation.id} className="card p-4 flex justify-between items-start">
              <div>
                <p className="font-medium">{designation.name}</p>
                {designation.description && (
                  <p className="text-sm text-gray-600">{designation.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(designation)}
                  className="btn-icon"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(designation.id)}
                  className="btn-icon"
                  style={{ color: "var(--tag-danger)" }}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
