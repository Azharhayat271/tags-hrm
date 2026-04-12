import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PublicHolidaysPage() {
  const supabase = await createClient();

  // Get all public holidays
  const { data: holidays } = await supabase
    .from("public_holidays")
    .select("*")
    .order("date");

  const currentYear = new Date().getFullYear();
  const currentHolidays = holidays?.filter(h => 
    new Date(h.date).getFullYear() === currentYear
  ) || [];

  const upcomingHolidays = holidays?.filter(h => 
    new Date(h.date) >= new Date()
  ) || [];

  const pastHolidays = holidays?.filter(h => 
    new Date(h.date) < new Date() &&
    new Date(h.date).getFullYear() === currentYear
  ) || [];

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
          Public Holidays
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--tag-body)" }}>
          View all public holidays for {currentYear}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Holidays */}
        <div className="card p-6">
          <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
            Upcoming Holidays
          </h3>
          
          {upcomingHolidays.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
              <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
                No upcoming holidays
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-start gap-3 p-4 rounded"
                  style={{ backgroundColor: 'rgba(249,115,22,0.08)' }}
                >
                  <Calendar className="w-5 h-5 mt-0.5" style={{ color: 'var(--tag-orange)' }} />
                  <div className="flex-1">
                    <p className="text-base font-normal">{holiday.name}</p>
                    <p className="text-sm tabular-nums" style={{ color: 'var(--tag-body)' }}>
                      {formatDate(holiday.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Holidays */}
        <div className="card p-6">
          <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
            Past Holidays ({currentYear})
          </h3>
          
          {pastHolidays.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
              <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
                No past holidays this year
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-start gap-3 p-4 rounded"
                  style={{ backgroundColor: 'var(--tag-bg-warm)' }}
                >
                  <Calendar className="w-5 h-5 mt-0.5" style={{ color: 'var(--tag-body)' }} />
                  <div className="flex-1">
                    <p className="text-base font-normal" style={{ color: 'var(--tag-body)' }}>
                      {holiday.name}
                    </p>
                    <p className="text-sm tabular-nums" style={{ color: 'var(--tag-body)' }}>
                      {formatDate(holiday.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="card p-6 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: 'var(--tag-label)' }}>
              Total Public Holidays in {currentYear}
            </p>
            <p className="text-3xl font-light tabular-nums mt-1" style={{ color: 'var(--tag-orange)' }}>
              {currentHolidays.length}
            </p>
          </div>
          <Calendar className="w-12 h-12" style={{ color: 'var(--tag-orange)', opacity: 0.2 }} />
        </div>
      </div>
    </div>
  );
}
