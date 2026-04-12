import { NextResponse } from "next/server";

/**
 * Simple test endpoint to verify Slack integration is configured
 */
export async function GET() {
  const config = {
    botToken: process.env.SLACK_BOT_TOKEN ? "✅ Configured" : "❌ Missing",
    signingSecret: process.env.SLACK_SIGNING_SECRET ? "✅ Configured" : "❌ Missing",
    appId: process.env.SLACK_APP_ID ? "✅ Configured" : "❌ Missing",
  };

  const allConfigured = 
    process.env.SLACK_BOT_TOKEN && 
    process.env.SLACK_SIGNING_SECRET;

  return NextResponse.json({
    status: allConfigured ? "ready" : "incomplete",
    message: allConfigured 
      ? "Slack integration is configured and ready to use!" 
      : "Some Slack environment variables are missing",
    config,
    nextSteps: allConfigured 
      ? [
          "1. Run database migration (see RUN_THIS_MIGRATION.md)",
          "2. Configure slash commands in Slack app",
          "3. Link employee accounts in admin panel",
          "4. Test with /checkin command"
        ]
      : [
          "1. Add missing environment variables to .env",
          "2. Restart your development server",
          "3. Visit this endpoint again to verify"
        ]
  });
}
