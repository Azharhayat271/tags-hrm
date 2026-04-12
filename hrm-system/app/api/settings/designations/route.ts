import { NextRequest } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

interface CreateDesignationRequest {
  name: string;
  description?: string;
}

async function handler(req: AuthenticatedRequest) {
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

    const { data: designation, error } = await (supabase
      .from("designations") as any)
      .insert({
        name: body.name.trim(),
        description: body.description?.trim() || null,
      })
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

async function getHandler(req: AuthenticatedRequest) {
  try {
    if (!["admin", "super_admin"].includes(req.userRole || "")) {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only admins can view designations")
      );
    }

    const supabase = await getAdminClient();

    const { data: designations, error } = await supabase
      .from("designations")
      .select("*")
      .order("name");

    if (error) {
      return sendErrorResponse(error);
    }

    return sendSuccessResponse(designations);
  } catch (error) {
    console.error("Error fetching designations:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to fetch designations"
      )
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(handler);
