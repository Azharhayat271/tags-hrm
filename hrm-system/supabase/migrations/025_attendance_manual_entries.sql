-- Add manual entry tracking to attendance_sessions
ALTER TABLE attendance_sessions 
ADD COLUMN is_manual_entry BOOLEAN DEFAULT false,
ADD COLUMN manual_added_by UUID REFERENCES employees(id) ON DELETE SET NULL,
ADD COLUMN manual_added_at TIMESTAMPTZ NULL;

-- Create index for finding manual entries
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_is_manual_entry 
  ON attendance_sessions(is_manual_entry);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_manual_added_by 
  ON attendance_sessions(manual_added_by);

-- Update the daily_attendance_summary view to segregate manual from automatic entries
DROP VIEW IF EXISTS daily_attendance_summary CASCADE;

CREATE VIEW daily_attendance_summary AS
SELECT 
  employee_id,
  DATE(check_in AT TIME ZONE 'UTC') as date,
  COUNT(*) as session_count,
  COUNT(CASE WHEN check_out IS NOT NULL THEN 1 END) as closed_session_count,
  COUNT(CASE WHEN auto_closed_at IS NOT NULL THEN 1 END) as auto_closed_count,
  COUNT(CASE WHEN is_manual_entry = true THEN 1 END) as manual_entry_count,
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
  ) as auto_closed_hours,
  SUM(
    CASE 
      WHEN is_manual_entry = true AND check_out IS NOT NULL
      THEN EXTRACT(EPOCH FROM (check_out - check_in)) / 3600
      ELSE 0
    END
  ) as manual_hours
FROM attendance_sessions
GROUP BY employee_id, DATE(check_in AT TIME ZONE 'UTC');

COMMENT ON COLUMN attendance_sessions.is_manual_entry IS 'True if entry was manually added by employee, False if auto check-in/check-out';
COMMENT ON COLUMN attendance_sessions.manual_added_by IS 'Employee who manually added this entry (self if employee added their own)';
COMMENT ON COLUMN attendance_sessions.manual_added_at IS 'Timestamp when manual entry was created';

-- Grant access to the view
GRANT SELECT ON daily_attendance_summary TO authenticated;
