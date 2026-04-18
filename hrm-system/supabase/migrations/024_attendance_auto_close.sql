-- Add auto-close tracking to attendance_sessions
ALTER TABLE attendance_sessions 
ADD COLUMN auto_closed_at TIMESTAMPTZ NULL,
ADD COLUMN auto_close_reason VARCHAR(255) NULL;

-- Create index for finding auto-closed sessions
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_auto_closed_at 
  ON attendance_sessions(auto_closed_at);

-- Drop and recreate the daily_attendance_summary view to include auto-closed sessions
DROP VIEW IF EXISTS daily_attendance_summary CASCADE;

CREATE VIEW daily_attendance_summary AS
SELECT 
  employee_id,
  DATE(check_in AT TIME ZONE 'UTC') as date,
  COUNT(*) as session_count,
  COUNT(CASE WHEN check_out IS NOT NULL THEN 1 END) as closed_session_count,
  COUNT(CASE WHEN auto_closed_at IS NOT NULL THEN 1 END) as auto_closed_count,
  MIN(check_in) as first_check_in,
  MAX(check_out) as last_check_out,
  SUM(
    CASE 
      WHEN check_out IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (check_out - check_in)) / 3600
      ELSE 0
    END
  ) as completed_hours,
  SUM(
    CASE 
      WHEN auto_closed_at IS NOT NULL AND check_out IS NOT NULL
      THEN EXTRACT(EPOCH FROM (check_out - check_in)) / 3600
      ELSE 0
    END
  ) as auto_closed_hours
FROM attendance_sessions
GROUP BY employee_id, DATE(check_in AT TIME ZONE 'UTC');

COMMENT ON COLUMN attendance_sessions.auto_closed_at IS 'Timestamp when session was auto-closed by system';
COMMENT ON COLUMN attendance_sessions.auto_close_reason IS 'Reason for auto-close (e.g., ''overnight_auto_close_14h_threshold'')';

-- Grant access to the view
GRANT SELECT ON daily_attendance_summary TO authenticated;
