import { withAuth, getUserContext, AuthenticatedRequest } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { canApprove } from "@/lib/leave/balance";
import { hasPermission } from "@/lib/permissions";

interface Ctx {
  params: Promise<{ id: string }>;
}

async function handler(req: AuthenticatedRequest, ctx: Ctx) {
  try {
    const { userId } = getUserContext(req);
    const { id: requestId } = await ctx.params;
    const body = await req.json().catch(() => ({} as any));
    const reviewNote: string | null = body?.review_note?.trim() || null;

    const supabase = await getAdminClient();

    const { data: request, error: reqErr } = await supabase
      .from("leave_requests")
      .select(
        `
        id, employee_id, leave_type_id, start_date, end_date, days, status,
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

    // No self-approval
    if (employee.profile_id === userId) {
      return sendErrorResponse(
        Errors.FORBIDDEN("You can't approve your own leave request")
      );
    }

    // Identify approver's role in this workflow
    const { data: approverEmp } = await supabase
      .from("employees")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();
    const approverEmpId = (approverEmp as { id?: string } | null)?.id || null;
    const isManager = !!(approverEmpId && employee.reports_to === approverEmpId);
    const isHr = await hasPermission(userId, "leave.approve");

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = { updated_at: nowIso };
    let newStatus: string;

    if (r.status === "pending_manager") {
      if (!isManager) {
        return sendErrorResponse(
          Errors.FORBIDDEN("Only the employee's manager can approve at this stage")
        );
      }
      newStatus = "pending_hr";
      updatePayload.manager_reviewed_by = userId;
      updatePayload.manager_reviewed_at = nowIso;
      updatePayload.manager_review_note = reviewNote;
    } else if (r.status === "pending_hr" || r.status === "pending") {
      if (!isHr) {
        return sendErrorResponse(
          Errors.FORBIDDEN("Only HR/admin can give final approval")
        );
      }
      // Re-check balance at HR step — another request may have been approved in between
      const check = await canApprove(
        supabase as any,
        r.employee_id,
        r.leave_type_id,
        r.days,
        new Date(r.start_date).getFullYear(),
        r.id
      );
      if (!check.ok) {
        return sendErrorResponse(Errors.VALIDATION_ERROR(check.reason));
      }
      newStatus = "approved";
      updatePayload.reviewed_by = userId;
      updatePayload.review_note = reviewNote;
    } else {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR(`Cannot approve a request with status '${r.status}'`)
      );
    }

    updatePayload.status = newStatus;

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
      new_values: { status: newStatus },
    });

    return sendSuccessResponse(updated);
  } catch (err) {
    console.error("Approve leave error:", err);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        err instanceof Error ? err.message : "Failed to approve leave request"
      )
    );
  }
}

export const PATCH = withAuth(handler);
