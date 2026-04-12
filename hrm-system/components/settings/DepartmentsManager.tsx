"use client";

import { useState, useEffect } from "react";
import { useApiCall } from "@/lib/hooks/client";
import { Plus, Trash2, Edit2, X } from "lucide-react";

interface Department {
  id: string;
  name: string;
  description: string | null;
}

export default function DepartmentsManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const { callApi } = useApiCall();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data, error } = await callApi("/api/settings/departments", {
        method: "GET",
      });

      if (error) {
        setError(error);
      } else {
        setDepartments(data || []);
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
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        setError("Name is required");
        return;
      }

      if (editingId) {
        // Update existing department
        const { error } = await callApi(`/api/settings/departments/${editingId}`, {
          method: "PATCH",
          body: formData,
        });
        if (error) throw new Error(error);
      } else {
        // Create new department
        const { error } = await callApi("/api/settings/departments", {
          method: "POST",
          body: formData,
        });
        if (error) throw new Error(error);
      }

      setFormData({ name: "", description: "" });
      setEditingId(null);
      setShowForm(false);
      fetchDepartments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (department: Department) => {
    setFormData({ name: department.name, description: department.description || "" });
    setEditingId(department.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    
    try {
      setLoading(true);
      const { error } = await callApi(`/api/settings/departments/${id}`, {
        method: "DELETE",
      });
      if (error) throw new Error(error);
      fetchDepartments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "" });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading departments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-light" style={{ letterSpacing: "-0.22px" }}>
          Departments
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Department
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
              Department Name *
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
              {editingId ? "Update" : "Create"} Department
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
        {departments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No departments yet. Create one to get started.
          </div>
        ) : (
          departments.map((department) => (
            <div key={department.id} className="card p-4 flex justify-between items-start">
              <div>
                <p className="font-medium">{department.name}</p>
                {department.description && (
                  <p className="text-sm text-gray-600">{department.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(department)}
                  className="btn-icon"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(department.id)}
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
