-- Allow employees to view their manager's profile
-- This policy allows an employee to view the profile of their manager
CREATE POLICY "Employees can view their manager's profile"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT p.id
      FROM profiles p
      INNER JOIN employees e ON e.profile_id = p.id
      WHERE e.id IN (
        SELECT reports_to 
        FROM employees 
        WHERE profile_id = auth.uid() 
        AND reports_to IS NOT NULL
      )
    )
  );

COMMENT ON POLICY "Employees can view their manager's profile" ON profiles IS 
  'Allows employees to view their direct manager''s profile information';
