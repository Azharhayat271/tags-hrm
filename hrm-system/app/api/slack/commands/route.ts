import { NextRequest, NextResponse } from "next/server";
import { verifySlackRequest } from "@/lib/slack/verification";
import { createClient } from "@/lib/supabase/server";

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await req.text();
    const timestamp = req.headers.get("x-slack-request-timestamp") || "";
    const signature = req.headers.get("x-slack-signature") || "";

    // Verify request is from Slack
    if (!verifySlackRequest(body, timestamp, signature, SLACK_SIGNING_SECRET)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse form data
    const params = new URLSearchParams(body);
    const command = params.get("command");
    const slackUserId = params.get("user_id");
    const userName = params.get("user_name");

    if (!slackUserId) {
      return NextResponse.json({
        response_type: "ephemeral",
        text: "❌ Could not identify user",
      });
    }

    const supabase = await createClient();

    // Find employee by Slack user ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, employees(id, status)")
      .eq("slack_user_id", slackUserId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        response_type: "ephemeral",
        text: `❌ Your Slack account is not linked to an employee record.\n\nPlease contact your administrator to link your account.\nYour Slack ID: \`${slackUserId}\``,
      });
    }

    const employee = profile.employees as any;
    if (!employee || employee.status !== "active") {
      return NextResponse.json({
        response_type: "ephemeral",
        text: "❌ Your employee account is not active",
      });
    }

    const employeeId = employee.id;
    const today = new Date().toISOString().split("T")[0];

    // Handle commands
    if (command === "/checkin") {
      return await handleCheckIn(supabase, employeeId, profile.full_name, today);
    } else if (command === "/checkout") {
      return await handleCheckOut(supabase, employeeId, profile.full_name, today);
    }

    return NextResponse.json({
      response_type: "ephemeral",
      text: "❌ Unknown command",
    });
  } catch (error) {
    console.error("Slack command error:", error);
    return NextResponse.json({
      response_type: "ephemeral",
      text: "❌ An error occurred. Please try again.",
    });
  }
}

async function handleCheckIn(
  supabase: any,
  employeeId: string,
  fullName: string,
  today: string
) {
  // Check if already checked in today
  const { data: existing } = await supabase
    .from("attendance")
    .select("id, check_in")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .single();

  if (existing?.check_in) {
    const checkInTime = new Date(existing.check_in).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return NextResponse.json({
      response_type: "ephemeral",
      text: `ℹ️ You already checked in today at ${checkInTime}`,
    });
  }

  // Create or update attendance record
  const now = new Date().toISOString();
  
  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from("attendance")
      .update({ check_in: now })
      .eq("id", existing.id);

    if (error) {
      console.error("Check-in error:", error);
      return NextResponse.json({
        response_type: "ephemeral",
        text: "❌ Failed to record check-in. Please try again.",
      });
    }
  } else {
    // Create new record
    const { error } = await supabase
      .from("attendance")
      .insert({
        employee_id: employeeId,
        date: today,
        check_in: now,
      });

    if (error) {
      console.error("Check-in error:", error);
      return NextResponse.json({
        response_type: "ephemeral",
        text: "❌ Failed to record check-in. Please try again.",
      });
    }
  }

  const checkInTime = new Date(now).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return NextResponse.json({
    response_type: "ephemeral",
    text: `✅ *Checked in successfully!*\n\n⏰ Time: ${checkInTime}\n👋 Have a productive day, ${fullName}!`,
  });
}

async function handleCheckOut(
  supabase: any,
  employeeId: string,
  fullName: string,
  today: string
) {
  // Get today's attendance record
  const { data: attendance, error: fetchError } = await supabase
    .from("attendance")
    .select("id, check_in, check_out")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .single();

  if (fetchError || !attendance) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "❌ You haven't checked in today. Please use `/checkin` first.",
    });
  }

  if (!attendance.check_in) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "❌ You haven't checked in today. Please use `/checkin` first.",
    });
  }

  if (attendance.check_out) {
    const checkOutTime = new Date(attendance.check_out).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return NextResponse.json({
      response_type: "ephemeral",
      text: `ℹ️ You already checked out today at ${checkOutTime}`,
    });
  }

  // Update with check-out time
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("attendance")
    .update({ check_out: now })
    .eq("id", attendance.id);

  if (updateError) {
    console.error("Check-out error:", updateError);
    return NextResponse.json({
      response_type: "ephemeral",
      text: "❌ Failed to record check-out. Please try again.",
    });
  }

  // Calculate work hours
  const checkInTime = new Date(attendance.check_in);
  const checkOutTime = new Date(now);
  const diffMs = checkOutTime.getTime() - checkInTime.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  const checkOutTimeStr = checkOutTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return NextResponse.json({
    response_type: "ephemeral",
    text: `✅ *Checked out successfully!*\n\n⏰ Time: ${checkOutTimeStr}\n⌛ Total hours: ${hours}h ${minutes}m\n👋 See you tomorrow, ${fullName}!`,
  });
}
