"use client";

import { Calendar } from "lucide-react";

interface LeaveType {
  id: string;
  name: string;
  days_per_year: number;
  used: number;
  remaining: number;
}

interface LeaveBalanceProps {
  balances: LeaveType[];
}

export default function LeaveBalance({ balances }: LeaveBalanceProps) {
  if (balances.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
          Leave Balance
        </h3>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--tag-body)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: 'var(--tag-body)' }}>
            No leave types configured
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-light mb-4" style={{ letterSpacing: '-0.22px' }}>
        Leave Balance
      </h3>
      
      <div className="space-y-4">
        {balances.map((balance) => {
          const percentage = (balance.used / balance.days_per_year) * 100;
          
          return (
            <div key={balance.id}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-normal">{balance.name}</p>
                  <p className="text-xs" style={{ color: 'var(--tag-body)' }}>
                    {balance.used} used of {balance.days_per_year} days
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-light tabular-nums" style={{ color: 'var(--tag-orange)' }}>
                    {balance.remaining}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--tag-label)' }}>
                    days left
                  </p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--tag-border)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    background: percentage >= 90 
                      ? 'var(--tag-danger)' 
                      : percentage >= 70 
                      ? 'var(--tag-warning)' 
                      : 'linear-gradient(90deg, var(--tag-orange), var(--tag-amber))',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--tag-border)' }}>
        <p className="text-xs" style={{ color: 'var(--tag-body)' }}>
          Leave balances are calculated for the current year ({new Date().getFullYear()})
        </p>
      </div>
    </div>
  );
}
