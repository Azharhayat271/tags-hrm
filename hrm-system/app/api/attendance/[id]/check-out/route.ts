import { NextRequest } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

interface CheckOutRequest {
  check_out?: string; // ISO timestamp, defaults to now
}

async function handler(req: AuthenticatedRequest) {
  try {
    const pathname = req.nextUrl.pathname;
    const attendanceId = pathname.split("/")[3]; // Fixed: was [2], should be [3]

    if (!attendanceId) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("Attendance ID is required")
      );
    }

    const { userId } = getUserContext(req);
    
    // Handle empty body
    let body: CheckOutRequest = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // Empty body is fine, we'll use current time
    }
    
    const supabase = await getAdminClient();

    // Get current attendance record
    const { data: currentAttendance, error: fetchError } = await supabase
      .from("attendance")
      .select("*")
      .eq("id", attendanceId)
      .single();

    if (fetchError || !currentAttendance) {
      return sendErrorResponse(Errors.NOT_FOUND("Attendance record"));
    }

    // Check if already checked out
    if ((currentAttendance as any)?.check_out) {
      return sendErrorResponse(Errors.CONFLICT("Already checked out today"));
    }

    const checkOutTime = body.check_out || new Date().toISOString();

    // Validate check_out is after check_in
    if (new Date(checkOutTime) <= new Date((currentAttendance as any)?.check_in)) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("check_out time must be after check_in time")
      );
    }

    // Calculate hours worked
    const checkIn = new Date((currentAttendance as any)?.check_in);
    const checkOut = new Date(checkOutTime);
    const hoursWorked =
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

    // Update attendance record (don't save hours_worked as column doesn't exist)
    const { data: updated, error } = await (supabase
      .from("attendance") as any)
      .update({
        check_out: checkOutTime,
      })
      .eq("id", attendanceId)
      .select()
      .single();

    if (error) {
      return sendErrorResponse(error);
    }

    await logAuditAction({
      user_id: userId,
      operation: "updated",
      table_name: "attendance",
      record_id: attendanceId,
      old_values: { check_out: null },
      new_values: { check_out: checkOutTime },
    });

    return sendSuccessResponse({
      ...updated,
      hours_worked: hoursWorked, // Return calculated hours but don't store
    });
  } catch (error) {
    console.error("Error checking out:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to check out"
      )
    );
  }
}

export const PATCH = withAuth(handler);
