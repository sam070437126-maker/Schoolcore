-- ====================================================
-- SchoolCore: System Logs & Transactional Sync RPC
-- Migration: 20260917_system_logs_and_rpc.sql
-- ====================================================

-- 1. System Logs Table for Global Error Boundary & Traceability
CREATE TABLE IF NOT EXISTS public.system_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  level TEXT NOT NULL DEFAULT 'ERROR',
  message TEXT NOT NULL,
  stack TEXT,
  component_stack TEXT,
  user_id TEXT,
  school_id TEXT,
  url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_school_id ON public.system_logs(school_id);

-- Enable RLS on system_logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users and service role to write logs
DROP POLICY IF EXISTS "Allow any user to insert system logs" ON public.system_logs;
CREATE POLICY "Allow any user to insert system logs" ON public.system_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admins to read system logs" ON public.system_logs;
CREATE POLICY "Allow admins to read system logs" ON public.system_logs
  FOR SELECT TO authenticated
  USING (true);

-- 2. Transactional SchoolCore Sync RPC Function
-- Executes inside a single atomic PostgreSQL transaction block
CREATE OR REPLACE FUNCTION public.sync_schoolcore_bundle(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_school_id TEXT;
  v_schools_count INT := 0;
  v_sessions_count INT := 0;
  v_profiles_count INT := 0;
  v_classes_count INT := 0;
  v_staff_count INT := 0;
  v_students_count INT := 0;
  v_att_sessions_count INT := 0;
  v_att_records_count INT := 0;
  v_notices_count INT := 0;
BEGIN
  -- 1. Upsert Schools
  IF payload ? 'schools' AND jsonb_array_length(payload->'schools') > 0 THEN
    INSERT INTO public.schools (id, name, code, phone, email, address, state, lga, current_session_id, current_term, status, logo_url, created_at, updated_at)
    SELECT
      (elem->>'id'),
      (elem->>'name'),
      (elem->>'code'),
      (elem->>'phone'),
      (elem->>'email'),
      (elem->>'address'),
      (elem->>'state'),
      (elem->>'lga'),
      (elem->>'current_session_id'),
      (elem->>'current_term'),
      COALESCE((elem->>'status'), 'ACTIVE'),
      (elem->>'logo_url'),
      COALESCE((elem->>'created_at')::timestamptz, NOW()),
      NOW()
    FROM jsonb_array_elements(payload->'schools') AS elem
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      code = EXCLUDED.code,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      address = EXCLUDED.address,
      state = EXCLUDED.state,
      lga = EXCLUDED.lga,
      current_session_id = EXCLUDED.current_session_id,
      current_term = EXCLUDED.current_term,
      status = EXCLUDED.status,
      updated_at = NOW();
    GET DIAGNOSTICS v_schools_count = ROW_COUNT;
  END IF;

  -- 2. Upsert Academic Sessions
  IF payload ? 'academic_sessions' AND jsonb_array_length(payload->'academic_sessions') > 0 THEN
    INSERT INTO public.academic_sessions (id, school_id, name, term, start_date, end_date, is_current, created_at)
    SELECT
      (elem->>'id'),
      (elem->>'school_id'),
      (elem->>'name'),
      (elem->>'term'),
      (elem->>'start_date')::date,
      (elem->>'end_date')::date,
      COALESCE((elem->>'is_current')::boolean, false),
      COALESCE((elem->>'created_at')::timestamptz, NOW())
    FROM jsonb_array_elements(payload->'academic_sessions') AS elem
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      term = EXCLUDED.term,
      is_current = EXCLUDED.is_current;
    GET DIAGNOSTICS v_sessions_count = ROW_COUNT;
  END IF;

  -- 3. Upsert Profiles
  IF payload ? 'profiles' AND jsonb_array_length(payload->'profiles') > 0 THEN
    INSERT INTO public.profiles (id, full_name, email, phone, role, status, avatar_url, created_at, updated_at)
    SELECT
      (elem->>'id'),
      (elem->>'full_name'),
      (elem->>'email'),
      (elem->>'phone'),
      (elem->>'role'),
      COALESCE((elem->>'status'), 'ACTIVE'),
      (elem->>'avatar_url'),
      COALESCE((elem->>'created_at')::timestamptz, NOW()),
      NOW()
    FROM jsonb_array_elements(payload->'profiles') AS elem
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      role = EXCLUDED.role,
      status = EXCLUDED.status,
      updated_at = NOW();
    GET DIAGNOSTICS v_profiles_count = ROW_COUNT;
  END IF;

  -- 4. Upsert Classes
  IF payload ? 'classes' AND jsonb_array_length(payload->'classes') > 0 THEN
    INSERT INTO public.classes (id, school_id, name, level, arm, class_teacher_id, academic_session_id, capacity, status, subjects, created_at)
    SELECT
      (elem->>'id'),
      (elem->>'school_id'),
      (elem->>'name'),
      (elem->>'level'),
      COALESCE((elem->>'arm'), 'A'),
      (elem->>'class_teacher_id'),
      (elem->>'academic_session_id'),
      COALESCE((elem->>'capacity')::int, 45),
      COALESCE((elem->>'status'), 'ACTIVE'),
      COALESCE(elem->'subjects', '[]'::jsonb),
      COALESCE((elem->>'created_at')::timestamptz, NOW())
    FROM jsonb_array_elements(payload->'classes') AS elem
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      level = EXCLUDED.level,
      arm = EXCLUDED.arm,
      class_teacher_id = EXCLUDED.class_teacher_id,
      capacity = EXCLUDED.capacity,
      status = EXCLUDED.status,
      subjects = EXCLUDED.subjects;
    GET DIAGNOSTICS v_classes_count = ROW_COUNT;
  END IF;

  -- 5. Upsert Staff
  IF payload ? 'staff' AND jsonb_array_length(payload->'staff') > 0 THEN
    INSERT INTO public.staff (id, school_id, profile_id, employee_id, designation, department, qualification, employment_date, status, assigned_class_id, created_at)
    SELECT
      (elem->>'id'),
      (elem->>'school_id'),
      (elem->>'profile_id'),
      (elem->>'employee_id'),
      (elem->>'designation'),
      (elem->>'department'),
      (elem->>'qualification'),
      COALESCE((elem->>'employment_date')::date, CURRENT_DATE),
      COALESCE((elem->>'status'), 'ACTIVE'),
      (elem->>'assigned_class_id'),
      COALESCE((elem->>'created_at')::timestamptz, NOW())
    FROM jsonb_array_elements(payload->'staff') AS elem
    ON CONFLICT (id) DO UPDATE SET
      designation = EXCLUDED.designation,
      status = EXCLUDED.status,
      assigned_class_id = EXCLUDED.assigned_class_id;
    GET DIAGNOSTICS v_staff_count = ROW_COUNT;
  END IF;

  -- 6. Upsert Students
  IF payload ? 'students' AND jsonb_array_length(payload->'students') > 0 THEN
    INSERT INTO public.students (
      id, school_id, admission_number, first_name, middle_name, last_name, gender, date_of_birth,
      blood_group, genotype, state_of_origin, current_class_id, admission_date,
      guardian_name, guardian_phone, guardian_email, guardian_relationship, address, status, photo_url, created_at
    )
    SELECT
      (elem->>'id'),
      (elem->>'school_id'),
      (elem->>'admission_number'),
      (elem->>'first_name'),
      (elem->>'middle_name'),
      (elem->>'last_name'),
      (elem->>'gender'),
      (elem->>'date_of_birth')::date,
      (elem->>'blood_group'),
      (elem->>'genotype'),
      (elem->>'state_of_origin'),
      (elem->>'current_class_id'),
      COALESCE((elem->>'admission_date')::date, CURRENT_DATE),
      (elem->>'guardian_name'),
      (elem->>'guardian_phone'),
      (elem->>'guardian_email'),
      (elem->>'guardian_relationship'),
      (elem->>'address'),
      COALESCE((elem->>'status'), 'ACTIVE'),
      (elem->>'photo_url'),
      COALESCE((elem->>'created_at')::timestamptz, NOW())
    FROM jsonb_array_elements(payload->'students') AS elem
    ON CONFLICT (id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      middle_name = EXCLUDED.middle_name,
      last_name = EXCLUDED.last_name,
      current_class_id = EXCLUDED.current_class_id,
      guardian_name = EXCLUDED.guardian_name,
      guardian_phone = EXCLUDED.guardian_phone,
      guardian_email = EXCLUDED.guardian_email,
      status = EXCLUDED.status;
    GET DIAGNOSTICS v_students_count = ROW_COUNT;
  END IF;

  -- 7. Upsert Attendance Sessions
  IF payload ? 'attendance_sessions' AND jsonb_array_length(payload->'attendance_sessions') > 0 THEN
    INSERT INTO public.attendance_sessions (id, school_id, class_id, session_type, date, taken_by_profile_id, created_at)
    SELECT
      (elem->>'id'),
      (elem->>'school_id'),
      (elem->>'class_id'),
      COALESCE((elem->>'session_type'), 'MORNING'),
      (elem->>'date')::date,
      (elem->>'taken_by_profile_id'),
      COALESCE((elem->>'created_at')::timestamptz, NOW())
    FROM jsonb_array_elements(payload->'attendance_sessions') AS elem
    ON CONFLICT (id) DO UPDATE SET
      taken_by_profile_id = EXCLUDED.taken_by_profile_id;
    GET DIAGNOSTICS v_att_sessions_count = ROW_COUNT;
  END IF;

  -- 8. Upsert Attendance Records
  IF payload ? 'attendance_records' AND jsonb_array_length(payload->'attendance_records') > 0 THEN
    INSERT INTO public.attendance_records (id, school_id, session_id, student_id, status, remark, created_at)
    SELECT
      (elem->>'id'),
      (elem->>'school_id'),
      (elem->>'session_id'),
      (elem->>'student_id'),
      (elem->>'status'),
      (elem->>'remark'),
      COALESCE((elem->>'created_at')::timestamptz, NOW())
    FROM jsonb_array_elements(payload->'attendance_records') AS elem
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      remark = EXCLUDED.remark;
    GET DIAGNOSTICS v_att_records_count = ROW_COUNT;
  END IF;

  -- 9. Upsert Notices
  IF payload ? 'notices' AND jsonb_array_length(payload->'notices') > 0 THEN
    INSERT INTO public.notices (id, school_id, title, content, audience, priority, status, target_class_id, author_id, author_name, created_at)
    SELECT
      (elem->>'id'),
      (elem->>'school_id'),
      (elem->>'title'),
      (elem->>'content'),
      COALESCE((elem->>'audience'), 'EVERYONE'),
      COALESCE((elem->>'priority'), 'NORMAL'),
      COALESCE((elem->>'status'), 'PUBLISHED'),
      (elem->>'target_class_id'),
      (elem->>'author_id'),
      COALESCE((elem->>'author_name'), 'Administrator'),
      COALESCE((elem->>'created_at')::timestamptz, NOW())
    FROM jsonb_array_elements(payload->'notices') AS elem
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      audience = EXCLUDED.audience,
      priority = EXCLUDED.priority,
      status = EXCLUDED.status;
    GET DIAGNOSTICS v_notices_count = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'counts', jsonb_build_object(
      'schools', v_schools_count,
      'academic_sessions', v_sessions_count,
      'profiles', v_profiles_count,
      'classes', v_classes_count,
      'staff', v_staff_count,
      'students', v_students_count,
      'attendance_sessions', v_att_sessions_count,
      'attendance_records', v_att_records_count,
      'notices', v_notices_count
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Automatic transaction rollback occurs on uncaught exception
  RAISE EXCEPTION 'Atomic sync failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;
