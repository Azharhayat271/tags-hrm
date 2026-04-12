import { NextRequest } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

interface BreakEndRequest {
  break_end?: string; // ISO timestamp, defaults to now
}

async function handler(req: AuthenticatedRequest) {
  try {
    const pathname = req.nextUrl.pathname;
    const parts = pathname.split("/").filter(Boolean);
    const attendanceId = parts[1];
    const breakId = parts[3];

    if (!attendanceId || !breakId) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("Attendance ID and Break ID are required")
      );
    }

    const { userId } = getUserContext(req);
    const body: BreakEndRequest = await req.json();
    const supabase = await getAdminClient();

    // Get current break record
    const { data: currentBreak, error: fetchError } = await supabase
      .from("breaks")
      .select("*")
      .eq("id", breakId)
      .single();

    if (fetchError || !currentBreak) {
      return sendErrorResponse(Errors.NOT_FOUND("Break record"));
    }

    if ((currentBreak as any)?.break_end) {
      return sendErrorResponse(Errors.CONFLICT("Break already ended"));
    }

    const breakEndTime = body.break_end || new Date().toISOString();

    // Validate break_end is after break_start
    if (new Date(breakEndTime) <= new Date((currentBreak as any)?.break_start)) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("break_end time must be after break_start time")
      );
    }

    // Calculate break duration
    const breakStart = new Date((currentBreak as any)?.break_start);
    const breakEnd = new Date(breakEndTime);
    const breakDuration =
      (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60); // minutes

    // Update break record
    const { data: updated, error } = await (supabase
      .from("breaks") as any)
      .update({
        break_end: breakEndTime,
        duration_minutes: breakDuration,
      })
      .eq("id", breakId)
      .select()
      .single();

    if (error) {
      return sendErrorResponse(error);
    }

    await logAuditAction({
      user_id: userId,
      operation: "updated",
      table_name: "breaks",
      record_id: breakId,
      old_values: { break_end: null, duration_minutes: null },
      new_values: { break_end: breakEndTime, duration_minutes: breakDuration },
    });

    return sendSuccessResponse(updated);
  } catch (error) {
    console.error("Error ending break:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to end break"
      )
    );
  }
}

export const PATCH = withAuth(handler);
