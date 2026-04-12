-- Add Slack user ID to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slack_user_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_slack_user_id ON profiles(slack_user_id);

-- Add comment
COMMENT ON COLUMN profiles.slack_user_id IS 'Slack user ID for attendance tracking via Slack commands';
