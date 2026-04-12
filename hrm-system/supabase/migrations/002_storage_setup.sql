-- Create storage bucket for salary slips
insert into storage.buckets (id, name, public)
values ('salary-slips', 'salary-slips', false);

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Policy: Employees can view their own salary slips
create policy "Employees can view their own salary slips"
on storage.objects for select
using (
  bucket_id = 'salary-slips' and
  (storage.foldername(name))[1] in (
    select e.id::text
    from employees e
    where e.profile_id = auth.uid()
  )
);

-- Policy: Admins can upload salary slips
create policy "Admins can upload salary slips"
on storage.objects for insert
with check (
  bucket_id = 'salary-slips' and
  exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('admin', 'super_admin')
  )
);

-- Policy: Admins can update salary slips
create policy "Admins can update salary slips"
on storage.objects for update
using (
  bucket_id = 'salary-slips' and
  exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('admin', 'super_admin')
  )
);

-- Policy: Admins can view all salary slips
create policy "Admins can view all salary slips"
on storage.objects for select
using (
  bucket_id = 'salary-slips' and
  exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('admin', 'super_admin')
  )
);
