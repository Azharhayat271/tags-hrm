"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import { Plus, Trash2, Loader2, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface PublicHoliday {
  id: string;
  name: string;
  date: string;
}

interface PublicHolidaysManagerProps {
  holidays: PublicHoliday[];
}

export default function PublicHolidaysManager({ holidays }: PublicHolidaysManagerProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: "",
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await callApi("/api/settings/public-holidays", {
        method: "POST",
        body: newHoliday,
      });

      if (error) throw new Error(error);

      setNewHoliday({ name: "", date: "" });
      setIsAdding(false);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to add holiday");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const { error } = await callApi(`/api/settings/public-holidays/${id}`, {
        method: "DELETE",
      });

      if (error) throw new Error(error);

      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to delete holiday");
    }
  };

  // Group holidays by year
  const holidaysByYear = holidays.reduce((acc, holiday) => {
    const year = new Date(holiday.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(holiday);
    return acc;
  }, {} as Record<number, PublicHoliday[]>);

  const years = Object.keys(holidaysByYear).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div className="space-y-6">
      {/* Add New Holiday */}
      <div className="card p-6">
        {isAdding ? (
          <form onSubmit={handleAdd} className="space-y-4">
            <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
              Add New Holiday
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Holiday Name *</label>
                <input
                  type="text"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  className="input"
                  placeholder="e.g. New Year's Day"
                  required
                />
              </div>

              <div>
                <label className="label">Date *</label>
                <input
                  type="date"
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  className="input"
                  required
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
                Add Holiday
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewHoliday({ name: "", date: "" });
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
            Add Holiday
          </button>
        )}
      </div>

      {/* Existing Holidays by Year */}
      {years.length === 0 ? (
        <div className="card p-6">
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
            <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
              No holidays configured yet
            </p>
          </div>
        </div>
      ) : (
        years.map((year) => (
          <div key={year} className="card p-6">
            <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
              {year} ({holidaysByYear[parseInt(year)].length} holidays)
            </h3>

            <div className="space-y-3">
              {holidaysByYear[parseInt(year)].map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-4 rounded border"
                  style={{ borderColor: 'var(--tag-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" style={{ color: 'var(--tag-orange)' }} />
                    <div>
                      <h4 className="text-base font-normal">{holiday.name}</h4>
                      <p className="text-sm tabular-nums" style={{ color: 'var(--tag-body)' }}>
                        {formatDate(holiday.date)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(holiday.id, holiday.name)}
                    className="p-2 rounded hover:bg-red-50 transition-colors"
                    style={{ color: 'var(--tag-danger)' }}
                    title="Delete holiday"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
