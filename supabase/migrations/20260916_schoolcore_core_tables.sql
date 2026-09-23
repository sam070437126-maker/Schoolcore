-- ==========================================================
-- SchoolCore Core Tables Migration & RLS Security Script
-- Tables: profiles, students, classes, attendance, staff, notices
-- Target: Supabase / PostgreSQL 15+
-- ==========================================================

-- Enable essential cryptographic & UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------
-- 1. ROOT TENANT & DEPENDENCY TABLES (Required for FKs)
-- ----------------------------------------------------------

-- Multi-Tenant Root: Schools
CREATE TABLE IF NOT EXISTS public.schools (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Nigeria',
  website TEXT,
  lga TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  google_place_id TEXT,
  google_maps_uri TEXT,
  location_source TEXT DEFAULT 'manual',
  last_verified_at TIMESTAMPTZ,
  current_session_id TEXT,
  current_term TEXT NOT NULL DEFAULT 'FIRST_TERM' CHECK (current_term IN ('FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Academic Sessions (referenced by classes)
CREATE TABLE IF NOT EXISTS public.academic_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- 2. USER IDENTITIES & ACCESS CONTROL
-- ----------------------------------------------------------

-- Table: profiles (Global user accounts / credentials)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: school_users (Institutional memberships for multi-tenancy & RLS)
CREATE TABLE IF NOT EXISTS public.school_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'TEACHER' CHECK (role IN (
    'SUPER_ADMIN',
    'SCHOOL_ADMIN',
    'PRINCIPAL',
    'TEACHER',
    'BURSAR',
    'ACADEMIC_COORDINATOR',
    'REGISTRAR',
    'PARENT'
  )),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, profile_id)
);

-- ----------------------------------------------------------
-- 3. ACADEMIC STRUCTURE: CLASSES & STUDENTS
-- ----------------------------------------------------------

-- Table: classes
CREATE TABLE IF NOT EXISTS public.classes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  arm TEXT NOT NULL DEFAULT 'A',
  class_teacher_id TEXT,
  academic_session_id TEXT REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  capacity INT DEFAULT 45 CHECK (capacity > 0),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  subjects JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: students
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  admission_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('MALE', 'FEMALE')),
  date_of_birth DATE NOT NULL,
  blood_group TEXT,
  genotype TEXT,
  state_of_origin TEXT,
  current_class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  admission_date DATE NOT NULL,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  guardian_email TEXT,
  guardian_relationship TEXT DEFAULT 'Parent',
  residential_address TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'SUSPENDED')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, admission_number)
);

-- ----------------------------------------------------------
-- 4. STAFF DIRECTORY
-- ----------------------------------------------------------

-- Table: staff
CREATE TABLE IF NOT EXISTS public.staff (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'TEACHER' CHECK (role IN (
    'SUPER_ADMIN',
    'SCHOOL_ADMIN',
    'PRINCIPAL',
    'TEACHER',
    'BURSAR',
    'ACADEMIC_COORDINATOR',
    'REGISTRAR',
    'PARENT'
  )),
  assigned_classes JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, employee_id)
);

-- ----------------------------------------------------------
-- 5. ATTENDANCE (Sessions & Records)
-- ----------------------------------------------------------

-- Table: attendance_sessions (Roll-call headers)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL DEFAULT 'MORNING' CHECK (session_type IN ('MORNING', 'AFTERNOON', 'MORNING_ROLL_CALL', 'AFTERNOON_ROLL_CALL')),
  date DATE NOT NULL,
  taken_by_profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, class_id, session_type, date)
);

-- Table: attendance_records (Individual student daily attendance)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE')),
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- ----------------------------------------------------------
-- 6. NOTICES & ANNOUNCEMENTS
-- ----------------------------------------------------------

-- Table: notices
CREATE TABLE IF NOT EXISTS public.notices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'EVERYONE' CHECK (audience IN ('EVERYONE', 'TEACHERS', 'STUDENTS', 'PARENTS', 'CLASS')),
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'DRAFT', 'ARCHIVED')),
  target_class_id TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
  author_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- 7. PERFORMANCE INDEXES
-- ----------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_core_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_core_school_users ON public.school_users(school_id, profile_id);
CREATE INDEX IF NOT EXISTS idx_core_classes_school ON public.classes(school_id, status);
CREATE INDEX IF NOT EXISTS idx_core_students_school_class ON public.students(school_id, current_class_id);
CREATE INDEX IF NOT EXISTS idx_core_students_admission ON public.students(school_id, admission_number);
CREATE INDEX IF NOT EXISTS idx_core_staff_school ON public.staff(school_id, status);
CREATE INDEX IF NOT EXISTS idx_core_attendance_session ON public.attendance_sessions(school_id, class_id, date);
CREATE INDEX IF NOT EXISTS idx_core_attendance_record_student ON public.attendance_records(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_core_notices_school ON public.notices(school_id, status, audience);

-- ----------------------------------------------------------
-- 8. SECURITY HELPER FUNCTIONS
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.school_users
  WHERE profile_id = (SELECT auth.uid())::text AND status = 'ACTIVE'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_school_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_users
    WHERE profile_id = (SELECT auth.uid())::text
      AND status = 'ACTIVE'
      AND role IN ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL')
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_user_school_id() TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.is_school_admin() TO authenticated, service_role, anon;

-- ----------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------

-- Enable RLS across all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 9.1 Profiles Policies
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
CREATE POLICY "Authenticated users can read profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())::text);

-- 9.2 School Isolation Policies (classes, students, staff, attendance, notices)
-- Classes
DROP POLICY IF EXISTS "Institutional isolation for classes: SELECT" ON public.classes;
CREATE POLICY "Institutional isolation for classes: SELECT" ON public.classes
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() AND public.is_school_admin())
  WITH CHECK (school_id = public.get_user_school_id() AND public.is_school_admin());

-- Students
DROP POLICY IF EXISTS "Institutional isolation for students: SELECT" ON public.students;
CREATE POLICY "Institutional isolation for students: SELECT" ON public.students
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Admins and teachers can manage students" ON public.students;
CREATE POLICY "Admins and teachers can manage students" ON public.students
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

-- Staff
DROP POLICY IF EXISTS "Institutional isolation for staff: SELECT" ON public.staff;
CREATE POLICY "Institutional isolation for staff: SELECT" ON public.staff
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;
CREATE POLICY "Admins can manage staff" ON public.staff
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() AND public.is_school_admin())
  WITH CHECK (school_id = public.get_user_school_id() AND public.is_school_admin());

-- Attendance Sessions & Records
DROP POLICY IF EXISTS "Institutional isolation for attendance sessions" ON public.attendance_sessions;
CREATE POLICY "Institutional isolation for attendance sessions" ON public.attendance_sessions
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Institutional isolation for attendance records" ON public.attendance_records;
CREATE POLICY "Institutional isolation for attendance records" ON public.attendance_records
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

-- Notices
DROP POLICY IF EXISTS "Institutional isolation for notices: SELECT" ON public.notices;
CREATE POLICY "Institutional isolation for notices: SELECT" ON public.notices
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id() AND status = 'PUBLISHED');

DROP POLICY IF EXISTS "Admins and teachers can manage notices" ON public.notices;
CREATE POLICY "Admins and teachers can manage notices" ON public.notices
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());
