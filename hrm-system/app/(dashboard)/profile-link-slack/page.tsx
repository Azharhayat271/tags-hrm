import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LinkSlackForm from "@/components/profile/LinkSlackForm";

export const dynamic = "force-dynamic";

export default async function LinkSlackPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, slack_user_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
          Link Slack Account
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
          Connect your Slack account to use attendance commands
        </p>
      </div>

      <div className="max-w-2xl">
        <LinkSlackForm profile={profile} />
      </div>
    </div>
  );
}
