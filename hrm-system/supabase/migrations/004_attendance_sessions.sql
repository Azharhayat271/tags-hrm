-- Create attendance_sessions table for multiple check-ins per day
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_employee_id ON attendance_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_check_in ON attendance_sessions(check_in);

-- Enable RLS
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for attendance_sessions
CREATE POLICY "Employees can view their own sessions"
  ON attendance_sessions FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Employees can insert their own sessions"
  ON attendance_sessions FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Employees can update their own sessions"
  ON attendance_sessions FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all sessions"
  ON attendance_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_attendance_sessions_updated_at 
  BEFORE UPDATE ON attendance_sessions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for daily attendance summary
CREATE OR REPLACE VIEW daily_attendance_summary AS
SELECT 
  employee_id,
  DATE(check_in AT TIME ZONE 'UTC') as date,
  COUNT(*) as session_count,
  MIN(check_in) as first_check_in,
  MAX(check_out) as last_check_out,
  SUM(
    CASE 
      WHEN check_out IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (check_out - check_in)) / 3600
      ELSE 0
    END
  ) as total_hours
FROM attendance_sessions
GROUP BY employee_id, DATE(check_in AT TIME ZONE 'UTC');

-- Grant access to the view
GRANT SELECT ON daily_attendance_summary TO authenticated;

COMMENT ON TABLE attendance_sessions IS 'Stores individual check-in/check-out sessions, allowing multiple sessions per day';
COMMENT ON VIEW daily_attendance_summary IS 'Aggregates sessions into daily summaries with total hours';
