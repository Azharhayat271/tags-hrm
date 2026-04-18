"use client";

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
  // Slack integration has been disabled from the UI
  // Backend APIs and database remain intact for future re-enablement
  return null;
}
