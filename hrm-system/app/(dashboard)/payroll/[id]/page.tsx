import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import PDFViewer from "@/components/payroll/PDFViewer";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SalarySlipViewPage({ params }: PageProps) {
  const { id } = await params;
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
    redirect("/payroll");
  }

  // Get salary slip
  const { data: slip, error } = await supabase
    .from("salary_slips")
    .select("*")
    .eq("id", id)
    .eq("employee_id", employee.id)
    .single();

  if (error || !slip) {
    notFound();
  }

  // Get signed URL for the PDF using admin client
  const adminClient = await createAdminClient();
  const { data: urlData, error: urlError } = await adminClient
    .storage
    .from("salary-slips")
    .createSignedUrl(slip.file_path, 3600); // 1 hour expiry

  if (urlError) {
    console.error("Error creating signed URL:", urlError);
  }

  const pdfUrl = urlData?.signedUrl || null;

  const monthName = getMonthName(slip.month);

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/payroll"
          className="inline-flex items-center gap-2 text-sm mb-4 hover:underline"
          style={{ color: "var(--tag-orange)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Payroll
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ fontSize: "2rem", lineHeight: "1.1", letterSpacing: "-0.64px" }}>
              {monthName} {slip.year}
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--tag-body)" }}>
              Uploaded {formatDate(slip.uploaded_at)}
            </p>
          </div>
          {pdfUrl && (
            <a
              href={pdfUrl}
              download={`salary-slip-${slip.year}-${slip.month}.pdf`}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </a>
          )}
        </div>
      </div>

      {pdfUrl ? (
        <PDFViewer pdfUrl={pdfUrl} />
      ) : (
        <div className="card p-6">
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: 'var(--tag-danger)' }}>
              Failed to load salary slip. Please contact your administrator.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
}
