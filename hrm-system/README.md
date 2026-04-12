# TAG Solutions HRM System

A full-featured Human Resource Management System built with Next.js 14+ and Supabase.

## Phase 0: Project Setup - COMPLETED ✅

The foundation is ready with:
- Next.js 14+ with App Router and TypeScript
- Tailwind CSS configured with TAG Solutions design system
- Supabase client setup (browser, server, middleware)
- Complete database schema with RLS policies
- Authentication system (login/signup)
- Dashboard layout with sidebar navigation
- Role-based access control structure

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)
- npm or pnpm

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Database Migrations

In your Supabase project dashboard:
1. Go to SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Run the migration

Or if you have Supabase CLI installed:

```bash
supabase db push
```

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 5. Create Your First Super Admin

After running the app:
1. Sign up with your email at `/login`
2. Go to your Supabase dashboard → Authentication → Users
3. Copy your user ID
4. Go to SQL Editor and run:

```sql
UPDATE profiles 
SET role = 'super_admin' 
WHERE id = 'your-user-id-here';
```

All subsequent admin accounts can be created from within the app.

## Design System

This project uses the TAG Solutions design system based on Stripe's design language. Key features:

- **Font**: sohne-var with OpenType "ss01" feature
- **Primary Color**: TAG Orange (#f97316)
- **Typography**: Weight 300 for headlines, progressive letter-spacing
- **Shadows**: Warm-tinted elevation system
- **Components**: Buttons, cards, badges, inputs, tables pre-styled

See `DESIGN.md` for complete design specifications.

## Project Structure

```
hrm-system/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   └── login/
│   ├── (dashboard)/         # Main app pages
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── attendance/
│   │   ├── leave/
│   │   ├── payroll/
│   │   ├── lifecycle/
│   │   └── kpi/
│   ├── admin/               # Admin-only pages
│   └── super-admin/         # Super admin pages
├── components/
│   ├── layout/              # Header, Sidebar
│   └── ui/                  # Reusable components
├── lib/
│   ├── supabase/            # Supabase clients
│   └── utils.ts             # Utility functions
└── supabase/
    └── migrations/          # Database schema
```

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript
- **Styling**: Tailwind CSS, shadcn/ui patterns
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **PDF**: react-pdf
- **Icons**: Lucide React
- **Dates**: date-fns

## Next Steps

Phase 1: Core Employee Management
- Build employee CRUD operations
- Profile management
- Document uploads

See `project-details.md` for the complete implementation roadmap.

## License

Proprietary - TAG Solutions
