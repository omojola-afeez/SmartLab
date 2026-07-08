-- =====================================================================
-- SmartLab — Stage 2 migration
-- Run this in Supabase SQL Editor AFTER the Stage 1 schema.
-- Switches admin login to Supabase's built-in Auth (secure, free,
-- handles password hashing/sessions for you) instead of a custom table.
-- =====================================================================

-- Drop the old custom-password administrators table from Stage 1 —
-- Supabase Auth (auth.users) replaces it.
drop table if exists administrators;

-- Profile info for each admin/teacher, linked 1-to-1 with Supabase Auth
create table admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'teacher' check (role in ('teacher','admin','superadmin')),
  created_at timestamptz not null default now()
);

alter table admin_profiles enable row level security;

-- A logged-in admin can read their own profile
create policy "Admins can read own profile"
  on admin_profiles for select
  using (auth.uid() = id);

-- Allow any authenticated (logged-in) user to read live session data
-- for the dashboard. Tighten later with role-based checks if needed.
create policy "Authenticated users can read sessions"
  on sessions for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read students"
  on students for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read violations"
  on violations for select
  using (auth.role() = 'authenticated');

-- =====================================================================
-- After running this, create your first admin login:
-- Supabase Dashboard → Authentication → Users → Add User
-- (enter an email + password — this becomes your login)
-- Then run this, swapping in that user's UUID (shown in the Users list)
-- and your name:
--
-- insert into admin_profiles (id, full_name, role)
-- values ('PASTE-USER-UUID-HERE', 'Your Name', 'superadmin');
-- =====================================================================
