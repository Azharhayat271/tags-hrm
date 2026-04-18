import { withAuth, getUserContext, AuthenticatedRequest } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { isPendingStatus } from "@/lib/leave/balance";

interface Ctx {
  params: Promise<{ id: string }>;
}

// Employee-initiated cancel. Allowed while the request is still pending
// (pending / pending_manager / pending_hr). Sets status = cancelled.
async function handler(req: AuthenticatedRequest, ctx: Ctx) {
  try {
    const { userId } = getUserContext(req);
    const { id: requestId } = await ctx.params;

    const supabase = await getAdminClient();

    const { data: request, error: reqErr } = await supabase
      .from("leave_requests")
      .select(
        `
        id, status,
        employee:employees!leave_requests_employee_id_fkey(profile_id)
      `
      )
      .eq("id", requestId)
      .single();

    if (reqErr || !request) {
      return sendErrorResponse(Errors.NOT_FOUND("Leave request"));
    }

    const r = request as any;
    const employee = Array.isArray(r.employee) ? r.employee[0] : r.employee;

    if (!employee || employee.profile_id !== userId) {
      return sendErrorResponse(
        Errors.FORBIDDEN("You can only cancel your own leave requests")
      );
    }

    if (!isPendingStatus(r.status)) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR(
          `Only pending requests can be cancelled (current status: ${r.status})`
        )
      );
    }

    const { data: updated, error: upErr } = await (supabase.from("leave_requests") as any)
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select()
      .single();

    if (upErr) {
      return sendErrorResponse(upErr);
    }

    await logAuditAction({
      user_id: userId,
      operation: "updated",
      table_name: "leave_requests",
      record_id: requestId,
      old_values: { status: r.status },
      new_values: { status: "cancelled" },
    });

    return sendSuccessResponse(updated);
  } catch (err) {
    console.error("Cancel leave error:", err);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        err instanceof Error ? err.message : "Failed to cancel leave request"
      )
    );
  }
}

export const DELETE = withAuth(handler);
