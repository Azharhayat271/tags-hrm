-- Drop all existing employee SELECT policies to start fresh
DROP POLICY IF EXISTS "Employees can view their own record" ON employees;
DROP POLICY IF EXISTS "Employees can view manager records" ON employees;
DROP POLICY IF EXISTS "Employees can view own and manager records" ON employees;

-- Create a security definer function to check if an employee can view another employee
-- This breaks the recursion by using a function that runs with elevated privileges
CREATE OR REPLACE FUNCTION can_view_employee(employee_id uuid, viewer_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_employee_id uuid;
  viewer_reports_to uuid;
BEGIN
  -- Get the viewer's employee record
  SELECT id, reports_to INTO viewer_employee_id, viewer_reports_to
  FROM employees
  WHERE profile_id = viewer_profile_id
  LIMIT 1;
  
  -- Allow if viewing own record
  IF employee_id = viewer_employee_id THEN
    RETURN true;
  END IF;
  
  -- Allow if viewing their manager's record
  IF employee_id = viewer_reports_to THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Create a simple policy using the function
CREATE POLICY "Employees can view permitted records"
  ON employees FOR SELECT
  USING (
    can_view_employee(id, auth.uid())
  );

COMMENT ON FUNCTION can_view_employee IS 'Security definer function to check employee view permissions without recursion';
COMMENT ON POLICY "Employees can view permitted records" ON employees IS 'Allows employees to view their own record and their manager''s record using a security definer function';
