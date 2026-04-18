-- Update RLS policies to prevent manual entry modification after creation

-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Employees can update their own sessions" ON attendance_sessions;

-- Create new UPDATE policy that prevents updates to manual entries
CREATE POLICY "Employees can update their own sessions (not manual)"
  ON attendance_sessions FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE profile_id = auth.uid()
    )
    AND is_manual_entry = false
  )
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE profile_id = auth.uid()
    )
    AND is_manual_entry = false
  );

-- Drop the DELETE policy if it exists and prevent deletion of manual entries
DROP POLICY IF EXISTS "Employees can delete their own sessions" ON attendance_sessions;

-- Create DELETE policy that prevents deletion of manual entries
-- Note: Only admins can delete sessions; employees cannot delete
CREATE POLICY "Admins can delete sessions"
  ON attendance_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

COMMENT ON POLICY "Employees can update their own sessions (not manual)" ON attendance_sessions 
IS 'Employees can only update non-manual sessions (e.g., auto check-in/check-out)';
