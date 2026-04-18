import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import SlackMappingTable from "@/components/slack/SlackMappingTable";
import AttendanceQuickActions from "@/components/attendance/AttendanceQuickActions";

export const dynamic = "force-dynamic";

export default async function SlackSetupPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Check configuration
  const hasBotToken = !!process.env.SLACK_BOT_TOKEN;
  const hasSigningSecret = !!process.env.SLACK_SIGNING_SECRET;

  // Check if any employees are linked
  const { data: linkedProfiles, count: linkedCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact" })
    .not("slack_user_id", "is", null);

  // Fetch all employees with their Slack mapping
  const { data: employees } = await supabase
    .from("employees")
    .select(`
      id,
      status,
      profiles!inner(
        id,
        full_name,
        email,
        slack_user_id
      )
    `)
    .order("profiles(full_name)");

  const normalizedEmployees = (employees ?? []).map((employee) => ({
    ...employee,
    profiles: Array.isArray(employee.profiles)
      ? employee.profiles[0] ?? null
      : employee.profiles,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
          Slack Integration
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
          Configure Slack attendance tracking and manage employee mappings
        </p>
      </div>

      {/* Quick Check-in/Checkout */}
      <AttendanceQuickActions />

      {/* Configuration Status */}
      <div className="card p-6 mb-6">
        <h3 className="text-lg font-light mb-4" style={{ letterSpacing: "-0.22px" }}>
          Configuration Status
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {hasBotToken ? (
              <CheckCircle className="w-5 h-5" style={{ color: 'var(--tag-success)' }} />
            ) : (
              <XCircle className="w-5 h-5" style={{ color: 'var(--tag-danger)' }} />
            )}
            <span className="text-sm">Slack Bot Token</span>
          </div>
          <div className="flex items-center gap-3">
            {hasSigningSecret ? (
              <CheckCircle className="w-5 h-5" style={{ color: 'var(--tag-success)' }} />
            ) : (
              <XCircle className="w-5 h-5" style={{ color: 'var(--tag-danger)' }} />
            )}
            <span className="text-sm">Slack Signing Secret</span>
          </div>
          <div className="flex items-center gap-3">
            {(linkedCount || 0) > 0 ? (
              <CheckCircle className="w-5 h-5" style={{ color: 'var(--tag-success)' }} />
            ) : (
              <AlertCircle className="w-5 h-5" style={{ color: 'var(--tag-warning)' }} />
            )}
            <span className="text-sm">Linked Employees ({linkedCount || 0})</span>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="card p-6 mb-6">
        <h3 className="text-lg font-light mb-4" style={{ letterSpacing: "-0.22px" }}>
          Setup Instructions
        </h3>
        <div className="space-y-4">
          <div>
            <p className="font-medium mb-2">1. Get Correct Slack Bot Token</p>
            <p className="text-sm mb-2" style={{ color: 'var(--tag-body)' }}>
              Go to <a href="https://api.slack.com/apps/A0ASHJ5C3HQ/oauth" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Slack OAuth page</a> and copy the "Bot User OAuth Token" (starts with <code>xoxb-</code>)
            </p>
          </div>
          <div>
            <p className="font-medium mb-2">2. Configure Slack Commands (for local testing)</p>
            <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
              <p>Run ngrok:</p>
              <code className="block p-2 bg-white rounded border">ngrok http 3000</code>
              <p className="mt-2">Then add commands in <a href="https://api.slack.com/apps/A0ASHJ5C3HQ/slash-commands" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Slack app</a>:</p>
              <ul className="space-y-1 ml-4">
                <li>• <code>/checkin</code> → <code>https://your-ngrok-url/api/slack/commands</code></li>
                <li>• <code>/checkout</code> → <code>https://your-ngrok-url/api/slack/commands</code></li>
              </ul>
            </div>
          </div>
          <div>
            <p className="font-medium mb-2">3. Link Employee Accounts</p>
            <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
              Use the "Auto-Link All" button below if employees use the same email for Slack and HRM.
            </p>
          </div>
        </div>
      </div>

      {/* Employee Mapping */}
      <SlackMappingTable employees={normalizedEmployees} />
    </div>
  );
}
