import { NextRequest } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

interface CreatePublicHolidayRequest {
  name: string;
  date: string; // YYYY-MM-DD format
}

async function handler(req: AuthenticatedRequest) {
  try {
    if (req.userRole !== "super_admin") {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only super admins can create public holidays")
      );
    }

    const body: CreatePublicHolidayRequest = await req.json();

    if (!body.name || body.name.trim().length === 0) {
      return sendErrorResponse(Errors.VALIDATION_ERROR("name is required"));
    }

    if (!body.date) {
      return sendErrorResponse(Errors.VALIDATION_ERROR("date is required"));
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("date must be in YYYY-MM-DD format")
      );
    }

    const { userId } = getUserContext(req);
    const supabase = await getAdminClient();

    const { data: holiday, error } = await supabase
      .from("public_holidays")
      .insert({
        name: body.name.trim(),
        date: body.date,
      } as any)
      .select()
      .single();

    if (error) {
      return sendErrorResponse(error);
    }

    await logAuditAction({
      user_id: userId,
      operation: "created",
      table_name: "public_holidays",
      record_id: (holiday as any)?.id || "",
      new_values: holiday || undefined,
    });

    return sendSuccessResponse(holiday, 201);
  } catch (error) {
    console.error("Error creating public holiday:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to create public holiday"
      )
    );
  }
}

async function getHandler(req: AuthenticatedRequest) {
  try {
    if (!["admin", "super_admin"].includes(req.userRole || "")) {
      return sendErrorResponse(
        Errors.FORBIDDEN("Only admins can view public holidays")
      );
    }

    const supabase = await getAdminClient();

    const { data: holidays, error } = await supabase
      .from("public_holidays")
      .select("*")
      .order("date");

    if (error) {
      return sendErrorResponse(error);
    }

    return sendSuccessResponse(holidays);
  } catch (error) {
    console.error("Error fetching public holidays:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to fetch public holidays"
      )
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(handler);
