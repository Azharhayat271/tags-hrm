# Attendance Auto-Close Policy (Phase 3)

## Overview

The attendance auto-close policy automatically closes forgotten check-in sessions that remain open for too long. This prevents data loss when employees forget to check out or experience connectivity issues.

## Configuration

- **Default Max Session Duration**: 14 hours
- **Auto-Close Trigger**: Sessions older than configured threshold
- **Audit Trail**: All auto-closed sessions are logged with reason and timestamp

## How It Works

1. **Detection**: System identifies open sessions (check_out IS NULL) older than the cutoff time
2. **Closure**: Sets check_out time to check_in + max_session_hours
3. **Marking**: Flags session with auto_closed_at timestamp and reason
4. **Audit**: Logs the action in audit_logs table for compliance tracking

## API Endpoint

### POST /api/attendance/sessions/auto-close

Auto-closes stale open attendance sessions. Typically called by a scheduled job.

**Authentication:** Requires `Authorization: Bearer <JWT>` for an `admin` or `super_admin` user.

**Query Parameters:**
- `max_session_hours` (optional, default: 14) - Maximum hours a session stays open
- `threshold_date` (optional, default: yesterday EOD) - ISO date for sessions to close

**Responses:**
```json
{
  "closed": 5,
  "total_stale": 5,
  "sessions": [
    {
      "id": "uuid",
      "employee_id": "uuid",
      "check_in": "2024-04-16T09:00:00Z",
      "check_out": "2024-04-16T23:00:00Z",
      "duration_hours": 14
    }
  ],
  "timestamp": "2024-04-17T02:00:00Z"
}
```

### GET /api/attendance/sessions/auto-close

Check for pending auto-close candidates (for monitoring).

**Authentication:** Requires `Authorization: Bearer <JWT>` for an `admin` or `super_admin` user.

**Query Parameters:**
- `max_session_hours` (optional, default: 14)

**Responses:**
```json
{
  "pending_count": 3,
  "max_session_hours": 14,
  "oldest_session_hours": 22,
  "candidates": [...]
}
```

## Setup Instructions

### Option 1: Vercel Cron (Recommended for Deployment)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/attendance-auto-close",
    "schedule": "0 2 * * *"
  }]
}
```

Create `/app/api/cron/attendance-auto-close/route.ts`:
```typescript
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // Verify Vercel CRON secret
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/attendance/sessions/auto-close`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.AUTO_CLOSE_ADMIN_JWT}`,
    },
  });

  return response;
}
```

### Option 2: External Scheduler (e.g., node-cron)

Run daily at 2 AM server time:
```bash
curl -X POST "https://your-app.com/api/attendance/sessions/auto-close?max_session_hours=14" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
```

### Option 3: Database Trigger (Advanced)

PostgreSQL function to auto-close at specific times:
```sql
CREATE OR REPLACE FUNCTION auto_close_attendance_sessions()
RETURNS void AS $$
BEGIN
  UPDATE attendance_sessions
  SET 
    check_out = check_in + INTERVAL '14 hours',
    auto_closed_at = NOW(),
    auto_close_reason = 'overnight_auto_close_14h_threshold'
  WHERE 
    check_out IS NULL
    AND check_in < NOW() - INTERVAL '14 hours'
    AND auto_closed_at IS NULL;
    
  RAISE NOTICE 'Auto-closed % sessions', FOUND;
END;
$$ LANGUAGE plpgsql;

-- Schedule via pg_cron extension (if available)
SELECT cron.schedule('auto-close-attendance', '0 2 * * *', 'SELECT auto_close_attendance_sessions()');
```

## Admin Visibility

### In Matrix View
- Shows badge: "⚙️ X auto-closed" for each employee
- Updated summary stat shows total auto-closed sessions for period
- Color-coded cell indicator (gray) for days with auto-closed sessions

### In Employee Detail Page
- ⚙️ Auto-Closed badge on affected sessions
- Tooltip shows reason: "overnight_auto_close_14h_threshold"
- Auto-closed count in summary cards

### In Audit Log
- Operation: "updated"
- Table: "attendance_sessions"
- Old values: { check_out: null, auto_closed_at: null }
- New values: { check_out: "...", auto_closed_at: "...", auto_close_reason: "..." }

## Monitoring

### Check Pending Auto-Closes
```bash
curl https://your-app.com/api/attendance/sessions/auto-close?max_session_hours=14
```

### Alert Thresholds
- ⚠️ Alert if pending_count > 10
- 🔴 Alert if oldest_session_hours > 20
- Monitor auto-close logs in audit_logs table

## Edge Cases

### Multi-Timezone Support
- All times stored in UTC in database
- Client display uses local timezone
- Auto-close threshold is UTC-based

### Session Spanning Midnight
- System closes session at check_in + 14 hours
- Recorded as single session spanning 2 calendar days
- Daily summary view handles correctly

### Manually Reopening Sessions
- Admins can manually set check_out to NULL to reopen
- Automatically updates auto_closed_at → NULL
- Creates new audit entry

## Database Schema

New columns in `attendance_sessions`:
- `auto_closed_at` TIMESTAMPTZ NULL - When session was auto-closed
- `auto_close_reason` VARCHAR(255) NULL - Reason code for audit trail

Updated view `daily_attendance_summary`:
- `auto_closed_count` - Count of auto-closed sessions per day
- `auto_closed_hours` - Sum of hours from auto-closed sessions

## Performance

- Index on `auto_closed_at` prevents slow queries
- Batch updates use PostgreSQL transaction for atomicity
- Audit logging is async-safe and logged separately
