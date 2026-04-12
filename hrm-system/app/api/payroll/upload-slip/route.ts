import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or super_admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const employee_id = formData.get("employee_id") as string;
    const month = parseInt(formData.get("month") as string);
    const year = parseInt(formData.get("year") as string);

    // Validate inputs
    if (!file || !employee_id || !month || !year) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { message: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { message: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Check if employee exists
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id")
      .eq("id", employee_id)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }

    // Check if salary slip already exists for this month/year
    const { data: existingSlip } = await supabase
      .from("salary_slips")
      .select("id, file_path")
      .eq("employee_id", employee_id)
      .eq("month", month)
      .eq("year", year)
      .single();

    // If exists, delete the old file from storage using admin client
    if (existingSlip) {
      const adminClient = await createAdminClient();
      await adminClient.storage
        .from("salary-slips")
        .remove([existingSlip.file_path]);
    }

    // Upload file to storage using admin client (bypasses RLS)
    const fileExt = "pdf";
    const fileName = `${employee_id}/${year}/${month}.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();

    const adminClient = await createAdminClient();
    const { error: uploadError } = await adminClient.storage
      .from("salary-slips")
      .upload(fileName, fileBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { message: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // Insert or update salary slip record
    const { error: dbError } = await supabase
      .from("salary_slips")
      .upsert(
        {
          employee_id,
          month,
          year,
          file_path: fileName,
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString(),
        },
        {
          onConflict: "employee_id,month,year",
        }
      );

    if (dbError) {
      console.error("Database error:", dbError);
      // Clean up uploaded file using admin client
      const adminClient = await createAdminClient();
      await adminClient.storage.from("salary-slips").remove([fileName]);
      return NextResponse.json(
        { message: "Failed to save salary slip record" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: { message: "Salary slip uploaded successfully" } },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
