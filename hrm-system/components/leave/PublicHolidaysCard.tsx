"use client";

import { Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface PublicHoliday {
  id: string;
  name: string;
  date: string;
}

interface PublicHolidaysCardProps {
  holidays: PublicHoliday[];
}

export default function PublicHolidaysCard({ holidays }: PublicHolidaysCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-light" style={{ letterSpacing: '-0.22px' }}>
          Upcoming Holidays
        </h3>
        <Link 
          href="/leave/holidays" 
          className="text-xs hover:underline"
          style={{ color: 'var(--tag-orange)' }}
        >
          View All
        </Link>
      </div>

      {holidays.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
            No upcoming holidays
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="flex items-start gap-3 p-3 rounded"
              style={{ backgroundColor: 'var(--tag-bg-warm)' }}
            >
              <Calendar className="w-4 h-4 mt-0.5" style={{ color: 'var(--tag-orange)' }} />
              <div className="flex-1">
                <p className="text-sm font-normal">{holiday.name}</p>
                <p className="text-xs tabular-nums" style={{ color: 'var(--tag-body)' }}>
                  {formatDate(holiday.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
