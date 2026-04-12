-- Create designations table for job titles
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

-- Create departments table
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

-- Add triggers for updated_at
create trigger update_designations_updated_at before update on designations
  for each row execute function update_updated_at_column();

create trigger update_departments_updated_at before update on departments
  for each row execute function update_updated_at_column();

-- Insert default designations and departments
insert into designations (name, description) values
  ('Software Engineer', 'Full-stack software development'),
  ('Product Manager', 'Product management and strategy'),
  ('Designer', 'UI/UX design'),
  ('Sales Executive', 'Sales and business development'),
  ('HR Manager', 'Human resources management'),
  ('Finance Manager', 'Financial planning and management')
on conflict do nothing;

insert into departments (name, description) values
  ('Engineering', 'Software development and infrastructure'),
  ('Product', 'Product management and strategy'),
  ('Design', 'User experience and design'),
  ('Sales', 'Sales and business development'),
  ('HR', 'Human resources'),
  ('Finance', 'Finance and accounting')
on conflict do nothing;

select 'Designations and Departments tables created successfully!' as status;
