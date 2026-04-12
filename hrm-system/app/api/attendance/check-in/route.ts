import { NextRequest } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

interface CheckInRequest {
  check_in?: string; // ISO timestamp, defaults to now
}

async function handler(req: AuthenticatedRequest) {
  try {
    const { userId } = getUserContext(req);
    const body: CheckInRequest = await req.json();
    const supabase = await getAdminClient();

    // Get employee record for this user
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("id")
      .eq("profile_id", userId)
      .single();

    if (empError || !employee) {
      return sendErrorResponse(Errors.NOT_FOUND("Employee record"));
    }

    const checkInTime = body.check_in || new Date().toISOString();
    const checkInDate = new Date(checkInTime).toISOString().split("T")[0];

    // Check if already checked in today
    const { data: existingRecord } = await supabase
      .from("attendance")
      .select("id")
      .eq("employee_id", (employee as any)?.id)
      .eq("date", checkInDate)
      .single();

    if (existingRecord) {
      return sendErrorResponse(
        Errors.CONFLICT("Already checked in today")
      );
    }

    // Insert attendance record
    const { data: attendance, error } = await supabase
      .from("attendance")
      .insert({
        employee_id: (employee as any)?.id,
        date: checkInDate,
        check_in: checkInTime,
      } as any)
      .select()
      .single();

    if (error) {
      return sendErrorResponse(error);
    }

    await logAuditAction({
      user_id: userId,
      operation: "created",
      table_name: "attendance",
      record_id: (attendance as any)?.id || "",
      new_values: { employee_id: (employee as any)?.id, date: checkInDate, check_in: checkInTime },
    });

    return sendSuccessResponse(attendance, 201);
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
