-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Employees can view their manager's record" ON employees;

-- Create a simpler policy that allows viewing manager records
-- This uses a direct check without recursion
CREATE POLICY "Employees can view manager records"
  ON employees FOR SELECT
  USING (
    -- Allow if this is the user's own record
    profile_id = auth.uid()
    OR
    -- Allow if this employee is someone's manager (someone reports to them)
    EXISTS (
      SELECT 1 
      FROM employees e2 
      WHERE e2.reports_to = employees.id 
      AND e2.profile_id = auth.uid()
    )
  );

COMMENT ON POLICY "Employees can view manager records" ON employees IS 
  'Allows employees to view their own record and their direct manager''s record';
