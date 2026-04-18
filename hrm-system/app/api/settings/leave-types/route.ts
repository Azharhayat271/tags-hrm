import { NextRequest } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

interface CreateLeaveTypeRequest {
  name: string;
  days_per_year: number;
  carry_forward_limit?: number;
}

async function handler(req: AuthenticatedRequest) {
  try {
    if (req.userRole !== "super_admin") {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only super admins can create leave types")
      );
    }

    const body: CreateLeaveTypeRequest = await req.json();

    if (!body.name || body.name.trim().length === 0) {
      return sendErrorResponse(Errors.VALIDATION_ERROR("name is required"));
    }

    if (typeof body.days_per_year !== "number" || body.days_per_year < 0) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR(
          "days_per_year must be a non-negative number (use 0 for unpaid / unlimited)"
        )
      );
    }

    const { userId } = getUserContext(req);
    const supabase = await getAdminClient();

    const { data: leaveType, error } = await supabase
      .from("leave_types")
      .insert({
        name: body.name.trim(),
        days_per_year: body.days_per_year,
        carry_forward_limit: body.carry_forward_limit || 0,
      } as any)
      .select()
      .single();

    if (error) {
      return sendErrorResponse(error);
    }

    await logAuditAction({
      user_id: userId,
      operation: "created",
      table_name: "leave_types",
      record_id: (leaveType as any)?.id || "",
      new_values: leaveType || undefined,
    });

    return sendSuccessResponse(leaveType, 201);
  } catch (error) {
    console.error("Error creating leave type:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to create leave type"
      )
    );
  }
}

async function getHandler(req: AuthenticatedRequest) {
  try {
    if (!["admin", "super_admin"].includes(req.userRole || "")) {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only admins can view leave types")
      );
    }

    const supabase = await getAdminClient();

    const { data: leaveTypes, error } = await supabase
      .from("leave_types")
      .select("*")
      .order("name");

    if (error) {
      return sendErrorResponse(error);
    }

    return sendSuccessResponse(leaveTypes);
  } catch (error) {
    console.error("Error fetching leave types:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to fetch leave types"
      )
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(handler);
