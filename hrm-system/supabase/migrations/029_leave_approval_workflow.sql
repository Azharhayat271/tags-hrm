-- Two-step leave approval workflow: Employee -> Manager -> HR.
-- Introduces pending_manager / pending_hr statuses, manager review columns,
-- and a SELECT policy so managers can see leave requests from their direct reports.
--
-- Status lifecycle:
--   pending_manager -> pending_hr -> approved
--                  \-> rejected (at any pending stage)
--                  \-> cancelled (by employee, only while pending)
-- "pending" is kept for legacy rows and acts like pending_hr at approve time.

alter table leave_requests
  drop constraint if exists leave_requests_status_check;

alter table leave_requests
  add constraint leave_requests_status_check
  check (status in ('pending', 'pending_manager', 'pending_hr', 'approved', 'rejected', 'cancelled'));

alter table leave_requests
  add column if not exists manager_reviewed_by uuid references profiles(id),
  add column if not exists manager_reviewed_at timestamptz,
  add column if not exists manager_review_note text;

-- Managers can view leave requests from employees who report to them.
drop policy if exists "Managers can view direct reports leave requests" on leave_requests;
create policy "Managers can view direct reports leave requests"
  on leave_requests for select
  using (
    employee_id in (
      select e.id from employees e
      where e.reports_to in (
        select id from employees where profile_id = auth.uid()
      )
    )
  );

-- Unpaid-leave convention: days_per_year = 0 signals unlimited quota.
-- The existing CHECK (implicit via positive-only) doesn't block 0 at the DB level,
-- but the API route needs to allow it too — handled in /api/settings/leave-types.
