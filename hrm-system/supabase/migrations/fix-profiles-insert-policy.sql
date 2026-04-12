-- Add missing INSERT RLS policy for profiles table
-- This allows admins and super_admins to create new employee profiles

drop policy if exists "Admins can insert profiles" on profiles;

create policy "Admins can insert profiles"
  on profiles for insert
  with check (public.user_has_role('admin') or public.user_has_role('super_admin'));

select 'INSERT policy added to profiles table successfully!' as status;
