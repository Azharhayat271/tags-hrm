"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import { MoreVertical, UserCheck, UserX, Coffee } from "lucide-react";

interface EmployeeActionsProps {
  employeeId: string;
  currentStatus: string;
}

export default function EmployeeActions({ employeeId, currentStatus }: EmployeeActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { callApi } = useApiCall();

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await callApi(`/api/employees/${employeeId}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      });

      if (error) throw new Error(error);

      router.refresh();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-ghost p-2"
        disabled={loading}
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute right-0 mt-2 w-48 card p-2 z-20"
            style={{ boxShadow: "var(--tag-shadow-modal)" }}
          >
            <div className="space-y-1">
              {currentStatus !== "active" && (
                <button
                  onClick={() => updateStatus("active")}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" style={{ color: "var(--tag-success)" }} />
                  Mark Active
                </button>
              )}
              {currentStatus !== "on_leave" && (
                <button
                  onClick={() => updateStatus("on_leave")}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                >
                  <Coffee className="w-4 h-4" style={{ color: "var(--tag-warning)" }} />
                  Mark On Leave
                </button>
              )}
              {currentStatus !== "exited" && (
                <button
                  onClick={() => updateStatus("exited")}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" style={{ color: "var(--tag-danger)" }} />
                  Mark Exited
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
