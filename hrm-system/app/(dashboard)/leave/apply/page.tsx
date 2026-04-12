import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ApplyLeaveForm from "@/components/leave/ApplyLeaveForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ApplyLeavePage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get employee record
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("profile_id", user?.id)
    .single();

  if (!employee) {
    redirect("/leave");
  }

  // Get leave types
  const { data: leaveTypes } = await supabase
    .from("leave_types")
    .select("*")
    .order("name");

  // Get public holidays for calculation
  const { data: publicHolidays } = await supabase
    .from("public_holidays")
    .select("date")
    .order("date");

  const holidayDates = publicHolidays?.map(h => h.date) || [];

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/leave"
          className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
          style={{ color: "var(--tag-orange)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leave
        </Link>
        <h1 style={{ fontSize: "2rem", lineHeight: "1.1", letterSpacing: "-0.64px" }}>
          Apply for Leave
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--tag-body)" }}>
          Submit a new leave request
        </p>
      </div>

      <div className="max-w-2xl">
        <ApplyLeaveForm 
          employeeId={employee.id}
          leaveTypes={leaveTypes || []}
          holidayDates={holidayDates}
        />
      </div>
    </div>
  );
}
