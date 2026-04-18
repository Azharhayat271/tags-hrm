import { NextRequest } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { createClient } from "@/lib/supabase/server";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

interface ManualHourEntry {
  date: string; // YYYY-MM-DD format
  checkInTime: string; // HH:MM format (24-hour)
  checkOutTime: string; // HH:MM format (24-hour)
}

function validateDateInCurrentMonth(date: string): boolean {
  const entryDate = new Date(date);
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Check date is valid
  if (isNaN(entryDate.getTime())) return false;

  // Check date is in the past (before today)
  if (entryDate >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    return false;
  }

  // Check date is in current month
  if (entryDate.getMonth() !== currentMonth || entryDate.getFullYear() !== currentYear) {
    return false;
  }

  return true;
}

function parseTimeString(timeStr: string): Date | null {
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

async function handler(req: AuthenticatedRequest) {
  try {
    const { userId } = getUserContext(req);
    const supabase = await createClient();
    const payload: ManualHourEntry = await req.json();

    // Validate request body
    if (!payload.date || !payload.checkInTime || !payload.checkOutTime) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR(
          "Missing required fields: date, checkInTime, checkOutTime"
        )
      );
    }

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
        Errors.VALIDATION_ERROR("Only active employees can add manual hours")
      );
    }

    // Validate date is in current month and in the past
    if (!validateDateInCurrentMonth(payload.date)) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR(
          "Date must be in the past and within the current month"
        )
      );
    }

    // Parse and validate times
    const checkInTime = parseTimeString(payload.checkInTime);
    const checkOutTime = parseTimeString(payload.checkOutTime);

    if (!checkInTime || !checkOutTime) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR(
          "Invalid time format. Use HH:MM format (24-hour)"
        )
      );
    }

    // Validate check-in < check-out
    if (checkInTime >= checkOutTime) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR(
          "Check-in time must be before check-out time"
        )
      );
    }

    // Create full timestamps with the provided date
    const [year, month, day] = payload.date.split("-").map(Number);
    const checkInDateTime = new Date(year, month - 1, day, checkInTime.getHours(), checkInTime.getMinutes());
    const checkOutDateTime = new Date(year, month - 1, day, checkOutTime.getHours(), checkOutTime.getMinutes());

    // Check for overlapping sessions on the same day
    const { data: overlappingSessions } = await supabase
      .from("attendance_sessions")
      .select("id, check_in, check_out")
      .eq("employee_id", employee.id)
      .gte("check_in", new Date(year, month - 1, day).toISOString())
      .lt("check_in", new Date(year, month - 1, day + 1).toISOString());

    if (overlappingSessions && overlappingSessions.length > 0) {
      // Check if any existing session overlaps with the new times
      const hasOverlap = overlappingSessions.some((session: any) => {
        const existingStart = new Date(session.check_in).getTime();
        const existingEnd = session.check_out ? new Date(session.check_out).getTime() : Infinity;
        const newStart = checkInDateTime.getTime();
        const newEnd = checkOutDateTime.getTime();

        // Check for time overlap
        return newStart < existingEnd && newEnd > existingStart;
      });

      if (hasOverlap) {
        return sendErrorResponse(
          Errors.CONFLICT(
            "Manual hours overlap with existing attendance session on this day"
          )
        );
      }
    }

    // Create manual entry
    const now = new Date().toISOString();
    const { data: session, error: insertError } = await supabase
      .from("attendance_sessions")
      .insert({
        employee_id: employee.id,
        check_in: checkInDateTime.toISOString(),
        check_out: checkOutDateTime.toISOString(),
        is_manual_entry: true,
        manual_added_by: employee.id,
        manual_added_at: now,
      })
      .select()
      .single();

    if (insertError) {
      return sendErrorResponse(insertError);
    }

    // Calculate duration for response
    const durationMs = checkOutDateTime.getTime() - checkInDateTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    await logAuditAction({
      user_id: userId,
      operation: "created",
      table_name: "attendance_sessions",
      record_id: (session as any)?.id || "",
      new_values: {
        check_in: checkInDateTime.toISOString(),
        check_out: checkOutDateTime.toISOString(),
        is_manual_entry: true,
      },
    });

    return sendSuccessResponse({
      ...session,
      duration: { hours, minutes },
      message: "Manual hours added successfully",
    });
  } catch (error) {
    console.error("Error adding manual hours:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to add manual hours"
      )
    );
  }
}

export const POST = withAuth(handler);
