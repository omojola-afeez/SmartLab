/*
# SmartLab Dashboard — Full Database Schema

## Overview
Complete schema for the SmartLab Dashboard — a computer lab monitoring system.
This migration creates all tables: students, computers, sessions, violations,
and admin_profiles, with RLS enabled on every table.

## New Tables
### students
Registered lab users. student_number (unique), full_name, course, year_level, status.

### computers
Physical PCs. hostname (unique), location, status (online/offline/maintenance), os_info, last_seen.

### sessions
Student login session on a computer. login_at, logout_at, duration_minutes, status (active/closed/terminated).

### violations
Policy violations logged by agent. type, description, severity (info/warning/critical).

### admin_profiles
Admin/teacher profile linked to auth.users. full_name, role (teacher/admin/superadmin).

## Security
- admin_profiles: owner read/update only.
- All other tables: authenticated users can read; admin/superadmin can write
  (checked via SECURITY DEFINER function get_current_admin_role()).
- RLS enabled on all tables.

## Notes
1. Idempotent — safe to re-run.
2. Trigger auto-creates admin_profiles row on signup (uses full_name from user metadata).
3. Email confirmation stays OFF.
*/

-- ============================================================
-- admin_profiles (created first — function depends on it)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher','admin','superadmin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON admin_profiles;
CREATE POLICY "select_own_profile"
  ON admin_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON admin_profiles;
CREATE POLICY "update_own_profile"
  ON admin_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- SECURITY DEFINER function for role checks in write policies
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_current_admin_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM admin_profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- Trigger: auto-create admin_profiles row on auth signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'teacher'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- students
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  course text,
  year_level int DEFAULT 1,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','inactive')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_students_authenticated" ON students;
CREATE POLICY "select_students_authenticated"
  ON students FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_students_admin" ON students;
CREATE POLICY "insert_students_admin"
  ON students FOR INSERT TO authenticated
  WITH CHECK (public.get_current_admin_role() IN ('admin','superadmin'));

DROP POLICY IF EXISTS "update_students_admin" ON students;
CREATE POLICY "update_students_admin"
  ON students FOR UPDATE TO authenticated
  USING (public.get_current_admin_role() IN ('admin','superadmin'))
  WITH CHECK (public.get_current_admin_role() IN ('admin','superadmin'));

DROP POLICY IF EXISTS "delete_students_admin" ON students;
CREATE POLICY "delete_students_admin"
  ON students FOR DELETE TO authenticated
  USING (public.get_current_admin_role() IN ('admin','superadmin'));

-- ============================================================
-- computers
-- ============================================================
CREATE TABLE IF NOT EXISTS computers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname text UNIQUE NOT NULL,
  location text,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online','offline','maintenance')),
  os_info text,
  last_seen timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE computers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_computers_authenticated" ON computers;
CREATE POLICY "select_computers_authenticated"
  ON computers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_computers_admin" ON computers;
CREATE POLICY "insert_computers_admin"
  ON computers FOR INSERT TO authenticated
  WITH CHECK (public.get_current_admin_role() IN ('admin','superadmin'));

DROP POLICY IF EXISTS "update_computers_admin" ON computers;
CREATE POLICY "update_computers_admin"
  ON computers FOR UPDATE TO authenticated
  USING (public.get_current_admin_role() IN ('admin','superadmin'))
  WITH CHECK (public.get_current_admin_role() IN ('admin','superadmin'));

DROP POLICY IF EXISTS "delete_computers_admin" ON computers;
CREATE POLICY "delete_computers_admin"
  ON computers FOR DELETE TO authenticated
  USING (public.get_current_admin_role() IN ('admin','superadmin'));

-- ============================================================
-- sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  computer_id uuid REFERENCES computers(id) ON DELETE CASCADE,
  login_at timestamptz NOT NULL DEFAULT now(),
  logout_at timestamptz,
  duration_minutes int,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed','terminated')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_sessions_authenticated" ON sessions;
CREATE POLICY "select_sessions_authenticated"
  ON sessions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_sessions_admin" ON sessions;
CREATE POLICY "insert_sessions_admin"
  ON sessions FOR INSERT TO authenticated
  WITH CHECK (public.get_current_admin_role() IN ('admin','superadmin'));

DROP POLICY IF EXISTS "update_sessions_admin" ON sessions;
CREATE POLICY "update_sessions_admin"
  ON sessions FOR UPDATE TO authenticated
  USING (public.get_current_admin_role() IN ('admin','superadmin'))
  WITH CHECK (public.get_current_admin_role() IN ('admin','superadmin'));

DROP POLICY IF EXISTS "delete_sessions_admin" ON sessions;
CREATE POLICY "delete_sessions_admin"
  ON sessions FOR DELETE TO authenticated
  USING (public.get_current_admin_role() IN ('admin','superadmin'));

-- ============================================================
-- violations
-- ============================================================
CREATE TABLE IF NOT EXISTS violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  computer_id uuid REFERENCES computers(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  type text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','critical')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_violations_authenticated" ON violations;
CREATE POLICY "select_violations_authenticated"
  ON violations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_violations_admin" ON violations;
CREATE POLICY "insert_violations_admin"
  ON violations FOR INSERT TO authenticated
  WITH CHECK (public.get_current_admin_role() IN ('admin','superadmin'));

DROP POLICY IF EXISTS "update_violations_admin" ON violations;
CREATE POLICY "update_violations_admin"
  ON violations FOR UPDATE TO authenticated
  USING (public.get_current_admin_role() IN ('admin','superadmin'))
  WITH CHECK (public.get_current_admin_role() IN ('admin','superadmin'));

DROP POLICY IF EXISTS "delete_violations_admin" ON violations;
CREATE POLICY "delete_violations_admin"
  ON violations FOR DELETE TO authenticated
  USING (public.get_current_admin_role() IN ('admin','superadmin'));

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_login_at ON sessions(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_violations_created_at ON violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_computers_status ON computers(status);