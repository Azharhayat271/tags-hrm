# Payroll System - Connected Components

## What Was Already There ✅
1. **Database Schema** - `salary_slips` table with proper structure
2. **Storage Bucket** - `salary-slips` bucket with RLS policies
3. **Admin Upload Page** - `/admin/payroll-upload/page.tsx`
4. **Employee View Pages** - `/payroll/page.tsx` and `/payroll/[id]/page.tsx`
5. **UI Components**:
   - `PayrollUploadForm.tsx` - Upload form with validation
   - `RecentUploads.tsx` - Shows recent uploads
   - `PDFViewer.tsx` - PDF display with pagination
6. **Dependencies** - `react-pdf` already installed

## What Was Missing ❌
1. **API Route** - No `/api/payroll/upload-slip/route.ts`
2. **Admin Navigation** - Payroll upload link not in admin sidebar

## What Was Connected 🔗

### 1. Created API Route
**File**: `hrm-system/app/api/payroll/upload-slip/route.ts`

Features:
- Validates user authentication and admin role
- Validates file type (PDF only) and size (max 10MB)
- Uploads file to Supabase storage
- Creates/updates database record
- Handles file replacement (deletes old file if exists)
- Proper error handling and cleanup

### 2. Updated Admin Navigation
**File**: `hrm-system/components/layout/Sidebar.tsx`

Added to admin sidebar:
- Leave Approvals link
- Payroll Upload link
- Reports link
- Added missing icons (FileText, CheckSquare, BarChart3)

## Flow Diagram

```
ADMIN UPLOADS PAYROLL
┌─────────────────────────────────────────────────────────┐
│ 1. Admin visits /admin/payroll-upload                  │
│ 2. Selects employee, month, year, and PDF file         │
│ 3. Clicks "Upload Salary Slip"                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ PayrollUploadForm.tsx                                   │
│ - Validates file (PDF, <10MB)                          │
│ - Sends FormData to API                                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ POST /api/payroll/upload-slip                          │
│ - Checks admin authentication                          │
│ - Validates inputs                                     │
│ - Uploads to storage: {employee_id}/{year}/{month}.pdf │
│ - Upserts to salary_slips table                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Supabase Storage (salary-slips bucket)                 │
│ + Database (salary_slips table)                        │
└─────────────────────────────────────────────────────────┘

EMPLOYEE VIEWS PAYROLL
┌─────────────────────────────────────────────────────────┐
│ 1. Employee visits /payroll                            │
│ 2. Sees list of all salary slips grouped by year      │
│ 3. Clicks on a slip to view details                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ /payroll/[id]/page.tsx                                 │
│ - Fetches salary slip from database                   │
│ - Creates signed URL for PDF (1 hour expiry)          │
│ - Renders PDFViewer component                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ PDFViewer.tsx                                          │
│ - Displays PDF with pagination                        │
│ - Download button available                           │
└─────────────────────────────────────────────────────────┘
```

## Security Features

### Row Level Security (RLS)
- **Database**: Employees can only query their own slips
- **Storage**: Employees can only access files in their folder

### Authentication
- Admin role required for upload
- Employee must be logged in to view their slips
- Signed URLs expire after 1 hour

### Validation
- File type: PDF only
- File size: Max 10MB
- Unique constraint: One slip per employee per month/year

## Ready to Use! 🚀

The payroll system is now fully connected and ready to use:

1. **Admin**: Go to `/admin/payroll-upload` to upload salary slips
2. **Employee**: Go to `/payroll` to view and download slips

All pieces are connected and working together!
