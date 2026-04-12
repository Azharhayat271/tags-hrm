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
        Errors.FORBIDDEN("Only super admins can delete leave types")
      );
    }

    const pathname = req.nextUrl.pathname;
    const id = pathname.split("/").pop();

    if (!id) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("Leave type ID is required")
      );
    }
    const { userId } = getUserContext(req);
    const supabase = await getAdminClient();

    // Check if leave type is used by any leave request
    const { data: usageCount } = await supabase
      .from("leave_requests")
      .select("id", { count: "exact" })
      .eq("leave_type_id", id);

    if (usageCount && usageCount.length > 0) {
      return sendErrorResponse(
        Errors.CONFLICT(
          "Cannot delete leave type as it is currently in use"
        )
      );
    }

    // Get record before deletion for audit
    const { data: leaveType } = await supabase
      .from("leave_types")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("leave_types")
      .delete()
      .eq("id", id);

    if (error) {
      return sendErrorResponse(error);
    }

    await logAuditAction({
      user_id: userId,
      operation: "deleted",
      table_name: "leave_types",
      record_id: id,
      old_values: leaveType || undefined,
    });

    return sendSuccessResponse({ message: "Leave type deleted successfully" });
  } catch (error) {
    console.error("Error deleting leave type:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to delete leave type"
      )
    );
  }
}

export const DELETE = withAuth(handler);
