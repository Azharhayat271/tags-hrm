# 🏢 HRM System

A full-featured Human Resource Management System built with **Next.js 14+** and **Supabase** — covering everything from daily attendance to the complete employee lifecycle.

---

## 📋 Table of Contents

- [Overview](#overview)
- [User Roles](#user-roles)
- [Modules](#modules)
  - [Employee Profile](#-employee-profile)
  - [Attendance & Check-in](#-attendance--check-in)
  - [Leave Management](#-leave-management)
  - [Payroll Management](#-payroll-management)
  - [Employee Lifecycle](#-employee-lifecycle)
  - [KPI & Performance](#-kpi--performance)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)

---

## Overview

This HRM system is designed to give organizations a single platform to manage their people — from the moment an employee joins to the day they exit. Employees get a clean self-service portal. Admins get full control over approvals and data. Super admins manage everything.

All access control is enforced at the database level using **Supabase Row Level Security (RLS)**, meaning role-based permissions are not just a UI concern — they're locked in at the data layer.

---

## User Roles

The system has three roles. Each role inherits the access of the role below it.

### 👑 Super Admin
- Full unrestricted access to every module and every employee record
- Can create and manage admin accounts
- Can configure company-wide settings (company name, logo, leave policies, public holidays)
- Can assign and revoke permissions for each admin on a module-by-module basis
- Can run payroll, upload salary slips, and view all reports

### 🛠️ Admin
- Access is granted by the super admin per module (e.g. can manage leave but not payroll)
- Can view and manage the employees assigned to their department or the full company, depending on permission
- Can approve/reject leave requests, upload salary slips, add lifecycle events
- Cannot access modules they haven't been granted permission for

### 👤 Employee
- Self-service access to their own data only
- Can check in/out, apply for leave, view their salary slips, and view their lifecycle timeline
- Cannot view or modify any other employee's data
- Read-only access to their own KPI reviews and attendance history

---

## Modules

---

### 👤 Employee Profile

The core record that every other module links back to. Created when an admin onboards a new employee.

#### Fields
| Field | Description |
|---|---|
| Full Name | Employee's legal name |
| Email | Work email address (used for login) |
| Phone | Contact number |
| Designation | Job title (e.g. Senior Engineer) |
| Department | Team or department |
| Employment Type | Full-time, part-time, contract |
| Joining Date | Official start date |
| Tenure | Auto-calculated from joining date to today |
| Reports To | Manager relationship (links to another employee record) |
| Status | Active, on leave, or exited |
| Documents | Offer letter, contract, NDA — uploaded to Supabase Storage |

#### Access
- **Employee** — can view their own profile, cannot edit
- **Admin** — can create and edit employee profiles
- **Super Admin** — full access including status changes and document management

---

### 🕐 Attendance & Check-in

Employees check in and out directly from the sidebar. The system timestamps every action server-side so it cannot be manipulated client-side.

#### Features

**Daily Check-in / Check-out**
- One-click check-in button appears when the employee has not yet checked in for the day
- Converts to a check-out button once checked in
- Server timestamp is recorded in UTC and displayed in the employee's local timezone
- Only one active session per employee at a time

**Break Tracking**
- Employees can log a break start and break end during their shift
- All breaks for the day are listed in a simple table (start time, end time, duration)
- Breaks are deducted automatically from total hours

**Daily Summary**
- Total time from first check-in to last check-out
- Total break duration
- Net productive hours (total time minus breaks)
- Status badge: complete, incomplete, or absent

**Monthly Attendance Report**
- Calendar-style view showing each day's status (present, absent, half-day, on leave, public holiday)
- Total working days vs days present
- Exportable as CSV by admins

#### Access
- **Employee** — can check in/out and view their own attendance history
- **Admin** — can view and export attendance for all employees in their scope
- **Super Admin** — full access, can manually correct attendance records if needed

---

### 🏖️ Leave Management

A complete leave request and approval system with balance tracking and a public holiday calendar.

#### Leave Types
The super admin configures which leave types are available and how many days each employee gets per year. Typical types:

- Annual Leave
- Sick Leave
- Casual Leave
- Unpaid Leave
- Maternity / Paternity Leave (if applicable)

#### Features

**Apply for Leave**
- Employee selects leave type, start date, end date, and adds an optional reason
- The system calculates how many working days the request covers (excluding weekends and public holidays)
- Request is submitted and goes into a pending state

**Leave Balance**
- Dashboard card showing remaining days per leave type
- Updates in real time as leaves are approved or cancelled
- Carry-forward rules configured by the super admin (e.g. max 5 annual leave days carry over to next year)

**Approval Workflow**
- Pending requests appear in the admin's approval queue
- Admin can approve or reject with an optional comment
- Employee receives a status update (in-app notification or email via Supabase Edge Functions)
- Approved leaves automatically block those dates in the attendance calendar

**Public Holidays Calendar**
- Super admin maintains a list of public holidays with dates and names
- Displayed as a read-only calendar for all employees
- Public holiday dates are excluded from leave day calculations

**Leave History**
- Full list of all past requests with status (approved, rejected, cancelled)
- Filter by date range or leave type

#### Access
- **Employee** — can apply, view balance, view history, view public holidays
- **Admin** — can approve/reject requests, view all pending and historical leaves
- **Super Admin** — can configure leave types, balances, carry-forward rules, and public holidays

---

### 💰 Payroll Management

Payroll is admin-driven. The admin generates salary slips externally (in their accounting tool or spreadsheet) and uploads them as PDFs to the system. Employees can then view and download their own slips.

#### Features

**Admin: Upload Salary Slip**
- Admin selects the employee and the month/year
- Uploads the salary slip as a PDF file
- File is stored securely in Supabase Storage with a private, signed URL
- Can upload individually or in bulk (one PDF per employee per month)

**Employee: View Salary Slip**
- Employee navigates to Payroll in the sidebar
- Selects a month from their history
- PDF is rendered inline in the browser using a PDF viewer (no download required to view)
- Clean, full-width viewer with page navigation for multi-page slips

**Employee: Download Salary Slip**
- One-click download button alongside the viewer
- File downloads directly from Supabase Storage via a time-limited signed URL
- Original PDF is served as-is — no re-generation

**Salary History**
- List of all uploaded slips organised by year and month
- Shows upload date and file name
- Employee can only see their own history
- Admin can see all employees' history

#### Access
- **Employee** — view and download their own salary slips only
- **Admin** — upload slips, view all employees' slip history
- **Super Admin** — full access including deleting incorrect uploads and re-uploading

---

### 🔄 Employee Lifecycle

A chronological timeline of every significant event in an employee's journey — from day one to their last day. This gives HR and managers a complete picture at a glance.

#### Lifecycle Event Types

| Event | Description |
|---|---|
| 🟢 Joining | Employee's start date, initial designation, and department |
| ✅ Probation Completed | Confirmation of passing probation period |
| 📈 Promotion | Change in designation or seniority level |
| 💵 Salary Increment | Salary revision with old and new amount |
| 🔀 Department Transfer | Move to a different team or department |
| 👔 Role Change | Change in job function without a title change |
| 📋 Performance Review | Formal review outcome (linked to KPI module) |
| ⚠️ Warning Issued | Formal written warning with details |
| 📄 PIP Initiated | Performance Improvement Plan with start and target date |
| 📄 PIP Closed | Outcome of PIP (met, extended, or terminated) |
| 🚪 Resignation | Resignation date and notice period |
| 🤝 Exit Interview | Exit interview completed, notes added |
| ✔️ Full & Final | Settlement processed and cleared |

#### Features

**Timeline View**
- Vertical timeline sorted from most recent to oldest
- Each event is a card showing: event type, date, a short description, and who added it
- Colour-coded by event category (growth events in green, administrative in blue, warnings in amber, exit in red)

**Add Lifecycle Event**
- Admin selects event type, date, and fills in the relevant fields
- Some events auto-populate (e.g. promotion links to designation field on the profile, which updates automatically)
- Optional notes field for context

**Employee View**
- Employees can view their own timeline in read-only mode
- Warning and PIP details are visible to the employee (they were informed at the time)
- Exit events are shown after the exit process is complete

#### Access
- **Employee** — read-only view of their own timeline
- **Admin** — can add and edit lifecycle events for employees in their scope
- **Super Admin** — full access including deleting incorrect entries

---

### 📊 KPI & Performance

A goal-setting and performance review system that keeps managers and employees aligned on expectations.

#### Features

**KPI Setup**
- Managers (or admins) create KPIs for each employee
- Each KPI has: title, description, target metric, unit (%, number, currency), deadline, and weight (how much it contributes to the overall score)
- KPIs are grouped by review cycle (e.g. Q1 2025, Annual 2025)

**Progress Tracking**
- Employees can see their active KPIs and current progress
- Managers can update progress values at any time
- Visual progress bar per KPI

**Performance Reviews**
- At the end of a review cycle, the manager conducts a formal review
- Each KPI is rated (e.g. 1–5 or percentage achieved)
- Overall weighted score is calculated automatically
- Manager adds qualitative feedback and an overall rating (e.g. Exceeds Expectations, Meets, Below)
- Employee can acknowledge the review and add their own comments

**Review History**
- Full history of all past review cycles with scores and feedback
- Feeds into the Employee Lifecycle timeline (each completed review adds a lifecycle event automatically)

**Export**
- Admins can export performance reports per employee or per department as CSV

#### Access
- **Employee** — view their own KPIs, progress, and review history; can acknowledge reviews and add comments
- **Admin** — create and manage KPIs, conduct reviews, view all performance data
- **Super Admin** — full access including configuring review cycle templates

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14+ (App Router) | Server components, routing, SSR |
| Styling | Tailwind CSS | Utility-first styling |
| Components | shadcn/ui | Accessible, unstyled component primitives |
| Backend | Supabase | PostgreSQL database, Auth, Storage |
| Auth | Supabase Auth | Email/password login, JWT sessions |
| Access Control | Supabase RLS | Row-level security policies per role |
| File Storage | Supabase Storage | Salary slip PDF hosting with signed URLs |
| PDF Viewer | react-pdf | In-browser PDF rendering |
| Charts | Recharts | Attendance and performance charts |
| Server Logic | Supabase Edge Functions | Notifications, leave approval triggers |
| Notifications | Resend (or SMTP via Supabase) | Email notifications for leave approvals |

---

## Project Structure

```
hrm-system/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + nav shell
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── attendance/
│   │   ├── leave/
│   │   ├── payroll/
│   │   ├── lifecycle/
│   │   └── kpi/
│   ├── admin/
│   │   ├── employees/
│   │   ├── leave-approvals/
│   │   ├── payroll-upload/
│   │   └── reports/
│   └── super-admin/
│       ├── admins/
│       ├── settings/
│       └── permissions/
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── attendance/
│   ├── leave/
│   ├── payroll/
│   ├── lifecycle/
│   └── kpi/
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── middleware.ts           # Auth middleware
│   └── utils.ts
├── supabase/
│   ├── migrations/                 # DB schema migrations
│   └── functions/                  # Edge functions
└── middleware.ts                   # Route protection
```

---

## Database Schema

### Core Tables

```sql
-- Roles enum
create type user_role as enum ('super_admin', 'admin', 'employee');

-- Users (extends Supabase auth.users)
create table profiles (
  id          uuid references auth.users primary key,
  full_name   text not null,
  email       text not null unique,
  phone       text,
  role        user_role not null default 'employee',
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Employees
create table employees (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid references profiles(id),
  designation     text,
  department      text,
  employment_type text,
  joining_date    date,
  reports_to      uuid references employees(id),
  status          text default 'active', -- active | on_leave | exited
  created_at      timestamptz default now()
);

-- Attendance
create table attendance (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid references employees(id),
  date          date not null,
  check_in      timestamptz,
  check_out     timestamptz,
  created_at    timestamptz default now(),
  unique(employee_id, date)
);

-- Breaks
create table breaks (
  id            uuid primary key default gen_random_uuid(),
  attendance_id uuid references attendance(id),
  break_start   timestamptz not null,
  break_end     timestamptz,
  created_at    timestamptz default now()
);

-- Leave types
create table leave_types (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  days_per_year       int not null,
  carry_forward_limit int default 0
);

-- Leave requests
create table leave_requests (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid references employees(id),
  leave_type_id uuid references leave_types(id),
  start_date    date not null,
  end_date      date not null,
  days          int not null,
  reason        text,
  status        text default 'pending', -- pending | approved | rejected | cancelled
  reviewed_by   uuid references profiles(id),
  review_note   text,
  created_at    timestamptz default now()
);

-- Public holidays
create table public_holidays (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  date  date not null unique
);

-- Salary slips
create table salary_slips (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id),
  month       int not null,   -- 1–12
  year        int not null,
  file_path   text not null,  -- Supabase Storage path
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz default now(),
  unique(employee_id, month, year)
);

-- Lifecycle events
create table lifecycle_events (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id),
  event_type  text not null,
  event_date  date not null,
  description text,
  added_by    uuid references profiles(id),
  created_at  timestamptz default now()
);

-- KPIs
create table kpis (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id),
  cycle       text not null,  -- e.g. "Q1 2025"
  title       text not null,
  description text,
  target      numeric,
  unit        text,
  weight      numeric default 1,
  progress    numeric default 0,
  created_at  timestamptz default now()
);

-- Performance reviews
create table performance_reviews (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid references employees(id),
  cycle           text not null,
  overall_rating  text,
  overall_score   numeric,
  manager_notes   text,
  employee_notes  text,
  acknowledged_at timestamptz,
  reviewed_by     uuid references profiles(id),
  created_at      timestamptz default now()
);
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)
- pnpm (recommended) or npm

### 1. Clone the repository

```bash
git clone https://github.com/your-org/hrm-system.git
cd hrm-system
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Run database migrations

```bash
npx supabase db push
```

### 5. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 6. Create your first Super Admin

After running the app, sign up with your email. Then in the Supabase dashboard, go to the `profiles` table and manually set your role to `super_admin`. All subsequent admin accounts can be created from within the app.

---

## Roadmap

- [ ] Employee self-service profile editing (name, phone, avatar)
- [ ] In-app notifications center
- [ ] Department-level analytics dashboard
- [ ] Mobile app (React Native + Supabase)
- [ ] Bulk employee import via CSV
- [ ] Announcement board
- [ ] Asset management (laptops, equipment assigned to employees)