import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { DollarSign, Download, FileText } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface SalarySlip {
  id: string;
  year: number;
  month: number;
  uploaded_at: string;
}

export default async function PayrollPage() {
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
    return (
      <div>
        <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
          Payroll
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
          Employee record not found
        </p>
      </div>
    );
  }

  // Get salary slips
  const { data: salarySlipsData } = await supabase
    .from("salary_slips")
    .select(`
      *,
      uploaded_by_profile:uploaded_by(full_name)
    `)
    .eq("employee_id", employee.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  const salarySlips: SalarySlip[] = (salarySlipsData ?? []) as SalarySlip[];

  // Group by year
  const slipsByYear = salarySlips.reduce<Record<number, SalarySlip[]>>((acc, slip) => {
    if (!acc[slip.year]) {
      acc[slip.year] = [];
    }

    acc[slip.year].push(slip);
    return acc;
  }, {});

  const years = Object.keys(slipsByYear).sort((a, b) => parseInt(b) - parseInt(a));
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Get latest slip
  const latestSlip = salarySlips?.[0];

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.64px' }}>
          Payroll
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--tag-body)' }}>
          View and download your salary slips
        </p>
      </div>

      {/* Latest Slip Card */}
      {latestSlip && (
        <div className="card p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded" style={{ backgroundColor: 'rgba(249,115,22,0.1)' }}>
                <DollarSign className="w-8 h-8" style={{ color: 'var(--tag-orange)' }} />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--tag-label)' }}>
                  Latest Salary Slip
                </p>
                <h3 className="text-2xl font-light mb-1">
                  {getMonthName(latestSlip.month)} {latestSlip.year}
                </h3>
                <p className="text-xs" style={{ color: 'var(--tag-body)' }}>
                  Uploaded {formatDate(latestSlip.uploaded_at)}
                </p>
              </div>
            </div>
            <Link
              href={`/payroll/${latestSlip.id}`}
              className="btn-primary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View Slip
            </Link>
          </div>
        </div>
      )}

      {/* Salary History */}
      <div className="card p-6">
        <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
          Salary History
        </h3>

        {years.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
            <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
              No salary slips available yet
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {years.map((year) => (
              <div key={year}>
                <h4 className="text-base font-normal mb-3" style={{ color: 'var(--tag-label)' }}>
                  {year}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {slipsByYear[parseInt(year)].map((slip) => (
                    <Link
                      key={slip.id}
                      href={`/payroll/${slip.id}`}
                      className="p-4 rounded border hover:border-orange-300 transition-colors"
                      style={{ borderColor: 'var(--tag-border)' }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" style={{ color: 'var(--tag-orange)' }} />
                          <span className="text-sm font-normal">
                            {getMonthName(slip.month)}
                          </span>
                        </div>
                        {slip.year === currentYear && slip.month === currentMonth && (
                          <span className="badge-success text-[9px]">LATEST</span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--tag-body)' }}>
                        Uploaded {formatDate(slip.uploaded_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
