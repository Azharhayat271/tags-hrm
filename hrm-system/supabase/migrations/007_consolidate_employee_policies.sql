-- Drop the old separate policies
DROP POLICY IF EXISTS "Employees can view their own record" ON employees;
DROP POLICY IF EXISTS "Employees can view manager records" ON employees;

-- Create a single consolidated policy for employee SELECT
CREATE POLICY "Employees can view own and manager records"
  ON employees FOR SELECT
  USING (
    -- Allow if this is the user's own record
    profile_id = auth.uid()
    OR
    -- Allow if this employee is the manager of the current user
    id IN (
      SELECT e.reports_to 
      FROM employees e 
      WHERE e.profile_id = auth.uid() 
      AND e.reports_to IS NOT NULL
    )
  );

COMMENT ON POLICY "Employees can view own and manager records" ON employees IS 
  'Allows employees to view their own employee record and their direct manager''s employee record';
