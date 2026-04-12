import { NextRequest, NextResponse } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

interface UpdateStatusRequest {
  status: "active" | "on_leave" | "exited";
}

async function handler(req: AuthenticatedRequest) {
  try {
    const pathname = req.nextUrl.pathname;
    const employeeId = pathname.split("/")[2];

    if (!employeeId) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("Employee ID is required")
      );
    }

    // Only admins and super_admins can update employee status
    if (!["admin", "super_admin"].includes(req.userRole || "")) {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only admins can update employee status")
      );
    }

    const body: UpdateStatusRequest = await req.json();

    // Validate status
    const validStatuses = ["active", "on_leave", "exited"];
    if (!body.status || !validStatuses.includes(body.status)) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR(
          `status must be one of: ${validStatuses.join(", ")}`
        )
      );
    }

    const { userId } = getUserContext(req);
    const supabase = await getAdminClient();

    // 1. Get current employee record (for audit logging)
    const { data: currentEmployee, error: fetchError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();

    if (fetchError || !currentEmployee) {
      return sendErrorResponse(Errors.NOT_FOUND("Employee"));
    }

    // 2. Update employee status
    const { data: updated, error } = await (supabase
      .from("employees") as any)
      .update({ status: body.status })
      .eq("id", employeeId)
      .select()
      .single();

    if (error) {
      return sendErrorResponse(error);
    }

    // 3. Log audit action
    await logAuditAction({
      user_id: userId,
      operation: "updated",
      table_name: "employees",
      record_id: employeeId,
      old_values: { status: (currentEmployee as any)?.status },
      new_values: { status: body.status },
    });

    return sendSuccessResponse({
      employee_id: employeeId,
      status: body.status,
    });
  } catch (error) {
    console.error("Error updating employee status:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to update employee status"
      )
    );
  }
}

export const PATCH = withAuth(handler);
