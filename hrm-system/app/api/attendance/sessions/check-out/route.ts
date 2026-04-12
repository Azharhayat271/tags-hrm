import { NextRequest } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { createClient } from "@/lib/supabase/server";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

async function handler(req: AuthenticatedRequest) {
  try {
    const { userId } = getUserContext(req);
    const supabase = await createClient();

    // Get employee record
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("id")
      .eq("profile_id", userId)
      .single();

    if (empError || !employee) {
      return sendErrorResponse(Errors.NOT_FOUND("Employee record"));
    }

    // Find active session
    const { data: activeSession, error: fetchError } = await supabase
      .from("attendance_sessions")
      .select("id, check_in")
      .eq("employee_id", employee.id)
      .is("check_out", null)
      .order("check_in", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !activeSession) {
      return sendErrorResponse(
        Errors.NOT_FOUND("No active session found. Please check in first.")
      );
    }

    // Update session with check_out
    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from("attendance_sessions")
      .update({ check_out: now })
      .eq("id", activeSession.id)
      .select()
      .single();

    if (updateError) {
      return sendErrorResponse(updateError);
    }

    // Calculate session duration
    const checkIn = new Date(activeSession.check_in);
    const checkOut = new Date(now);
    const durationMs = checkOut.getTime() - checkIn.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    await logAuditAction({
      user_id: userId,
      operation: "updated",
      table_name: "attendance_sessions",
      record_id: activeSession.id,
      old_values: { check_out: null },
      new_values: { check_out: now },
    });

    return sendSuccessResponse({
      ...updated,
      duration: { hours, minutes },
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

export const POST = withAuth(handler);
