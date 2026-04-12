# HRM System Setup Guide

## Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works)

## Step-by-Step Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: HRM System (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your location
4. Click "Create new project"
5. Wait ~2 minutes for provisioning

### 2. Get Your API Credentials

1. In your Supabase dashboard, go to **Project Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string under "Project API keys"
   - **service_role key**: Long string under "Project API keys" (⚠️ Keep secret!)

### 3. Configure Environment Variables

1. Open `hrm-system/.env` file
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `hrm-system/supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

If you have Supabase CLI installed, you can also run:
```bash
cd hrm-system
supabase db push
```

### 5. Set Up Storage Bucket (for Payroll PDFs)

1. In your Supabase dashboard, go to **Storage**
2. Click "New bucket"
3. Name it: `payroll-slips`
4. Make it **Private** (not public)
5. Click "Create bucket"

Or run this SQL in the SQL Editor:
```sql
-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('payroll-slips', 'payroll-slips', false);

-- Set up RLS policies for storage
create policy "Employees can view own payroll slips"
on storage.objects for select
using (
  bucket_id = 'payroll-slips' 
  and (storage.foldername(name))[1] in (
    select id::text from employees where profile_id = auth.uid()
  )
);

create policy "Admins can upload payroll slips"
on storage.objects for insert
with check (
  bucket_id = 'payroll-slips'
  and exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('admin', 'super_admin')
  )
);

create policy "Admins can view all payroll slips"
on storage.objects for select
using (
  bucket_id = 'payroll-slips'
  and exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('admin', 'super_admin')
  )
);
```

### 6. Install Dependencies

```bash
cd hrm-system
npm install
# or
pnpm install
```

### 7. Start Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### 8. Create Your First Super Admin

1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Click "Sign up" (or create account)
3. Enter your email and password
4. After signing up, go to your Supabase dashboard
5. Go to **Authentication** → **Users**
6. Find your user and copy the **User UID**
7. Go to **SQL Editor** and run:

```sql
UPDATE profiles 
SET role = 'super_admin' 
WHERE id = 'paste-your-user-uid-here';
```

8. Log out and log back in
9. You should now see all admin and super admin features!

### 9. Create Additional Users

Now you can create admin and employee accounts from within the app:
- **Super Admin** → **Admins** → "Add Admin"
- **Admin** → **Employees** → "Add Employee"

## Verification Checklist

✅ Supabase project created  
✅ Environment variables configured  
✅ Database migrations run successfully  
✅ Storage bucket created  
✅ Dependencies installed  
✅ Development server running  
✅ Super admin account created  
✅ Can log in and see dashboard  

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env` file has the correct keys
- Make sure there are no extra spaces or quotes
- Restart the dev server after changing `.env`

### "relation does not exist" error
- Database migrations haven't been run
- Go to SQL Editor and run the migration file

### Can't upload payroll PDFs
- Storage bucket not created
- Run the storage setup SQL from step 5

### Not seeing admin features after setting role
- Log out and log back in
- Clear browser cache
- Check the profiles table to confirm role is set

## Next Steps

1. Configure leave types: **Super Admin** → **Settings** → **Leave Types**
2. Add public holidays: **Super Admin** → **Settings** → **Public Holidays**
3. Create admin accounts: **Super Admin** → **Admins**
4. Add employees: **Admin** → **Employees** → "Add Employee"
5. Start using the system!

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs in the dashboard
3. Verify all environment variables are set correctly
4. Ensure database migrations completed successfully
