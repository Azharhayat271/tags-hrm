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

async function handler(req: AuthenticatedRequest) {
  try {
    if (req.userRole !== "super_admin") {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only super admins can create departments")
      );
    }

    const body: CreateDepartmentRequest = await req.json();

    if (!body.name || body.name.trim().length === 0) {
      return sendErrorResponse(Errors.VALIDATION_ERROR("name is required"));
    }

    const { userId } = getUserContext(req);
    const supabase = await getAdminClient();

    const { data: department, error } = await supabase
      .from("departments")
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
      table_name: "departments",
      record_id: (department as any)?.id || "",
      new_values: department,
    });

    return sendSuccessResponse(department, 201);
  } catch (error) {
    console.error("Error creating department:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to create department"
      )
    );
  }
}

async function getHandler(req: AuthenticatedRequest) {
  try {
    if (!["admin", "super_admin"].includes(req.userRole || "")) {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only admins can view departments")
      );
    }

    const supabase = await getAdminClient();

    const { data: departments, error } = await supabase
      .from("departments")
      .select("*")
      .order("name");

    if (error) {
      return sendErrorResponse(error);
    }

    return sendSuccessResponse(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to fetch departments"
      )
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(handler);
