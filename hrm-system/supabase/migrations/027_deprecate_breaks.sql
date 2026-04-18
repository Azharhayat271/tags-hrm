-- 027_deprecate_breaks.sql
-- Sessions-based attendance now models arbitrary check-in / check-out cycles per day,
-- so the legacy `breaks` table is no longer used. Application-level callers (BreakTracker
-- component, /api/attendance/[id]/break-start, /api/attendance/[id]/break-end/[breakId])
-- have been removed.
--
-- The table is retained for historical records until a DB-level audit; mark it
-- deprecated via a comment so future readers know not to wire it up again.

COMMENT ON TABLE breaks IS
  'DEPRECATED (2026-04): superseded by attendance_sessions. Retained read-only for historical records. Do not re-enable application writes.';
