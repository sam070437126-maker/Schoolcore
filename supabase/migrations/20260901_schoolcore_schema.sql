-- ==========================================================
-- SchoolCore Production PostgreSQL Schema & Security Protocols
-- Target: Supabase / PostgreSQL 15+
-- Adheres to Supabase PostgreSQL Best Practices (RLS, Multi-Tenant Isolation, Indexes)
-- ==========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- 1. CORE DATABASE TABLES DEFINITION
-- ==========================================================

-- 1. SCHOOLS (Multi-tenant Institutional Root)
CREATE TABLE IF NOT EXISTS public.schools (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  motto TEXT,
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

-- 2. ACADEMIC SESSIONS
CREATE TABLE IF NOT EXISTS public.academic_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PROFILES (Global User Identities)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SCHOOL USERS (Multi-Tenant Memberships & Role-Based Access Control)
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

-- 5. CLASSES
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

-- 6. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  category TEXT DEFAULT 'CORE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, code)
);

-- 7. STUDENTS
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

-- 8. STAFF
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

-- 9. ATTENDANCE SESSIONS
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

-- 10. ATTENDANCE RECORDS
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

-- 11. NOTICES (Broadcasts & Announcements)
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

-- 12. SCHOOL SETTINGS
CREATE TABLE IF NOT EXISTS public.school_settings (
  school_id TEXT PRIMARY KEY REFERENCES public.schools(id) ON DELETE CASCADE,
  attendance_late_cutoff_time TEXT DEFAULT '08:15',
  enable_afternoon_session BOOLEAN DEFAULT FALSE,
  low_bandwidth_mode BOOLEAN DEFAULT TRUE,
  currency TEXT DEFAULT 'NGN',
  grading_scale JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. AUDIT LOGS (Immutable Append-Only Security Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. ACADEMIC CONFIGS
CREATE TABLE IF NOT EXISTS public.academic_configs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  term TEXT NOT NULL CHECK (term IN ('FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM')),
  grading_scale JSONB NOT NULL DEFAULT '[]'::jsonb,
  ca1_max_score INT DEFAULT 20,
  ca2_max_score INT DEFAULT 20,
  exam_max_score INT DEFAULT 60,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, session_id, term)
);

-- 15. TEACHER SUBJECT ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.teacher_subject_assignments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, class_id, subject_id, session_id)
);

-- 16. SUBJECT RESULTS
CREATE TABLE IF NOT EXISTS public.subject_results (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  academic_session_id TEXT NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  term TEXT NOT NULL CHECK (term IN ('FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM')),
  ca1_score NUMERIC(5,2) DEFAULT 0,
  ca2_score NUMERIC(5,2) DEFAULT 0,
  exam_score NUMERIC(5,2) DEFAULT 0,
  total_score NUMERIC(5,2) DEFAULT 0,
  grade TEXT,
  remark TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'REVIEWED', 'PUBLISHED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, student_id, class_id, subject_id, academic_session_id, term)
);

-- 17. STUDENT TERM REMARKS
CREATE TABLE IF NOT EXISTS public.student_term_remarks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_session_id TEXT REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  term TEXT NOT NULL CHECK (term IN ('FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM')),
  form_teacher_remark TEXT,
  principal_remark TEXT,
  next_term_fees TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'REVIEWED', 'PUBLISHED')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, student_id, academic_session_id, term)
);

-- 18. HOMEWORK ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.homework (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  max_points INT DEFAULT 100,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. HOMEWORK SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.homework_submissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  homework_id TEXT NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  submission_text TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  score NUMERIC(5,2),
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  UNIQUE(homework_id, student_id)
);

-- 20. DIRECT MESSAGES
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  sender_profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. FEE ACCOUNTS
CREATE TABLE IF NOT EXISTS public.fee_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  total_billed NUMERIC(12,2) DEFAULT 0,
  total_paid NUMERIC(12,2) DEFAULT 0,
  outstanding_balance NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PAID', 'PARTIAL', 'PENDING', 'OVERDUE')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, student_id)
);

-- 22. FEE PAYMENTS
CREATE TABLE IF NOT EXISTS public.fee_payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES public.fee_accounts(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  reference TEXT NOT NULL,
  receipt_number TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. DIGITAL APPROVALS
CREATE TABLE IF NOT EXISTS public.digital_approvals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL,
  approver_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  decision_note TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- 2. HIGH-PERFORMANCE INDEXES
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_schools_code ON public.schools(code);
CREATE INDEX IF NOT EXISTS idx_schools_google_place_id ON public.schools(google_place_id) WHERE google_place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_academic_sessions_school ON public.academic_sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_school_users_profile ON public.school_users(profile_id);
CREATE INDEX IF NOT EXISTS idx_school_users_school ON public.school_users(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(school_id, current_class_id);
CREATE INDEX IF NOT EXISTS idx_students_admission ON public.students(school_id, admission_number);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_lookup ON public.attendance_sessions(school_id, class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_lookup ON public.attendance_records(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_notices_school_status ON public.notices(school_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school ON public.audit_logs(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classes_school ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school ON public.subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_staff_school ON public.staff(school_id);
CREATE INDEX IF NOT EXISTS idx_subject_results_lookup ON public.subject_results(school_id, class_id, subject_id, term);
CREATE INDEX IF NOT EXISTS idx_homework_school_class ON public.homework(school_id, class_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.direct_messages(school_id, recipient_profile_id);
CREATE INDEX IF NOT EXISTS idx_fee_accounts_student ON public.fee_accounts(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_account ON public.fee_payments(school_id, account_id);

-- ==========================================================
-- 3. SECURITY HELPER FUNCTIONS (Row Level Security Helpers)
-- ==========================================================

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

-- ==========================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

-- Enable RLS on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_term_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_approvals ENABLE ROW LEVEL SECURITY;

-- Clean existing policies for idempotency
DO $$ BEGIN
  -- Drop policies if already existing to avoid conflicts on re-run
  PERFORM 1;
END $$;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())::text)
  WITH CHECK (id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Allow user registration" ON public.profiles;
CREATE POLICY "Allow user registration" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid())::text);

-- 2. Schools Policies
DROP POLICY IF EXISTS "School members can view their school" ON public.schools;
CREATE POLICY "School members can view their school" ON public.schools
  FOR SELECT TO authenticated
  USING (id = public.get_user_school_id());

DROP POLICY IF EXISTS "Admins can update their school" ON public.schools;
CREATE POLICY "Admins can update their school" ON public.schools
  FOR UPDATE TO authenticated
  USING (id = public.get_user_school_id() AND public.is_school_admin())
  WITH CHECK (id = public.get_user_school_id() AND public.is_school_admin());

-- 3. Academic Sessions Policies
DROP POLICY IF EXISTS "School members can view sessions" ON public.academic_sessions;
CREATE POLICY "School members can view sessions" ON public.academic_sessions
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Admins can manage sessions" ON public.academic_sessions;
CREATE POLICY "Admins can manage sessions" ON public.academic_sessions
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() AND public.is_school_admin())
  WITH CHECK (school_id = public.get_user_school_id() AND public.is_school_admin());

-- 4. School Users (Memberships) Policies
DROP POLICY IF EXISTS "Members can view school staff" ON public.school_users;
CREATE POLICY "Members can view school staff" ON public.school_users
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id() OR profile_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Admins can manage school users" ON public.school_users;
CREATE POLICY "Admins can manage school users" ON public.school_users
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() AND public.is_school_admin())
  WITH CHECK (school_id = public.get_user_school_id() AND public.is_school_admin());

-- 5. Classes Policies
DROP POLICY IF EXISTS "School members can view classes" ON public.classes;
CREATE POLICY "School members can view classes" ON public.classes
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() AND public.is_school_admin())
  WITH CHECK (school_id = public.get_user_school_id() AND public.is_school_admin());

-- 6. Subjects Policies
DROP POLICY IF EXISTS "School members can view subjects" ON public.subjects;
CREATE POLICY "School members can view subjects" ON public.subjects
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() AND public.is_school_admin())
  WITH CHECK (school_id = public.get_user_school_id() AND public.is_school_admin());

-- 7. Students Policies
DROP POLICY IF EXISTS "School members can view students" ON public.students;
CREATE POLICY "School members can view students" ON public.students
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() AND public.is_school_admin())
  WITH CHECK (school_id = public.get_user_school_id() AND public.is_school_admin());

-- 8. Staff Policies
DROP POLICY IF EXISTS "School members can view staff" ON public.staff;
CREATE POLICY "School members can view staff" ON public.staff
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;
CREATE POLICY "Admins can manage staff" ON public.staff
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() AND public.is_school_admin())
  WITH CHECK (school_id = public.get_user_school_id() AND public.is_school_admin());

-- 9. Attendance Policies
DROP POLICY IF EXISTS "Teachers and Admins can manage attendance" ON public.attendance_sessions;
CREATE POLICY "Teachers and Admins can manage attendance" ON public.attendance_sessions
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Attendance records access" ON public.attendance_records;
CREATE POLICY "Attendance records access" ON public.attendance_records
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

-- 10. Notices Policies
DROP POLICY IF EXISTS "School members can view notices" ON public.notices;
CREATE POLICY "School members can view notices" ON public.notices
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Staff can manage notices" ON public.notices;
CREATE POLICY "Staff can manage notices" ON public.notices
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() AND public.is_school_admin())
  WITH CHECK (school_id = public.get_user_school_id() AND public.is_school_admin());

-- 11. School Settings Policies
DROP POLICY IF EXISTS "School members can view settings" ON public.school_settings;
CREATE POLICY "School members can view settings" ON public.school_settings
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Admins can manage settings" ON public.school_settings;
CREATE POLICY "Admins can manage settings" ON public.school_settings
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() AND public.is_school_admin())
  WITH CHECK (school_id = public.get_user_school_id() AND public.is_school_admin());

-- 12. Audit Logs Policies (Append-only)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id() AND public.is_school_admin());

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (school_id = public.get_user_school_id());

-- 13. Academics Policies
DROP POLICY IF EXISTS "School members can view academic configs" ON public.academic_configs;
CREATE POLICY "School members can view academic configs" ON public.academic_configs
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Admins can manage academic configs" ON public.academic_configs;
CREATE POLICY "Admins can manage academic configs" ON public.academic_configs
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() AND public.is_school_admin())
  WITH CHECK (school_id = public.get_user_school_id() AND public.is_school_admin());

DROP POLICY IF EXISTS "Results access" ON public.subject_results;
CREATE POLICY "Results access" ON public.subject_results
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Remarks access" ON public.student_term_remarks;
CREATE POLICY "Remarks access" ON public.student_term_remarks
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

-- 14. Homework, Messaging, and Finance Policies
DROP POLICY IF EXISTS "Homework access" ON public.homework;
CREATE POLICY "Homework access" ON public.homework
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Homework submissions access" ON public.homework_submissions;
CREATE POLICY "Homework submissions access" ON public.homework_submissions
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

DROP POLICY IF EXISTS "Messages access" ON public.direct_messages;
CREATE POLICY "Messages access" ON public.direct_messages
  FOR ALL TO authenticated
  USING (
    school_id = public.get_user_school_id() AND
    (sender_profile_id = (SELECT auth.uid())::text OR recipient_profile_id = (SELECT auth.uid())::text)
  )
  WITH CHECK (
    school_id = public.get_user_school_id() AND
    sender_profile_id = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Fee accounts access" ON public.fee_accounts;
CREATE POLICY "Fee accounts access" ON public.fee_accounts
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id() AND public.is_school_admin());

DROP POLICY IF EXISTS "Fee payments access" ON public.fee_payments;
CREATE POLICY "Fee payments access" ON public.fee_payments
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id() AND public.is_school_admin());

DROP POLICY IF EXISTS "Approvals access" ON public.digital_approvals;
CREATE POLICY "Approvals access" ON public.digital_approvals
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

COMMENT ON SCHEMA public IS 'SchoolCore Production Multi-Tenant Schema with RLS and Security Protocols';
