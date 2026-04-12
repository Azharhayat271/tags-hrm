-- Complete Super Admin Employee Setup
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  admin_profile_id uuid;
BEGIN
  -- Get the super admin profile ID
  SELECT id INTO admin_profile_id 
  FROM profiles 
  WHERE email = 'superadmin@tags.com';
  
  -- Update profile with full information
  UPDATE profiles 
  SET 
    full_name = 'Super Admin',
    phone = '+1 234 567 8900',
    updated_at = NOW()
  WHERE id = admin_profile_id;
  
  -- Create or update employee record with complete information
  INSERT INTO employees (
    profile_id,
    designation,
    department,
    employment_type,
    joining_date,
    reports_to,
    status,
    created_at,
    updated_at
  ) VALUES (
    admin_profile_id,
    'Chief Executive Officer',
    'Management',
    'Full-time',
    '2025-01-01',
    NULL, -- CEO doesn't report to anyone
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (profile_id) 
  DO UPDATE SET
    designation = 'Chief Executive Officer',
    department = 'Management',
    employment_type = 'Full-time',
    joining_date = '2025-01-01',
    status = 'active',
    updated_at = NOW();
  
  RAISE NOTICE 'Super admin employee record created/updated successfully!';
END $$;

-- Verify the setup
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.role,
  e.designation,
  e.department,
  e.employment_type,
  e.joining_date,
  e.status
FROM profiles p
LEFT JOIN employees e ON e.profile_id = p.id
WHERE p.email = 'superadmin@tags.com';
