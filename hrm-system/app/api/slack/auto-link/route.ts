import { NextRequest, NextResponse } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { AuthenticatedRequest } from "@/app/api/middleware";
import { createClient } from "@/lib/supabase/server";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN!;

/**
 * Auto-link Slack accounts by email
 * This endpoint fetches all Slack users and matches them with employees by email
 */
async function handler(req: AuthenticatedRequest) {
  try {
    // Only super_admins can auto-link accounts
    if (req.userRole !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can auto-link accounts" },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Fetch all Slack users
    console.log('Fetching Slack users...');
    const slackResponse = await fetch("https://slack.com/api/users.list", {
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      },
    });

    const slackData = await slackResponse.json();
    console.log('Slack API response:', slackData.ok, slackData.error);

    if (!slackData.ok) {
      console.error('Slack API error:', slackData.error);
      return NextResponse.json(
        { error: `Slack API error: ${slackData.error}` },
        { status: 500 }
      );
    }

    const slackUsers = slackData.members.filter(
      (member: any) => !member.deleted && !member.is_bot && member.profile?.email
    );

    // Fetch all employees
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name, slack_user_id");

    if (!profiles) {
      return NextResponse.json(
        { error: "Failed to fetch employees" },
        { status: 500 }
      );
    }

    // Match and update
    let matched = 0;
    let updated = 0;
    let skipped = 0;
    const results = [];

    for (const profile of profiles) {
      const slackUser = slackUsers.find(
        (su: any) => su.profile.email.toLowerCase() === profile.email.toLowerCase()
      );

      if (slackUser) {
        matched++;

        // Skip if already linked
        if (profile.slack_user_id === slackUser.id) {
          skipped++;
          results.push({
            name: profile.full_name,
            email: profile.email,
            status: "already_linked",
            slack_id: slackUser.id,
          });
          continue;
        }

        // Update the profile
        const { error } = await supabase
          .from("profiles")
          .update({ slack_user_id: slackUser.id })
          .eq("id", profile.id);

        if (!error) {
          updated++;
          results.push({
            name: profile.full_name,
            email: profile.email,
            status: "linked",
            slack_id: slackUser.id,
          });
        } else {
          results.push({
            name: profile.full_name,
            email: profile.email,
            status: "error",
            error: error.message,
          });
        }
      } else {
        results.push({
          name: profile.full_name,
          email: profile.email,
          status: "not_found",
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total_employees: profiles.length,
        matched,
        updated,
        skipped,
        not_found: profiles.length - matched,
      },
      results,
    });
  } catch (error: any) {
    console.error("Auto-link error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to auto-link accounts",
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
