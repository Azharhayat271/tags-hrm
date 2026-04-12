import { NextRequest } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

interface BreakStartRequest {
  break_start?: string; // ISO timestamp, defaults to now
}

async function handler(req: AuthenticatedRequest) {
  try {
    const pathname = req.nextUrl.pathname;
    const attendanceId = pathname.split("/")[2];

    if (!attendanceId) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("Attendance ID is required")
      );
    }

    const { userId } = getUserContext(req);
    const body: BreakStartRequest = await req.json();
    const supabase = await getAdminClient();

    // Verify attendance record exists and employee has checked in
    const { data: attendance, error: fetchError } = await supabase
      .from("attendance")
      .select("*")
      .eq("id", attendanceId)
      .single();

    if (fetchError || !attendance) {
      return sendErrorResponse(Errors.NOT_FOUND("Attendance record"));
    }

    if (!(attendance as any)?.check_in) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("Must check in before taking a break")
      );
    }

    const breakStartTime = body.break_start || new Date().toISOString();

    // Insert break record
    const { data: breakRecord, error } = await (supabase
      .from("breaks") as any)
      .insert({
        attendance_id: attendanceId,
        break_start: breakStartTime,
      })
      .select()
      .single();

    if (error) {
      return sendErrorResponse(error);
    }

    await logAuditAction({
      user_id: userId,
      operation: "created",
      table_name: "breaks",
      record_id: (breakRecord as any)?.id || "",
      new_values: { attendance_id: attendanceId, break_start: breakStartTime },
    });

    return sendSuccessResponse(breakRecord, 201);
  } catch (error) {
    console.error("Error starting break:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to start break"
      )
    );
  }
}

export const POST = withAuth(handler);
