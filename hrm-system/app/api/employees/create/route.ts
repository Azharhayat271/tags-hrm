import { NextRequest, NextResponse } from "next/server";
import { withAuth, getUserContext } from "@/app/api/middleware";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendSuccessResponse, sendErrorResponse, Errors } from "@/app/api/utils/errors";
import { logAuditAction } from "@/app/api/utils/audit";
import { AuthenticatedRequest } from "@/app/api/middleware";

interface CreateEmployeeRequest {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  designation_id: string;
  department_id: string;
  employment_type: string;
  joining_date: string;
  reports_to?: string;
}

async function handler(req: AuthenticatedRequest) {
  try {
    // Only admins and super_admins can create employees
    if (!["admin", "super_admin"].includes(req.userRole || "")) {
      return sendErrorResponse(Errors.FORBIDDEN("Only admins can create employees"));
    }

    const body: CreateEmployeeRequest = await req.json();

    // Validate required fields
    if (!body.full_name || !body.email || !body.password) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("full_name, email, and password are required")
      );
    }

    if (!body.designation_id || !body.department_id) {
      return sendErrorResponse(
        Errors.VALIDATION_ERROR("designation_id and department_id are required")
      );
    }

    const { userId } = getUserContext(req);
    const supabase = await getAdminClient();

    // 1. Check if email already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", body.email)
      .single();

    if (existingProfile) {
      return sendErrorResponse(Errors.CONFLICT("Email already exists"));
    }

    // 2. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return sendErrorResponse(
        Errors.INTERNAL_ERROR(`Failed to create user: ${authError?.message}`)
      );
    }

    const newUserId = authData.user.id;

    // 3. Create profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: newUserId,
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
        role: "employee",
      } as any)
      .select()
      .single();

    if (profileError) {
      // Delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(newUserId);
      return sendErrorResponse(profileError);
    }

    // 4. Create employee record
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .insert({
        profile_id: newUserId,
        designation_id: body.designation_id,
        department_id: body.department_id,
        employment_type: body.employment_type || "full_time",
        joining_date: body.joining_date,
        reports_to: body.reports_to || null,
        status: "active",
      } as any)
      .select()
      .single();

    if (employeeError) {
      // Cleanup: delete profile and auth user
      await supabase.from("profiles").delete().eq("id", newUserId);
      await supabase.auth.admin.deleteUser(newUserId);
      return sendErrorResponse(employeeError);
    }

    // 5. Log audit action
    await logAuditAction({
      user_id: userId,
      operation: "created",
      table_name: "employees",
      record_id: (employee as any)?.id || "",
      new_values: {
        profile_id: newUserId,
        full_name: body.full_name,
        email: body.email,
        designation_id: body.designation_id,
        department_id: body.department_id,
      },
    });

    return sendSuccessResponse({
      employee_id: (employee as any)?.id || "",
      profile_id: newUserId,
      email: body.email,
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    return sendErrorResponse(
      Errors.INTERNAL_ERROR(
        error instanceof Error ? error.message : "Failed to create employee"
      )
    );
  }
}

export const POST = withAuth(handler);
