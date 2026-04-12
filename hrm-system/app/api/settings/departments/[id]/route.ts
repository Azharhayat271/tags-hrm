import { NextRequest } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

interface CreateDepartmentRequest {
  name: string;
  description?: string;
}

async function updateHandler(req: AuthenticatedRequest) {
  try {
    if (req.userRole !== "super_admin") {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only super admins can update departments")
      );
    }

    const pathname = req.nextUrl.pathname;
    const id = pathname.split("/").filter(Boolean).pop();

    if (!id) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("Department ID is required")
      );
    }

    const body: CreateDepartmentRequest = await req.json();

    if (!body.name || body.name.trim().length === 0) {
      return sendErrorResponse(Errors.VALIDATION_ERROR("name is required"));
    }

    const { userId } = getUserContext(req);
    const supabase = await getAdminClient();

    // Get current record for audit
    const { data: currentDept } = await supabase
      .from("departments")
      .select("*")
      .eq("id", id)
      .single();

    const { data: department, error } = await (supabase
      .from("departments") as any)
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
      table_name: "departments",
      record_id: id,
      old_values: currentDept || undefined,
      new_values: department,
    });

    return sendSuccessResponse(department);
  } catch (error) {
    console.error("Error updating department:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to update department"
      )
    );
  }
}

async function deleteHandler(req: AuthenticatedRequest) {
  try {
    if (req.userRole !== "super_admin") {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only super admins can delete departments")
      );
    }

    const pathname = req.nextUrl.pathname;
    const id = pathname.split("/").filter(Boolean).pop();

    if (!id) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("Department ID is required")
      );
    }

    const { userId } = getUserContext(req);
    const supabase = await getAdminClient();

    // Check if department is used by any employee
    const { data: usageCount, error: usageError } = await supabase
      .from("employees")
      .select("id", { count: "exact" })
      .eq("department_id", id);

    if (usageCount && usageCount.length > 0) {
      return sendErrorResponse(
        Errors.CONFLICT(
          "Cannot delete department as it is currently in use by employees"
        )
      );
    }

    // Get record before deletion for audit
    const { data: department } = await supabase
      .from("departments")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("departments")
      .delete()
      .eq("id", id);

    if (error) {
      return sendErrorResponse(error);
    }

    await logAuditAction({
      user_id: userId,
      operation: "deleted",
      table_name: "departments",
      record_id: id,
      old_values: department || undefined,
    });

    return sendSuccessResponse({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to delete department"
      )
    );
  }
}

export const PATCH = withAuth(updateHandler);
export const DELETE = withAuth(deleteHandler);
