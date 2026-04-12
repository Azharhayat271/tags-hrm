# Payroll System - Complete Setup Guide

## Current Status

✅ **Storage Bucket Created**: The `salary-slips` bucket has been created in Supabase
⚠️ **RLS Policies Needed**: Storage policies need to be applied via SQL Editor

## Quick Setup (2 Steps)

### Step 1: Apply Storage Policies

1. Open your Supabase SQL Editor:
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

2. Copy and paste this SQL:

```sql
-- Storage RLS Policies for salary-slips bucket

-- Enable RLS on storage.objects (if not already enabled)
alter table storage.objects enable row level security;

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "Employees can view their own salary slips" on storage.objects;
drop policy if exists "Admins can upload salary slips" on storage.objects;
drop policy if exists "Admins can update salary slips" on storage.objects;
drop policy if exists "Admins can view all salary slips" on storage.objects;
drop policy if exists "Admins can delete salary slips" on storage.objects;

-- Policy: Employees can view their own salary slips
create policy "Employees can view their own salary slips"
on storage.objects for select
using (
  bucket_id = 'salary-slips' and
  (storage.foldername(name))[1] in (
    select e.id::text
    from employees e
    where e.profile_id = auth.uid()
  )
);

-- Policy: Admins can upload salary slips
create policy "Admins can upload salary slips"
on storage.objects for insert
with check (
  bucket_id = 'salary-slips' and
  exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('admin', 'super_admin')
  )
);

-- Policy: Admins can update salary slips
create policy "Admins can update salary slips"
on storage.objects for update
using (
  bucket_id = 'salary-slips' and
  exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('admin', 'super_admin')
  )
);

-- Policy: Admins can delete salary slips
create policy "Admins can delete salary slips"
on storage.objects for delete
using (
  bucket_id = 'salary-slips' and
  exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('admin', 'super_admin')
  )
);

-- Policy: Admins can view all salary slips
create policy "Admins can view all salary slips"
on storage.objects for select
using (
  bucket_id = 'salary-slips' and
  exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('admin', 'super_admin')
  )
);
```

3. Click "Run" or press Ctrl+Enter

4. You should see: "Success. No rows returned"

### Step 2: Test the Upload

1. Go to your app: http://localhost:3000/admin/payroll-upload
2. Select an employee
3. Choose month and year
4. Upload a PDF file
5. Click "Upload Salary Slip"

## What Was Done

### 1. Storage Bucket ✅
- Created `salary-slips` bucket
- Set to private (not publicly accessible)
- Max file size: 10MB
- Allowed MIME types: PDF only

### 2. Code Implementation ✅
- API route: `/api/payroll/upload-slip`
- Admin page: `/admin/payroll-upload`
- Employee pages: `/payroll` and `/payroll/[id]`
- Components: Upload form, PDF viewer, recent uploads
- Fixed `useApiCall` hook to handle FormData

### 3. Database Schema ✅
- `salary_slips` table already exists
- RLS policies for database already applied

### 4. Navigation ✅
- Admin sidebar includes "Payroll Upload"
- Employee sidebar includes "Payroll"

## Troubleshooting

### If upload still fails:

1. **Check bucket exists**:
   ```sql
   select * from storage.buckets where id = 'salary-slips';
   ```
   Should return one row.

2. **Check policies exist**:
   ```sql
   select * from pg_policies where tablename = 'objects' and policyname like '%salary%';
   ```
   Should return 5 policies.

3. **Check your role**:
   ```sql
   select role from profiles where id = auth.uid();
   ```
   Should return 'admin' or 'super_admin'.

4. **Check browser console** for detailed error messages.

## File Structure

```
hrm-system/
├── app/
│   ├── admin/
│   │   └── payroll-upload/
│   │       └── page.tsx              # Admin upload page
│   ├── (dashboard)/
│   │   └── payroll/
│   │       ├── page.tsx              # Employee list page
│   │       └── [id]/
│   │           └── page.tsx          # Employee view page
│   └── api/
│       └── payroll/
│           └── upload-slip/
│               └── route.ts          # Upload API endpoint
├── components/
│   └── payroll/
│       ├── PayrollUploadForm.tsx     # Upload form
│       ├── PDFViewer.tsx             # PDF viewer
│       └── RecentUploads.tsx         # Recent uploads list
├── supabase/
│   └── migrations/
│       ├── 002_storage_setup.sql     # Original migration
│       └── 002b_storage_policies.sql # Policies only
└── scripts/
    ├── setup-payroll-storage.mjs     # Create bucket
    └── apply-storage-policies.mjs    # Show policies SQL
```

## Security Features

- **Row Level Security**: Employees can only see their own slips
- **Role-based Access**: Only admins can upload
- **File Validation**: PDF only, max 10MB
- **Signed URLs**: 1-hour expiry for viewing
- **Private Storage**: Files not publicly accessible

## Ready to Use! 🚀

Once you've run the SQL in Step 1, the payroll system is fully functional!
