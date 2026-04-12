-- Verify Super Admin Setup
-- Run this in Supabase SQL Editor to check the current state

-- Check the profile
SELECT 
  id,
  full_name,
  email,
  role,
  created_at
FROM profiles 
WHERE email = 'superadmin@tags.com';

-- Check if employee record exists
SELECT 
  e.id,
  e.profile_id,
  e.designation,
  e.department,
  e.status,
  p.full_name,
  p.role
FROM employees e
JOIN profiles p ON e.profile_id = p.id
WHERE p.email = 'superadmin@tags.com';

-- If role is not super_admin, fix it:
UPDATE profiles 
SET role = 'super_admin'
WHERE email = 'superadmin@tags.com';

-- Verify the fix
SELECT 
  id,
  full_name,
  email,
  role
FROM profiles 
WHERE email = 'superadmin@tags.com';
