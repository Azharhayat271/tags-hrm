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
        <h1 className="text-[2rem] leading-[1.1] tracking-[-0.025em] font-light text-ink-primary">
          Link Slack Account
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
          Connect your Slack account to use attendance commands
        </p>
      </div>

      <div className="max-w-2xl">
        <LinkSlackForm profile={profile} />
      </div>
    </div>
  );
}
