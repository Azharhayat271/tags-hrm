import { NextRequest } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { createClient } from "@/lib/supabase/server";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

interface UpdateSlackMappingRequest {
  slack_user_id: string | null;
}

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;

    // Only super_admins can update Slack mappings
    if (req.userRole !== "super_admin") {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only super admins can update Slack mappings")
      );
    }

    const body: UpdateSlackMappingRequest = await req.json();
    const { userId } = getUserContext(req);
    const supabase = await createClient();

    // Get current profile
    const { data: currentProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("slack_user_id")
      .eq("id", profileId)
      .single();

    if (fetchError || !currentProfile) {
      return sendErrorResponse(Errors.NOT_FOUND("Profile not found"));
    }

    // Check if Slack user ID is already in use by another profile
    if (body.slack_user_id) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("slack_user_id", body.slack_user_id)
        .neq("id", profileId)
        .single();

      if (existingProfile) {
        return sendErrorResponse(
          Errors.CONFLICT(
            `This Slack user ID is already linked to ${existingProfile.full_name}`
          )
        );
      }
    }

    // Update Slack user ID
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ slack_user_id: body.slack_user_id })
      .eq("id", profileId);

    if (updateError) {
      return sendErrorResponse(updateError);
    }

    // Log audit action
    await logAuditAction({
      user_id: userId,
      operation: "updated",
      table_name: "profiles",
      record_id: profileId,
      old_values: { slack_user_id: currentProfile.slack_user_id },
      new_values: { slack_user_id: body.slack_user_id },
    });

    return sendSuccessResponse({
      message: "Slack mapping updated successfully",
    });
  } catch (error) {
    console.error("Error updating Slack mapping:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to update Slack mapping"
      )
    );
  }
}

export const PATCH = withAuth(handler);
