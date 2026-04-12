import { NextRequest } from "next/server";
import { withAuth, getUserContext, requireRole } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

interface CreateDesignationRequest {
  name: string;
  description?: string;
}

async function createHandler(req: AuthenticatedRequest) {
  try {
    if (req.userRole !== "super_admin") {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only super admins can create designations")
      );
    }

    const body: CreateDesignationRequest = await req.json();

    if (!body.name || body.name.trim().length === 0) {
      return sendErrorResponse(Errors.VALIDATION_ERROR("name is required"));
    }

    const { userId } = getUserContext(req);
    const supabase = await getAdminClient();

    const { data: designation, error } = await supabase
      .from("designations")
      .insert({
        name: body.name.trim(),
        description: body.description?.trim() || null,
      } as any)
      .select()
      .single();

    if (error) {
      return sendErrorResponse(error);
    }

    await logAuditAction({
      user_id: userId,
      operation: "created",
      table_name: "designations",
      record_id: (designation as any)?.id || "",
      new_values: designation,
    });

    return sendSuccessResponse(designation, 201);
  } catch (error) {
    console.error("Error creating designation:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to create designation"
      )
    );
  }
}

async function updateHandler(req: AuthenticatedRequest) {
  try {
    if (req.userRole !== "super_admin") {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only super admins can update designations")
      );
    }

    const pathname = req.nextUrl.pathname;
    const id = pathname.split("/").filter(Boolean).pop();

    if (!id) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("Designation ID is required")
      );
    }

    const body: CreateDesignationRequest = await req.json();

    if (!body.name || body.name.trim().length === 0) {
      return sendErrorResponse(Errors.VALIDATION_ERROR("name is required"));
    }

    const { userId } = getUserContext(req);
    const supabase = await getAdminClient();

    // Get current record for audit
    const { data: currentDes } = await supabase
      .from("designations")
      .select("*")
      .eq("id", id)
      .single();

    const { data: designation, error } = await (supabase
      .from("designations") as any)
      .update({
        name: body.name.trim(),
        description: body.description?.trim() || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return sendErrorResponse(error);
    }

    await logAuditAction({
      user_id: userId,
      operation: "updated",
      table_name: "designations",
      record_id: id,
      old_values: currentDes || undefined,
      new_values: designation,
    });

    return sendSuccessResponse(designation);
  } catch (error) {
    console.error("Error updating designation:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to update designation"
      )
    );
  }
}

async function deleteHandler(req: AuthenticatedRequest) {
  try {
    if (req.userRole !== "super_admin") {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only super admins can delete designations")
      );
    }

    const pathname = req.nextUrl.pathname;
    const id = pathname.split("/").filter(Boolean).pop();

    if (!id) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("Designation ID is required")
      );
    }

    const { userId } = getUserContext(req);
    const supabase = await getAdminClient();

    // Check if designation is used by any employee
    const { data: usageCount, error: usageError } = await supabase
      .from("employees")
      .select("id", { count: "exact" })
      .eq("designation_id", id);

    if (usageCount && usageCount.length > 0) {
      return sendErrorResponse(
        Errors.CONFLICT(
          "Cannot delete designation as it is currently in use by employees"
        )
      );
    }

    // Get record before deletion for audit
    const { data: designation } = await supabase
      .from("designations")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("designations")
      .delete()
      .eq("id", id);

    if (error) {
      return sendErrorResponse(error);
    }

    await logAuditAction({
      user_id: userId,
      operation: "deleted",
      table_name: "designations",
      record_id: id,
      old_values: designation || undefined,
    });

    return sendSuccessResponse({ message: "Designation deleted successfully" });
  } catch (error) {
    console.error("Error deleting designation:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to delete designation"
      )
    );
  }
}

export const POST = withAuth(createHandler);
export const PATCH = withAuth(updateHandler);
export const DELETE = withAuth(deleteHandler);
