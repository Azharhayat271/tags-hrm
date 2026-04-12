-- Allow employees to view their manager's information
-- This policy allows an employee to view the employee record of their manager (reports_to)
CREATE POLICY "Employees can view their manager's record"
  ON employees FOR SELECT
  USING (
    id IN (
      SELECT reports_to 
      FROM employees 
      WHERE profile_id = auth.uid() 
      AND reports_to IS NOT NULL
    )
  );

COMMENT ON POLICY "Employees can view their manager's record" ON employees IS 
  'Allows employees to view basic information about their direct manager for display purposes';
