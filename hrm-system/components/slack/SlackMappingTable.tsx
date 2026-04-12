"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import { Save, Loader2, Zap } from "lucide-react";

interface Employee {
  id: string;
  status: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    slack_user_id: string | null;
  };
}

interface SlackMappingTableProps {
  employees: Employee[];
}

export default function SlackMappingTable({ employees }: SlackMappingTableProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const [mappings, setMappings] = useState<Record<string, string>>(
    employees.reduce((acc, emp) => {
      acc[emp.profiles.id] = emp.profiles.slack_user_id || "";
      return acc;
    }, {} as Record<string, string>)
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({});
  const [autoLinking, setAutoLinking] = useState(false);
  const [autoLinkResult, setAutoLinkResult] = useState<any>(null);

  const handleAutoLink = async () => {
    setAutoLinking(true);
    setAutoLinkResult(null);

    try {
      const { data, error } = await callApi("/api/slack/auto-link", {
        method: "POST",
      });

      if (error) {
        throw new Error(error);
      }

      setAutoLinkResult(data);
      router.refresh();
    } catch (err: any) {
      setAutoLinkResult({
        success: false,
        error: err.message || "Failed to auto-link accounts",
      });
    } finally {
      setAutoLinking(false);
    }
  };

  const handleChange = (profileId: string, value: string) => {
    setMappings((prev) => ({ ...prev, [profileId]: value }));
    setErrors((prev) => ({ ...prev, [profileId]: "" }));
    setSuccess((prev) => ({ ...prev, [profileId]: false }));
  };

  const handleSave = async (profileId: string) => {
    setSaving((prev) => ({ ...prev, [profileId]: true }));
    setErrors((prev) => ({ ...prev, [profileId]: "" }));
    setSuccess((prev) => ({ ...prev, [profileId]: false }));

    try {
      const slackUserId = mappings[profileId]?.trim() || null;

      const { error } = await callApi(`/api/slack/mapping/${profileId}`, {
        method: "PATCH",
        body: { slack_user_id: slackUserId },
      });

      if (error) {
        throw new Error(error);
      }

      setSuccess((prev) => ({ ...prev, [profileId]: true }));
      setTimeout(() => {
        setSuccess((prev) => ({ ...prev, [profileId]: false }));
      }, 3000);
      
      router.refresh();
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        [profileId]: err.message || "Failed to save",
      }));
    } finally {
      setSaving((prev) => ({ ...prev, [profileId]: false }));
    }
  };

  const activeEmployees = employees.filter((emp) => emp.status === "active");
  const inactiveEmployees = employees.filter((emp) => emp.status !== "active");

  return (
    <div className="space-y-6">
      {/* Auto-Link Section */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-light mb-2" style={{ letterSpacing: "-0.22px" }}>
              Auto-Link by Email
            </h3>
            <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
              Automatically link all employees who use the same email for Slack and HRM.
            </p>
          </div>
          <button
            onClick={handleAutoLink}
            disabled={autoLinking}
            className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {autoLinking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Auto-Link All
              </>
            )}
          </button>
        </div>

        {autoLinkResult && (
          <div
            className="text-sm p-3 rounded mt-4"
            style={{
              backgroundColor: autoLinkResult.success ? "var(--tag-success-bg)" : "var(--tag-danger-bg)",
              border: autoLinkResult.success ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(239,68,68,0.3)",
              color: autoLinkResult.success ? "var(--tag-success)" : "var(--tag-danger)",
            }}
          >
            {autoLinkResult.success ? (
              <div>
                <p className="font-medium mb-2">✅ Auto-link completed!</p>
                <ul className="text-xs space-y-1">
                  <li>• Total employees: {autoLinkResult.summary.total_employees}</li>
                  <li>• Newly linked: {autoLinkResult.summary.updated}</li>
                  <li>• Already linked: {autoLinkResult.summary.skipped}</li>
                  <li>• Not found in Slack: {autoLinkResult.summary.not_found}</li>
                </ul>
              </div>
            ) : (
              <p>❌ {autoLinkResult.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Active Employees */}
      <div className="table-container">
        <h3 className="text-lg font-light mb-4 px-4 pt-4" style={{ letterSpacing: "-0.22px" }}>
          Active Employees
        </h3>
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left px-4 py-3">Employee Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Slack User ID</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {activeEmployees.map((employee) => {
              const profileId = employee.profiles.id;
              const hasChanged = mappings[profileId] !== (employee.profiles.slack_user_id || "");

              return (
                <tr key={employee.id} className="table-row">
                  <td className="px-4 py-3">{employee.profiles.full_name}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--tag-body)' }}>
                    {employee.profiles.email}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={mappings[profileId] || ""}
                      onChange={(e) => handleChange(profileId, e.target.value)}
                      placeholder="U01234ABCDE"
                      className="w-full px-3 py-2 rounded text-sm font-mono"
                      style={{
                        border: '1px solid var(--tag-border)',
                        backgroundColor: 'var(--tag-bg)',
                        color: 'var(--tag-heading)',
                      }}
                    />
                    {errors[profileId] && (
                      <p className="text-xs mt-1" style={{ color: 'var(--tag-danger)' }}>
                        {errors[profileId]}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {success[profileId] ? (
                      <span className="badge badge-success">Saved</span>
                    ) : employee.profiles.slack_user_id ? (
                      <span className="badge badge-success">Linked</span>
                    ) : (
                      <span className="badge badge-warning">Not Linked</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSave(profileId)}
                      disabled={saving[profileId] || !hasChanged}
                      className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      {saving[profileId] ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Inactive Employees */}
      {inactiveEmployees.length > 0 && (
        <div className="table-container">
          <h3 className="text-lg font-light mb-4 px-4 pt-4" style={{ letterSpacing: "-0.22px", color: 'var(--tag-body)' }}>
            Inactive Employees
          </h3>
          <table className="w-full opacity-60">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Employee Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Slack User ID</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {inactiveEmployees.map((employee) => (
                <tr key={employee.id} className="table-row">
                  <td className="px-4 py-3">{employee.profiles.full_name}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--tag-body)' }}>
                    {employee.profiles.email}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {employee.profiles.slack_user_id || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge badge-danger capitalize">
                      {employee.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
