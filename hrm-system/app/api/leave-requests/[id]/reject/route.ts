import { withAuth, getUserContext, AuthenticatedRequest } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { hasPermission } from "@/lib/permissions";

interface Ctx {
  params: Promise<{ id: string }>;
}

async function handler(req: AuthenticatedRequest, ctx: Ctx) {
  try {
    const { userId } = getUserContext(req);
    const { id: requestId } = await ctx.params;
    const body = await req.json().catch(() => ({} as any));
    const reviewNote: string = (body?.review_note || "").trim();

    if (!reviewNote) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("A review note is required when rejecting a leave request")
      );
    }

    const supabase = await getAdminClient();

    const { data: request, error: reqErr } = await supabase
      .from("leave_requests")
      .select(
        `
        id, status,
        employee:employees!leave_requests_employee_id_fkey(id, profile_id, reports_to)
      `
      )
      .eq("id", requestId)
      .single();

    if (reqErr || !request) {
      return sendErrorResponse(Errors.NOT_FOUND("Leave request"));
    }

    const r = request as any;
    const employee = Array.isArray(r.employee) ? r.employee[0] : r.employee;
    if (!employee) {
      return sendErrorResponse(Errors.NOT_FOUND("Employee on request"));
    }

    if (employee.profile_id === userId) {
      return sendErrorResponse(
        Errors.FORBIDDEN("You can't reject your own leave request")
      );
    }

    const { data: approverEmp } = await supabase
      .from("employees")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();
    const approverEmpId = (approverEmp as { id?: string } | null)?.id || null;
    const isManager = !!(approverEmpId && employee.reports_to === approverEmpId);
    const isHr = await hasPermission(userId, "leave.approve");

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      status: "rejected",
      updated_at: nowIso,
      reviewed_by: userId,
      review_note: reviewNote,
    };

    if (r.status === "pending_manager") {
      if (!isManager) {
        return sendErrorResponse(
          Errors.FORBIDDEN("Only the employee's manager can reject at this stage")
        );
      }
      updatePayload.manager_reviewed_by = userId;
      updatePayload.manager_reviewed_at = nowIso;
      updatePayload.manager_review_note = reviewNote;
    } else if (r.status === "pending_hr" || r.status === "pending") {
      if (!isHr) {
        return sendErrorResponse(
          Errors.FORBIDDEN("Only HR/admin can reject at this stage")
        );
      }
    } else {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR(`Cannot reject a request with status '${r.status}'`)
      );
    }

    const { data: updated, error: upErr } = await (supabase.from("leave_requests") as any)
      .update(updatePayload)
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
      new_values: { status: "rejected" },
    });

    return sendSuccessResponse(updated);
  } catch (err) {
    console.error("Reject leave error:", err);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        err instanceof Error ? err.message : "Failed to reject leave request"
      )
    );
  }
}

export const PATCH = withAuth(handler);
