"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface AddKPIFormProps {
  employeeId: string;
}

export default function AddKPIForm({ employeeId }: AddKPIFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current cycle
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
  const defaultCycle = `Q${currentQuarter} ${currentYear}`;

  const [formData, setFormData] = useState({
    cycle: defaultCycle,
    title: "",
    description: "",
    target: "",
    unit: "",
    weight: "1",
    progress: "0",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from("kpis")
        .insert({
          employee_id: employeeId,
          cycle: formData.cycle,
          title: formData.title,
          description: formData.description || null,
          target: formData.target ? parseFloat(formData.target) : null,
          unit: formData.unit || null,
          weight: parseFloat(formData.weight),
          progress: parseFloat(formData.progress),
        });

      if (insertError) throw insertError;

      router.push(`/admin/employees/${employeeId}/kpi`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to add KPI");
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Generate cycle options
  const cycles = [];
  for (let i = 0; i < 4; i++) {
    const year = currentYear + Math.floor(i / 4);
    const quarter = ((currentQuarter - 1 + i) % 4) + 1;
    cycles.push(`Q${quarter} ${year}`);
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

        <div>
          <label htmlFor="cycle" className="label">
            Review Cycle *
          </label>
          <select
            id="cycle"
            name="cycle"
            value={formData.cycle}
            onChange={handleChange}
            className="input"
            required
          >
            {cycles.map((cycle) => (
              <option key={cycle} value={cycle}>
                {cycle}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="title" className="label">
            KPI Title *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            className="input"
            placeholder="e.g. Complete 10 client projects"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input"
            rows={3}
            placeholder="Provide details about this KPI..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="target" className="label">
              Target Value
            </label>
            <input
              id="target"
              name="target"
              type="number"
              step="0.01"
              value={formData.target}
              onChange={handleChange}
              className="input"
              placeholder="e.g. 100"
            />
          </div>

          <div>
            <label htmlFor="unit" className="label">
              Unit
            </label>
            <input
              id="unit"
              name="unit"
              type="text"
              value={formData.unit}
              onChange={handleChange}
              className="input"
              placeholder="e.g. projects, %, $"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="weight" className="label">
              Weight *
            </label>
            <input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              min="0.1"
              value={formData.weight}
              onChange={handleChange}
              className="input"
              required
            />
            <p className="text-xs mt-1" style={{ color: 'var(--tag-body)' }}>
              How important is this KPI? (1 = normal, 2 = double weight)
            </p>
          </div>

          <div>
            <label htmlFor="progress" className="label">
              Initial Progress (%)
            </label>
            <input
              id="progress"
              name="progress"
              type="number"
              min="0"
              max="100"
              value={formData.progress}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: "var(--tag-border)" }}>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Adding..." : "Add KPI"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
