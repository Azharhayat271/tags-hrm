import { NextRequest, NextResponse } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { createClient } from "@/lib/supabase/server";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

interface UpdateEmployeeRequest {
  full_name?: string;
  email?: string;
  phone?: string;
  designation_id?: string;
  department_id?: string;
  employment_type?: string;
  joining_date?: string;
  reports_to?: string;
}

async function handler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Only admins and super_admins can update employees
    if (!["admin", "super_admin"].includes(req.userRole || "")) {
      return sendErrorResponse(Errors.FORBIDDEN("Only admins can update employees"));
    }

    const body: UpdateEmployeeRequest = await req.json();
    const { userId } = getUserContext(req);
    const supabase = await createClient();

    // Get current employee data
    const { data: currentEmployee, error: fetchError } = await supabase
      .from("employees")
      .select("*, profiles(full_name, email, phone)")
      .eq("id", id)
      .single();

    if (fetchError || !currentEmployee) {
      return sendErrorResponse(Errors.NOT_FOUND("Employee not found"));
    }

    // Update profile if personal info changed
    if (body.full_name || body.email || body.phone !== undefined) {
      const profileUpdates: any = {};
      if (body.full_name) profileUpdates.full_name = body.full_name;
      if (body.email) profileUpdates.email = body.email;
      if (body.phone !== undefined) profileUpdates.phone = body.phone;

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", currentEmployee.profile_id);

      if (profileError) {
        return sendErrorResponse(profileError);
      }
    }

    // Update employee record
    const employeeUpdates: any = {};
    if (body.designation_id) employeeUpdates.designation_id = body.designation_id;
    if (body.department_id) employeeUpdates.department_id = body.department_id;
    if (body.employment_type) employeeUpdates.employment_type = body.employment_type;
    if (body.joining_date !== undefined) employeeUpdates.joining_date = body.joining_date;
    if (body.reports_to !== undefined) employeeUpdates.reports_to = body.reports_to || null;

    if (Object.keys(employeeUpdates).length > 0) {
      const { error: employeeError } = await supabase
        .from("employees")
        .update(employeeUpdates)
        .eq("id", id);

      if (employeeError) {
        return sendErrorResponse(employeeError);
      }
    }

    // Log audit action
    await logAuditAction({
      user_id: userId,
      operation: "updated",
      table_name: "employees",
      record_id: id,
      old_values: {
        full_name: currentEmployee.profiles?.full_name,
        email: currentEmployee.profiles?.email,
        designation_id: currentEmployee.designation_id,
        department_id: currentEmployee.department_id,
      },
      new_values: {
        full_name: body.full_name,
        email: body.email,
        designation_id: body.designation_id,
        department_id: body.department_id,
      },
    });

    return sendSuccessResponse({ message: "Employee updated successfully" });
  } catch (error) {
    console.error("Error updating employee:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to update employee"
      )
    );
  }
}

export const PATCH = withAuth(handler);
