-- Drop the problematic policy
DROP POLICY IF EXISTS "Employees can view their manager's profile" ON profiles;

-- Create a security definer function to check if a user can view a profile
CREATE OR REPLACE FUNCTION can_view_profile(profile_id uuid, viewer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_reports_to uuid;
  manager_profile_id uuid;
BEGIN
  -- Allow viewing own profile
  IF profile_id = viewer_id THEN
    RETURN true;
  END IF;
  
  -- Check if the profile belongs to the viewer's manager
  SELECT e.reports_to INTO viewer_reports_to
  FROM employees e
  WHERE e.profile_id = viewer_id
  LIMIT 1;
  
  IF viewer_reports_to IS NOT NULL THEN
    SELECT e.profile_id INTO manager_profile_id
    FROM employees e
    WHERE e.id = viewer_reports_to
    LIMIT 1;
    
    IF profile_id = manager_profile_id THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;

-- Create a new policy using the security definer function
CREATE POLICY "Users can view permitted profiles"
  ON profiles FOR SELECT
  USING (
    can_view_profile(id, auth.uid())
  );

COMMENT ON FUNCTION can_view_profile IS 'Security definer function to check profile view permissions without recursion';
COMMENT ON POLICY "Users can view permitted profiles" ON profiles IS 'Allows users to view their own profile and their manager''s profile';
