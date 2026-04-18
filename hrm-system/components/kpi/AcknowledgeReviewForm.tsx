"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle } from "lucide-react";

interface AcknowledgeReviewFormProps {
  reviewId: string;
}

export default function AcknowledgeReviewForm({ reviewId }: AcknowledgeReviewFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [employeeNotes, setEmployeeNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("performance_reviews")
        .update({
          employee_notes: employeeNotes || null,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", reviewId);

      if (error) throw error;

      router.push("/kpi");
      router.refresh();
    } catch (error) {
      console.error("Error acknowledging review:", error);
      alert("Failed to acknowledge review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6">
      <div className="flex items-start gap-3 mb-6">
        <CheckCircle className="w-5 h-5 mt-1" style={{ color: "var(--accent)" }} />
        <div>
          <h3 className="text-lg font-light mb-1" style={{ letterSpacing: '-0.22px' }}>
            Your Comments
          </h3>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Add your thoughts or reflections about this review (optional)
          </p>
        </div>
      </div>

      <div className="mb-6">
        <textarea
          value={employeeNotes}
          onChange={(e) => setEmployeeNotes(e.target.value)}
          placeholder="Share your thoughts, goals, or any feedback..."
          rows={6}
          className="w-full px-3 py-2 rounded text-sm"
          style={{
            border: '1px solid var(--tag-border)',
            backgroundColor: 'var(--tag-bg)',
            color: 'var(--tag-heading)',
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? "Acknowledging..." : "Acknowledge Review"}
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
