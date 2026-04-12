-- Fix infinite recursion in RLS policies
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/[YOUR_PROJECT]/sql/new
-- This script drops the problematic policies and recreates them with a helper function

-- Step 1: Drop all problematic policies
drop policy if exists "Admins can view all profiles" on profiles;
drop policy if exists "Super admins can update profiles" on profiles;
drop policy if exists "Admins can view all employees" on employees;
drop policy if exists "Admins can insert employees" on employees;
drop policy if exists "Admins can update employees" on employees;
drop policy if exists "Admins can view all attendance" on attendance;
drop policy if exists "Admins can view all breaks" on breaks;
drop policy if exists "Super admins can manage leave types" on leave_types;
drop policy if exists "Admins can view all leave requests" on leave_requests;
drop policy if exists "Admins can update leave requests" on leave_requests;
drop policy if exists "Super admins can manage public holidays" on public_holidays;
drop policy if exists "Admins can view all salary slips" on salary_slips;
drop policy if exists "Admins can insert salary slips" on salary_slips;
drop policy if exists "Admins can view all lifecycle events" on lifecycle_events;
drop policy if exists "Admins can insert lifecycle events" on lifecycle_events;
drop policy if exists "Admins can manage all reviews" on performance_reviews;

-- Step 2: Create helper function (if it doesn't exist)
create or replace function public.user_has_role(role_to_check text)
returns boolean as $$
select exists (
  select 1
  from public.profiles
  where id = auth.uid() and role::text = role_to_check
);
$$ language sql stable security definer set search_path = public;

-- Step 3: Recreate all policies with the helper function

-- Profiles policies
create policy "Admins can view all profiles"
  on profiles for select
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

create policy "Super admins can update profiles"
  on profiles for update
  using (public.user_has_role('super_admin'));

-- Employees policies
create policy "Admins can view all employees"
  on employees for select
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

create policy "Admins can insert employees"
  on employees for insert
  with check (public.user_has_role('admin') or public.user_has_role('super_admin'));

create policy "Admins can update employees"
  on employees for update
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Attendance policies
create policy "Admins can view all attendance"
  on attendance for select
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Breaks policies
create policy "Admins can view all breaks"
  on breaks for select
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Leave types policies
create policy "Super admins can manage leave types"
  on leave_types for all
  using (public.user_has_role('super_admin'));

-- Leave requests policies
create policy "Admins can view all leave requests"
  on leave_requests for select
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

create policy "Admins can update leave requests"
  on leave_requests for update
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Public holidays policies
create policy "Super admins can manage public holidays"
  on public_holidays for all
  using (public.user_has_role('super_admin'));

-- Salary slips policies
create policy "Admins can view all salary slips"
  on salary_slips for select
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

create policy "Admins can insert salary slips"
  on salary_slips for insert
  with check (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Lifecycle events policies
create policy "Admins can view all lifecycle events"
  on lifecycle_events for select
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

create policy "Admins can insert lifecycle events"
  on lifecycle_events for insert
  with check (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Performance reviews policies
create policy "Admins can manage all reviews"
  on performance_reviews for all
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Done!
select 'RLS policies fixed successfully! Run this in Supabase SQL Editor.' as status;
