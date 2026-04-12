import { NextRequest } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { createClient } from "@/lib/supabase/server";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
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

    // Get today's sessions (last 24 hours to include night shifts)
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const { data: sessions, error: sessionsError } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("employee_id", employee.id)
      .gte("check_in", last24Hours.toISOString())
      .order("check_in", { ascending: false });

    if (sessionsError) {
      return sendErrorResponse(sessionsError);
    }

    // Calculate total hours
    let totalHours = 0;
    let totalMinutes = 0;
    const activeSessions = sessions?.filter(s => !s.check_out) || [];
    const completedSessions = sessions?.filter(s => s.check_out) || [];

    completedSessions.forEach(session => {
      const checkIn = new Date(session.check_in);
      const checkOut = new Date(session.check_out);
      const durationMs = checkOut.getTime() - checkIn.getTime();
      totalHours += Math.floor(durationMs / (1000 * 60 * 60));
      totalMinutes += Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    });

    // Add minutes to hours
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;

    return sendSuccessResponse({
      sessions: sessions || [],
      active_session: activeSessions[0] || null,
      completed_sessions: completedSessions,
      summary: {
        total_sessions: sessions?.length || 0,
        active_sessions: activeSessions.length,
        completed_sessions: completedSessions.length,
        total_hours: totalHours,
        total_minutes: totalMinutes,
      },
    });
  } catch (error) {
    console.error("Error fetching today's sessions:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to fetch sessions"
      )
    );
  }
}

export const GET = withAuth(handler);
