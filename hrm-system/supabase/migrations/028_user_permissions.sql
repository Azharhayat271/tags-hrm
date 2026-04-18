-- User-level admin permission grants
-- Lets an admin/super_admin grant an employee selective access to admin features
-- (e.g. an HR employee can see payroll-upload; a Head of Engineering can see KPI review).

create table if not exists user_permissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  permission_key text not null,
  granted_by uuid references profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One active grant per (user, permission). Revoked rows stay for audit.
create unique index if not exists user_permissions_active_unique
  on user_permissions(user_id, permission_key)
  where revoked_at is null;

create index if not exists user_permissions_user_id_idx
  on user_permissions(user_id)
  where revoked_at is null;

alter table user_permissions enable row level security;

-- Users can view their own active grants (so the client can build the sidebar).
create policy "Users can view own permissions"
  on user_permissions for select
  using (auth.uid() = user_id);

-- Admins & super-admins can view all grants.
create policy "Admins can view all permissions"
  on user_permissions for select
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Admins & super-admins can insert grants.
create policy "Admins can grant permissions"
  on user_permissions for insert
  with check (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Admins & super-admins can update (revoke) grants.
create policy "Admins can update permissions"
  on user_permissions for update
  using (public.user_has_role('admin') or public.user_has_role('super_admin'));

-- Helper: does the current auth user have the given permission?
-- Returns true for super_admin/admin automatically; otherwise checks active grant rows.
create or replace function public.user_has_permission(permission_to_check text)
returns boolean as $$
  select
    public.user_has_role('super_admin')
    or public.user_has_role('admin')
    or exists (
      select 1
      from user_permissions
      where user_id = auth.uid()
        and permission_key = permission_to_check
        and revoked_at is null
    );
$$ language sql stable security definer set search_path = public;
