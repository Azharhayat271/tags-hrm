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
      .select("id, status")
      .eq("profile_id", userId)
      .single();

    if (empError || !employee) {
      return sendErrorResponse(Errors.NOT_FOUND("Employee record"));
    }

    if (employee.status !== "active") {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("Only active employees can check in")
      );
    }

    // Check if there's an active session (checked in but not checked out)
    const { data: activeSession } = await supabase
      .from("attendance_sessions")
      .select("id, check_in")
      .eq("employee_id", employee.id)
      .is("check_out", null)
      .order("check_in", { ascending: false })
      .limit(1)
      .single();

    if (activeSession) {
      return sendErrorResponse(
        Errors.CONFLICT(
          `You have an active session since ${new Date(activeSession.check_in).toLocaleTimeString()}. Please check out first.`
        )
      );
    }

    // Create new session
    const now = new Date().toISOString();
    const { data: session, error: insertError } = await supabase
      .from("attendance_sessions")
      .insert({
        employee_id: employee.id,
        check_in: now,
      })
      .select()
      .single();

    if (insertError) {
      return sendErrorResponse(insertError);
    }

    await logAuditAction({
      user_id: userId,
      operation: "created",
      table_name: "attendance_sessions",
      record_id: (session as any)?.id || "",
      new_values: { check_in: now },
    });

    return sendSuccessResponse(session);
  } catch (error) {
    console.error("Error checking in:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to check in"
      )
    );
  }
}

export const POST = withAuth(handler);
