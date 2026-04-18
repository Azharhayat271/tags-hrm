import { withAuth, getUserContext, AuthenticatedRequest } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { calculateWorkingDays, getBalance } from "@/lib/leave/balance";

interface CreateBody {
  leave_type_id?: string;
  start_date?: string;
  end_date?: string;
  reason?: string | null;
}

async function handler(req: AuthenticatedRequest) {
  try {
    const { userId } = getUserContext(req);
    const body = (await req.json()) as CreateBody;

    if (!body.leave_type_id || !body.start_date || !body.end_date) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("leave_type_id, start_date and end_date are required")
      );
    }
    if (body.start_date > body.end_date) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("start_date must be on or before end_date")
      );
    }
    const today = new Date().toISOString().split("T")[0];
    if (body.start_date < today) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("start_date cannot be in the past")
      );
    }

    const supabase = await getAdminClient();

    const { data: employee, error: empErr } = await supabase
      .from("employees")
      .select("id, reports_to, status")
      .eq("profile_id", userId)
      .single();

    if (empErr || !employee) {
      return sendErrorResponse(Errors.NOT_FOUND("Employee record"));
    }

    const emp = employee as { id: string; reports_to: string | null; status: string };
    if (emp.status !== "active") {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("Only active employees can apply for leave")
      );
    }

    const { data: holidays } = await supabase
      .from("public_holidays")
      .select("date")
      .gte("date", body.start_date)
      .lte("date", body.end_date);
    const holidayDates = ((holidays as Array<{ date: string }>) || []).map((h) => h.date);

    const workingDays = calculateWorkingDays(body.start_date, body.end_date, holidayDates);
    if (workingDays <= 0) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("Selected range contains no working days")
      );
    }

    // Overlap with existing non-rejected/non-cancelled requests
    const { data: overlaps } = await supabase
      .from("leave_requests")
      .select("id")
      .eq("employee_id", emp.id)
      .in("status", ["pending", "pending_manager", "pending_hr", "approved"])
      .lte("start_date", body.end_date)
      .gte("end_date", body.start_date);

    if (overlaps && overlaps.length > 0) {
      return sendErrorResponse(
        Errors.CONFLICT("You already have a leave request overlapping these dates")
      );
    }

    // Balance check (unpaid types pass because unlimited=true)
    const balance = await getBalance(
      supabase as any,
      emp.id,
      body.leave_type_id,
      new Date(body.start_date).getFullYear()
    );
    if (!balance) {
      return sendErrorResponse(Errors.NOT_FOUND("Leave type"));
    }
    if (!balance.unlimited && workingDays > balance.remaining) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR(
          `Not enough ${balance.leaveTypeName} balance. ${balance.remaining} day(s) available, you requested ${workingDays}.`
        )
      );
    }

    const initialStatus = emp.reports_to ? "pending_manager" : "pending_hr";

    const { data: inserted, error: insErr } = await (supabase.from("leave_requests") as any)
      .insert({
        employee_id: emp.id,
        leave_type_id: body.leave_type_id,
        start_date: body.start_date,
        end_date: body.end_date,
        days: workingDays,
        reason: body.reason || null,
        status: initialStatus,
      })
      .select()
      .single();

    if (insErr) {
      return sendErrorResponse(insErr);
    }

    await logAuditAction({
      user_id: userId,
      operation: "created",
      table_name: "leave_requests",
      record_id: (inserted as { id?: string })?.id || "",
      new_values: inserted || undefined,
    });

    return sendSuccessResponse(inserted, 201);
  } catch (err) {
    console.error("Create leave request error:", err);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        err instanceof Error ? err.message : "Failed to create leave request"
      )
    );
  }
}

export const POST = withAuth(handler);
