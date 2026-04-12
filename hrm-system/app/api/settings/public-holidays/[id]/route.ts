import { NextRequest } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

async function handler(req: AuthenticatedRequest) {
  try {
    if (req.userRole !== "super_admin") {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only super admins can delete public holidays")
      );
    }

    const pathname = req.nextUrl.pathname;
    const id = pathname.split("/").pop();

    if (!id) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("Holiday ID is required")
      );
    }
    const { userId } = getUserContext(req);
    const supabase = await getAdminClient();

    // Get record before deletion for audit
    const { data: holiday } = await supabase
      .from("public_holidays")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("public_holidays")
      .delete()
      .eq("id", id);

    if (error) {
      return sendErrorResponse(error);
    }

    await logAuditAction({
      user_id: userId,
      operation: "deleted",
      table_name: "public_holidays",
      record_id: id,
      old_values: holiday || undefined,
    });

    return sendSuccessResponse({ message: "Public holiday deleted successfully" });
  } catch (error) {
    console.error("Error deleting public holiday:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to delete public holiday"
      )
    );
  }
}

export const DELETE = withAuth(handler);
