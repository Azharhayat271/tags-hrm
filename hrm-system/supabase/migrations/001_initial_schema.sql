-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create user_role enum (if it doesn't exist)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('super_admin', 'admin', 'employee');
  end if;
end
$$;

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null unique,
  phone text,
  role user_role not null default 'employee',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table profiles enable row level security;

-- Helper function to check user role (avoids RLS recursion)
create or replace function public.user_has_role(role_to_check user_role)
returns boolean as $$
select exists (
  select 1
  from profiles
  where id = auth.uid() and role = role_to_check
);
$$ language sql stable security definer set search_path = public;

-- Profiles policies (simplified to avoid infinite recursion)
-- Policy 1: Users can always view their own profile
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

-- Policy 2: Admins can view all profiles (using helper function)
create policy "Admins can view all profiles"
  on profiles for select
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Policy 3: Super admins can update profiles (using helper function)
create policy "Super admins can update profiles"
  on profiles for update
  using (public.user_has_role('super_admin'));

-- Policy 4: Admins can insert profiles (for creating new employees)
create policy "Admins can insert profiles"
  on profiles for insert
  with check (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Employees table
create table employees (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade unique,
  designation_id uuid references designations(id) on delete set null,
  department_id uuid references departments(id) on delete set null,
  employment_type text,
  joining_date date,
  reports_to uuid references employees(id),
  status text default 'active' check (status in ('active', 'on_leave', 'exited')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on employees
alter table employees enable row level security;

-- Employees policies (using helper function to avoid recursion)
create policy "Employees can view their own record"
  on employees for select
  using (profile_id = auth.uid());

create policy "Admins can view all employees"
  on employees for select
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

create policy "Admins can insert employees"
  on employees for insert
  with check (public.user_has_role('admin') or public.user_has_role('super_admin'));

create policy "Admins can update employees"
  on employees for update
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Attendance table
create table attendance (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade not null,
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(employee_id, date)
);

-- Enable RLS on attendance
alter table attendance enable row level security;

-- Attendance policies
create policy "Employees can view their own attendance"
  on attendance for select
  using (
    employee_id in (
      select id from employees where profile_id = auth.uid()
    )
  );

create policy "Employees can insert their own attendance"
  on attendance for insert
  with check (
    employee_id in (
      select id from employees where profile_id = auth.uid()
    )
  );

create policy "Employees can update their own attendance"
  on attendance for update
  using (
    employee_id in (
      select id from employees where profile_id = auth.uid()
    )
  );

create policy "Admins can view all attendance"
  on attendance for select
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Breaks table
create table breaks (
  id uuid primary key default uuid_generate_v4(),
  attendance_id uuid references attendance(id) on delete cascade not null,
  break_start timestamptz not null,
  break_end timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS on breaks
alter table breaks enable row level security;

-- Breaks policies
create policy "Employees can manage their own breaks"
  on breaks for all
  using (
    attendance_id in (
      select a.id from attendance a
      join employees e on a.employee_id = e.id
      where e.profile_id = auth.uid()
    )
  );

create policy "Admins can view all breaks"
  on breaks for select
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Leave types table
create table leave_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  days_per_year int not null,
  carry_forward_limit int default 0,
  created_at timestamptz default now()
);

-- Enable RLS on leave_types
alter table leave_types enable row level security;

-- Leave types policies
create policy "Everyone can view leave types"
  on leave_types for select
  to authenticated
  using (true);

create policy "Super admins can manage leave types"
  on leave_types for all
  using (public.user_has_role('super_admin'));

-- Designations table (job titles)
create table designations (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on designations
alter table designations enable row level security;

-- Designations policies
create policy "Everyone can view designations"
  on designations for select
  to authenticated
  using (true);

create policy "Super admins can manage designations"
  on designations for all
  using (public.user_has_role('super_admin'));

-- Departments table
create table departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on departments
alter table departments enable row level security;

-- Departments policies
create policy "Everyone can view departments"
  on departments for select
  to authenticated
  using (true);

create policy "Super admins can manage departments"
  on departments for all
  using (public.user_has_role('super_admin'));

-- Leave requests table
create table leave_requests (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade not null,
  leave_type_id uuid references leave_types(id) not null,
  start_date date not null,
  end_date date not null,
  days int not null,
  reason text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid references profiles(id),
  review_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on leave_requests
alter table leave_requests enable row level security;

-- Leave requests policies
create policy "Employees can view their own leave requests"
  on leave_requests for select
  using (
    employee_id in (
      select id from employees where profile_id = auth.uid()
    )
  );

create policy "Employees can create their own leave requests"
  on leave_requests for insert
  with check (
    employee_id in (
      select id from employees where profile_id = auth.uid()
    )
  );

create policy "Admins can view all leave requests"
  on leave_requests for select
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

create policy "Admins can update leave requests"
  on leave_requests for update
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Public holidays table
create table public_holidays (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  date date not null unique,
  created_at timestamptz default now()
);

-- Enable RLS on public_holidays
alter table public_holidays enable row level security;

-- Public holidays policies
create policy "Everyone can view public holidays"
  on public_holidays for select
  to authenticated
  using (true);

create policy "Super admins can manage public holidays"
  on public_holidays for all
  using (public.user_has_role('super_admin'));

-- Salary slips table
create table salary_slips (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade not null,
  month int not null check (month >= 1 and month <= 12),
  year int not null,
  file_path text not null,
  uploaded_by uuid references profiles(id) not null,
  uploaded_at timestamptz default now(),
  unique(employee_id, month, year)
);

-- Enable RLS on salary_slips
alter table salary_slips enable row level security;

-- Salary slips policies
create policy "Employees can view their own salary slips"
  on salary_slips for select
  using (
    employee_id in (
      select id from employees where profile_id = auth.uid()
    )
  );

create policy "Admins can view all salary slips"
  on salary_slips for select
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

create policy "Admins can insert salary slips"
  on salary_slips for insert
  with check (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Lifecycle events table
create table lifecycle_events (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade not null,
  event_type text not null,
  event_date date not null,
  description text,
  metadata jsonb,
  added_by uuid references profiles(id) not null,
  created_at timestamptz default now()
);

-- Enable RLS on lifecycle_events
alter table lifecycle_events enable row level security;

-- Lifecycle events policies
create policy "Employees can view their own lifecycle events"
  on lifecycle_events for select
  using (
    employee_id in (
      select id from employees where profile_id = auth.uid()
    )
  );

create policy "Admins can view all lifecycle events"
  on lifecycle_events for select
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

create policy "Admins can insert lifecycle events"
  on lifecycle_events for insert
  with check (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- KPIs table
create table kpis (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade not null,
  cycle text not null,
  title text not null,
  description text,
  target numeric,
  unit text,
  weight numeric default 1,
  progress numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on kpis
alter table kpis enable row level security;

-- KPIs policies
create policy "Employees can view their own KPIs"
  on kpis for select
  using (
    employee_id in (
      select id from employees where profile_id = auth.uid()
    )
  );

create policy "Admins can manage all KPIs"
  on kpis for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );

-- Performance reviews table
create table performance_reviews (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade not null,
  cycle text not null,
  overall_rating text,
  overall_score numeric,
  manager_notes text,
  employee_notes text,
  acknowledged_at timestamptz,
  reviewed_by uuid references profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on performance_reviews
alter table performance_reviews enable row level security;

-- Performance reviews policies
create policy "Employees can view their own reviews"
  on performance_reviews for select
  using (
    employee_id in (
      select id from employees where profile_id = auth.uid()
    )
  );

create policy "Employees can update their own review notes"
  on performance_reviews for update
  using (
    employee_id in (
      select id from employees where profile_id = auth.uid()
    )
  )
  with check (
    employee_id in (
      select id from employees where profile_id = auth.uid()
    )
  );

create policy "Admins can manage all reviews"
  on performance_reviews for all
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger update_profiles_updated_at before update on profiles
  for each row execute function update_updated_at_column();

create trigger update_employees_updated_at before update on employees
  for each row execute function update_updated_at_column();

create trigger update_attendance_updated_at before update on attendance
  for each row execute function update_updated_at_column();

create trigger update_leave_requests_updated_at before update on leave_requests
  for each row execute function update_updated_at_column();

create trigger update_kpis_updated_at before update on kpis
  for each row execute function update_updated_at_column();

create trigger update_designations_updated_at before update on designations
  for each row execute function update_updated_at_column();

create trigger update_departments_updated_at before update on departments
  for each row execute function update_updated_at_column();

create trigger update_performance_reviews_updated_at before update on performance_reviews
  for each row execute function update_updated_at_column();
