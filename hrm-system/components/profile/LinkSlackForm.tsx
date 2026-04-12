"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiCall } from "@/lib/hooks/client";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  slack_user_id: string | null;
}

interface LinkSlackFormProps {
  profile: Profile;
}

export default function LinkSlackForm({ profile }: LinkSlackFormProps) {
  const router = useRouter();
  const { callApi } = useApiCall();
  const [slackUserId, setSlackUserId] = useState(profile.slack_user_id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: apiError } = await callApi(`/api/slack/mapping/${profile.id}`, {
        method: "PATCH",
        body: { slack_user_id: slackUserId.trim() || null },
      });

      if (apiError) {
        throw new Error(apiError);
      }

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to link Slack account");
    } finally {
      setLoading(false);
    }
  };

  const isLinked = profile.slack_user_id;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          {isLinked ? (
            <>
              <CheckCircle className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--tag-success)' }} />
              <div className="flex-1">
                <h3 className="text-lg font-light mb-2" style={{ letterSpacing: "-0.22px" }}>
                  Slack Account Linked
                </h3>
                <p className="text-sm mb-3" style={{ color: 'var(--tag-body)' }}>
                  Your Slack account is connected. You can now use attendance commands in Slack.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: 'var(--tag-label)' }}>Slack User ID:</span>
                  <code className="px-2 py-1 rounded font-mono" style={{ backgroundColor: 'var(--tag-bg)', border: '1px solid var(--tag-border)' }}>
                    {profile.slack_user_id}
                  </code>
                </div>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--tag-warning)' }} />
              <div className="flex-1">
                <h3 className="text-lg font-light mb-2" style={{ letterSpacing: "-0.22px" }}>
                  Slack Account Not Linked
                </h3>
                <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
                  Link your Slack account to use <code>/checkin</code> and <code>/checkout</code> commands.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Instructions Card */}
      <div className="card p-6">
        <h3 className="text-lg font-light mb-4" style={{ letterSpacing: "-0.22px" }}>
          How to Find Your Slack User ID
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--tag-heading)' }}>
              Method 1: From Slack App
            </p>
            <ol className="text-sm space-y-2 ml-4" style={{ color: 'var(--tag-body)' }}>
              <li>1. Open Slack and click on your profile picture (top right)</li>
              <li>2. Click "Profile"</li>
              <li>3. Click "More" (three dots)</li>
              <li>4. Click "Copy member ID"</li>
              <li>5. Paste it in the form below</li>
            </ol>
          </div>

          <div className="pt-4 border-t" style={{ borderColor: 'var(--tag-border)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--tag-heading)' }}>
              Method 2: Try the Command
            </p>
            <ol className="text-sm space-y-2 ml-4" style={{ color: 'var(--tag-body)' }}>
              <li>1. Open Slack</li>
              <li>2. Type <code className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--tag-bg)', border: '1px solid var(--tag-border)' }}>/checkin</code></li>
              <li>3. You'll see an error message with your Slack ID</li>
              <li>4. Copy the ID and paste it below</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Link Form */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {success && (
            <div
              className="text-sm p-3 rounded"
              style={{
                backgroundColor: "var(--tag-success-bg)",
                border: "1px solid rgba(34,197,94,0.3)",
                color: "var(--tag-success)",
              }}
            >
              ✅ Slack account linked successfully! You can now use /checkin and /checkout commands.
            </div>
          )}

          <div>
            <label htmlFor="slack_user_id" className="label">
              Slack User ID
            </label>
            <input
              id="slack_user_id"
              type="text"
              value={slackUserId}
              onChange={(e) => setSlackUserId(e.target.value)}
              placeholder="U01234ABCDE"
              className="input font-mono"
              required
            />
            <p className="text-xs mt-1" style={{ color: 'var(--tag-body)' }}>
              Your Slack user ID starts with "U" followed by letters and numbers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Linking..." : isLinked ? "Update Link" : "Link Account"}
            </button>
            <Link href="/profile" className="btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Test Commands Card */}
      {isLinked && (
        <div className="card p-6">
          <h3 className="text-lg font-light mb-4" style={{ letterSpacing: "-0.22px" }}>
            Test Your Connection
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--tag-body)' }}>
            Try these commands in Slack to test your connection:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded" style={{ backgroundColor: 'var(--tag-bg)' }}>
              <code className="flex-1 font-mono text-sm">/checkin</code>
              <span className="text-xs" style={{ color: 'var(--tag-body)' }}>Check in for work</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded" style={{ backgroundColor: 'var(--tag-bg)' }}>
              <code className="flex-1 font-mono text-sm">/checkout</code>
              <span className="text-xs" style={{ color: 'var(--tag-body)' }}>Check out from work</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
