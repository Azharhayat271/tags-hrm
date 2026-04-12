import { NextResponse } from "next/server";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

/**
 * Test Slack token and fetch users
 */
export async function GET() {
  try {
    if (!SLACK_BOT_TOKEN) {
      return NextResponse.json({
        success: false,
        error: "SLACK_BOT_TOKEN not configured",
      });
    }

    console.log('Testing Slack token...');
    
    // Test auth
    const authResponse = await fetch("https://slack.com/api/auth.test", {
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      },
    });

    const authData = await authResponse.json();
    console.log('Auth test:', authData);

    if (!authData.ok) {
      return NextResponse.json({
        success: false,
        error: `Slack auth failed: ${authData.error}`,
        details: authData,
      });
    }

    // Try to fetch users
    const usersResponse = await fetch("https://slack.com/api/users.list", {
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      },
    });

    const usersData = await usersResponse.json();
    console.log('Users list:', usersData.ok, usersData.error);

    if (!usersData.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch users: ${usersData.error}`,
        auth: authData,
      });
    }

    const realUsers = usersData.members.filter(
      (m: any) => !m.deleted && !m.is_bot && m.profile?.email
    );

    return NextResponse.json({
      success: true,
      workspace: authData.team,
      bot_user: authData.user,
      total_members: usersData.members.length,
      real_users: realUsers.length,
      sample_users: realUsers.slice(0, 3).map((u: any) => ({
        id: u.id,
        name: u.real_name,
        email: u.profile.email,
      })),
    });
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString(),
    });
  }
}
