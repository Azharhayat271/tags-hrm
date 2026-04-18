import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { withAuth, getUserContext, requireRole, AuthenticatedRequest } from "@/app/api/middleware";

interface AutoCloseRequest {
  max_session_hours?: number;
  threshold_date?: string; // ISO date, sessions before this will be closed
}

interface AutoClosedSession {
  id: string;
  employee_id: string;
  check_in: string;
  check_out: string;
  duration_hours: number;
}

/**
 * Auto-close stale open attendance sessions (nightly cleanup)
 * POST /api/attendance/sessions/auto-close
 *
 * Query params:
 * - max_session_hours: max hours a session can stay open (default: 14)
 * - threshold_date: ISO date for cutoff (default: yesterday)
 *
 * 🔒 Admin-only endpoint (leverages auth middleware)
 */
async function postHandler(req: AuthenticatedRequest) {
  try {
    const { userId } = getUserContext(req);
    const supabase = await getAdminClient();

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const maxSessionHours = parseInt(searchParams.get("max_session_hours") || "14");
    const thresholdDate = searchParams.get("threshold_date");

    // Calculate cutoff: sessions open before this time will be closed
    let cutoffTime: Date;
    if (thresholdDate) {
      cutoffTime = new Date(thresholdDate);
    } else {
      // Default: close sessions from yesterday end-of-day (24h+ old)
      cutoffTime = new Date();
      cutoffTime.setDate(cutoffTime.getDate() - 1);
      cutoffTime.setHours(23, 59, 59, 999);
    }

    console.log(
      `[Auto-Close] Starting cleanup for sessions older than ${cutoffTime.toISOString()}, max ${maxSessionHours}h per session`
    );

    // Find all open sessions that are too old (past cutoff OR past max duration)
    const { data: staleSessionsData, error: fetchError } = await (
      supabase.from("attendance_sessions") as any
    )
      .select("id, employee_id, check_in, check_out")
      .is("check_out", null) // Only open sessions
      .lt("check_in", cutoffTime.toISOString());

    if (fetchError) {
      console.error("[Auto-Close] Database fetch error:", fetchError);
      return sendErrorResponse(Errors.INTERNAL_ERROR("Failed to fetch stale sessions"));
    }

    const staleSessions: Array<{
      id: string;
      employee_id: string;
      check_in: string;
    }> = staleSessionsData || [];

    if (staleSessions.length === 0) {
      console.log("[Auto-Close] No stale sessions found");
      return sendSuccessResponse({
        closed: 0,
        sessions: [],
        message: "No stale sessions to close",
      });
    }

    console.log(`[Auto-Close] Found ${staleSessions.length} stale sessions`);

    // Process each stale session
    const closedSessions: AutoClosedSession[] = [];
    const updatePromises: Promise<any>[] = [];

    for (const session of staleSessions) {
      const checkInTime = new Date(session.check_in);
      let checkOutTime = new Date(checkInTime);
      const autoClosedAt = new Date().toISOString();
      const autoCloseReason = `overnight_auto_close_${maxSessionHours}h_threshold`;

      // Add max session hours to check_in
      checkOutTime.setHours(checkOutTime.getHours() + maxSessionHours);

      const durationMs = checkOutTime.getTime() - checkInTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      // Queue the update
      const updatePromise = (supabase.from("attendance_sessions") as any)
        .update({
          check_out: checkOutTime.toISOString(),
          auto_closed_at: autoClosedAt,
          auto_close_reason: autoCloseReason,
        })
        .eq("id", session.id)
        .then(async (result: any) => {
          if (result.error) {
            console.error(`[Auto-Close] Failed to close session ${session.id}:`, result.error);
            return null;
          }

          closedSessions.push({
            id: session.id,
            employee_id: session.employee_id,
            check_in: session.check_in,
            check_out: checkOutTime.toISOString(),
            duration_hours: durationHours,
          });

          // Log audit action for this auto-close
          try {
            await logAuditAction({
              user_id: userId,
              operation: "updated",
              table_name: "attendance_sessions",
              record_id: session.id,
              old_values: {
                check_out: null,
                auto_closed_at: null,
              },
              new_values: {
                check_out: checkOutTime.toISOString(),
                auto_closed_at: autoClosedAt,
                auto_close_reason: autoCloseReason,
              },
            });
          } catch (auditError) {
            console.error(`[Auto-Close] Audit logging failed for session ${session.id}:`, auditError);
            // Don't fail the entire operation if audit logging fails
          }

          return session.id;
        });

      updatePromises.push(updatePromise);
    }

    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);
    const successCount = results.filter((r) => r !== null).length;

    console.log(`[Auto-Close] Successfully closed ${successCount}/${staleSessions.length} sessions`);

    return sendSuccessResponse({
      closed: successCount,
      total_stale: staleSessions.length,
      sessions: closedSessions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Auto-Close] Unexpected error:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Auto-close operation failed"
      )
    );
  }
}

/**
 * Optional: GET endpoint for checking pending auto-close candidates
 * Useful for monitoring/alerting
 */
async function getHandler(req: AuthenticatedRequest) {
  try {
    const supabase = await getAdminClient();
    const maxSessionHours = parseInt(req.nextUrl.searchParams.get("max_session_hours") || "14");

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxSessionHours);

    // Count pending auto-close candidates
    const { data: pendingSessions, error } = await (supabase.from("attendance_sessions") as any)
      .select("id, employee_id, check_in, created_at")
      .is("check_out", null)
      .lt("check_in", cutoffTime.toISOString());

    if (error) {
      return sendErrorResponse(Errors.INTERNAL_ERROR("Failed to fetch pending sessions"));
    }

    const candidates = pendingSessions || [];
    const oldestSessionHours = candidates.length > 0
      ? Math.round((Date.now() - new Date(candidates[0].check_in).getTime()) / (1000 * 60 * 60))
      : 0;

    return sendSuccessResponse({
      pending_count: candidates.length,
      max_session_hours: maxSessionHours,
      oldest_session_hours: oldestSessionHours,
      candidates: candidates.slice(0, 10), // Return first 10 for preview
    });
  } catch (error) {
    console.error("[Auto-Close Check] Error:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR("Failed to check pending sessions")
    );
  }
}

export const POST = withAuth(requireRole("admin", "super_admin")(postHandler));
export const GET = withAuth(requireRole("admin", "super_admin")(getHandler));
