-- ==========================================================
-- SchoolCore: Granular Notification & Relational Linking System
-- Migration: 20260918_parent_family_notifications.sql
-- Supports Child-Centric Relationship Mapping, Scoped Real-Time Channels,
-- Dual-Guardian Synchronization, and Postgres Notice Replication Trigger.
-- ==========================================================

-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------
-- 1. PARENT-STUDENT JUNCTION & FAMILY GROUP MAPPING
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parent_student (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  parent_profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  guardian_type TEXT NOT NULL DEFAULT 'PRIMARY' CHECK (guardian_type IN ('PRIMARY', 'SECONDARY')),
  family_group_id TEXT NOT NULL,
  relationship TEXT DEFAULT 'Parent',
  is_emergency_contact BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(parent_profile_id, student_id)
);

-- Performance Indexes for Relational Mapping & Scoped Subscriptions
CREATE INDEX IF NOT EXISTS idx_parent_student_family_group ON public.parent_student(family_group_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_parent ON public.parent_student(parent_profile_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_student ON public.parent_student(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_school ON public.parent_student(school_id);

-- ----------------------------------------------------------
-- 2. GRANULAR USER NOTIFICATIONS (Personalized In-App Stream)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_group_id TEXT,
  child_id TEXT REFERENCES public.students(id) ON DELETE SET NULL,
  child_name TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'ANNOUNCEMENT' CHECK (category IN ('ACADEMIC', 'ATTENDANCE', 'ANNOUNCEMENT', 'FEE', 'EMERGENCY')),
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  source_notice_id TEXT REFERENCES public.notices(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON public.user_notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_family ON public.user_notifications(family_group_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_child ON public.user_notifications(child_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_school ON public.user_notifications(school_id, created_at DESC);

-- ----------------------------------------------------------
-- 3. NOTIFICATION RETRY QUEUE (Resilience & Zero Data Loss)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_retry_queue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL,
  family_group_id TEXT,
  user_id TEXT,
  payload JSONB NOT NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED')),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retry_queue_status ON public.notification_retry_queue(status, next_retry_at);

-- ----------------------------------------------------------
-- 4. SECURITY HELPER FUNCTION FOR FAMILY GROUPS
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_family_group_ids()
RETURNS TABLE(family_group_id TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ps.family_group_id
  FROM public.parent_student ps
  WHERE ps.parent_profile_id = (SELECT auth.uid())::text;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_family_group_ids() TO authenticated, service_role, anon;

-- ----------------------------------------------------------
-- 5. POSTGRES TRIGGER: REPLICATE NOTICES TO FAMILY GROUPS
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_replicate_notice_to_family()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Replicate to targeted family groups when notice is published
  IF NEW.status = 'PUBLISHED' THEN
    -- Case A: Class-specific notice
    IF NEW.target_class_id IS NOT NULL THEN
      FOR rec IN
        SELECT DISTINCT ps.family_group_id, ps.parent_profile_id, s.id as child_id, (s.first_name || ' ' || s.last_name) as child_name
        FROM public.students s
        JOIN public.parent_student ps ON ps.student_id = s.id
        WHERE s.current_class_id = NEW.target_class_id
          AND s.school_id = NEW.school_id
          AND s.status = 'ACTIVE'
      LOOP
        INSERT INTO public.user_notifications (
          school_id,
          user_id,
          family_group_id,
          child_id,
          child_name,
          title,
          content,
          category,
          priority,
          source_notice_id,
          created_at
        ) VALUES (
          NEW.school_id,
          rec.parent_profile_id,
          rec.family_group_id,
          rec.child_id,
          rec.child_name,
          NEW.title,
          NEW.content,
          'ANNOUNCEMENT',
          NEW.priority,
          NEW.id,
          NOW()
        );
      END LOOP;
    
    -- Case B: General parent or school-wide broadcast
    ELSIF NEW.audience IN ('PARENTS', 'EVERYONE') THEN
      FOR rec IN
        SELECT DISTINCT ps.family_group_id, ps.parent_profile_id, s.id as child_id, (s.first_name || ' ' || s.last_name) as child_name
        FROM public.students s
        JOIN public.parent_student ps ON ps.student_id = s.id
        WHERE s.school_id = NEW.school_id
          AND s.status = 'ACTIVE'
      LOOP
        INSERT INTO public.user_notifications (
          school_id,
          user_id,
          family_group_id,
          child_id,
          child_name,
          title,
          content,
          category,
          priority,
          source_notice_id,
          created_at
        ) VALUES (
          NEW.school_id,
          rec.parent_profile_id,
          rec.family_group_id,
          rec.child_id,
          rec.child_name,
          NEW.title,
          NEW.content,
          'ANNOUNCEMENT',
          NEW.priority,
          NEW.id,
          NOW()
        );
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notice_family_replicate ON public.notices;
CREATE TRIGGER trg_notice_family_replicate
  AFTER INSERT OR UPDATE OF status ON public.notices
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_replicate_notice_to_family();

-- ----------------------------------------------------------
-- 6. ATOMIC TRANSACTION BUNDLE RPC
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_family_notification_bundle(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ps_item JSONB;
  notif_item JSONB;
  inserted_ps INT := 0;
  inserted_notifs INT := 0;
BEGIN
  -- Transaction boundary is implicit in Postgres plpgsql function
  -- 1. Upsert parent_student relations
  IF payload ? 'parent_students' THEN
    FOR ps_item IN SELECT * FROM jsonb_array_elements(payload->'parent_students')
    LOOP
      INSERT INTO public.parent_student (
        id,
        school_id,
        parent_profile_id,
        student_id,
        guardian_type,
        family_group_id,
        relationship,
        is_emergency_contact,
        created_at,
        updated_at
      ) VALUES (
        COALESCE(ps_item->>'id', gen_random_uuid()::text),
        ps_item->>'school_id',
        ps_item->>'parent_profile_id',
        ps_item->>'student_id',
        COALESCE(ps_item->>'guardian_type', 'PRIMARY'),
        ps_item->>'family_group_id',
        COALESCE(ps_item->>'relationship', 'Parent'),
        COALESCE((ps_item->>'is_emergency_contact')::boolean, TRUE),
        COALESCE((ps_item->>'created_at')::timestamptz, NOW()),
        NOW()
      )
      ON CONFLICT (parent_profile_id, student_id) DO UPDATE SET
        guardian_type = EXCLUDED.guardian_type,
        family_group_id = EXCLUDED.family_group_id,
        relationship = EXCLUDED.relationship,
        updated_at = NOW();
      inserted_ps := inserted_ps + 1;
    END LOOP;
  END IF;

  -- 2. Upsert notifications
  IF payload ? 'user_notifications' THEN
    FOR notif_item IN SELECT * FROM jsonb_array_elements(payload->'user_notifications')
    LOOP
      INSERT INTO public.user_notifications (
        id,
        school_id,
        user_id,
        family_group_id,
        child_id,
        child_name,
        title,
        content,
        category,
        priority,
        source_notice_id,
        read_at,
        created_at
      ) VALUES (
        COALESCE(notif_item->>'id', gen_random_uuid()::text),
        notif_item->>'school_id',
        notif_item->>'user_id',
        notif_item->>'family_group_id',
        notif_item->>'child_id',
        notif_item->>'child_name',
        notif_item->>'title',
        notif_item->>'content',
        COALESCE(notif_item->>'category', 'ANNOUNCEMENT'),
        COALESCE(notif_item->>'priority', 'NORMAL'),
        notif_item->>'source_notice_id',
        (notif_item->>'read_at')::timestamptz,
        COALESCE((notif_item->>'created_at')::timestamptz, NOW())
      )
      ON CONFLICT (id) DO UPDATE SET
        read_at = EXCLUDED.read_at;
      inserted_notifs := inserted_notifs + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'parent_students_synced', inserted_ps,
    'user_notifications_synced', inserted_notifs
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_family_notification_bundle(JSONB) TO authenticated, service_role;

-- ----------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------
ALTER TABLE public.parent_student ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_retry_queue ENABLE ROW LEVEL SECURITY;

-- 7.1 parent_student policies
DROP POLICY IF EXISTS "Parents can read their own family group members" ON public.parent_student;
CREATE POLICY "Parents can read their own family group members" ON public.parent_student
  FOR SELECT TO authenticated
  USING (
    parent_profile_id = (SELECT auth.uid())::text
    OR family_group_id IN (SELECT family_group_id FROM public.get_user_family_group_ids())
    OR public.is_school_admin()
  );

DROP POLICY IF EXISTS "Admins can manage parent_student relations" ON public.parent_student;
CREATE POLICY "Admins can manage parent_student relations" ON public.parent_student
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() AND public.is_school_admin())
  WITH CHECK (school_id = public.get_user_school_id() AND public.is_school_admin());

DROP POLICY IF EXISTS "Primary guardians can link co-guardians" ON public.parent_student;
CREATE POLICY "Primary guardians can link co-guardians" ON public.parent_student
  FOR INSERT TO authenticated
  WITH CHECK (
    family_group_id IN (SELECT family_group_id FROM public.get_user_family_group_ids())
  );

-- 7.2 user_notifications policies
DROP POLICY IF EXISTS "Users can read own and family notifications" ON public.user_notifications;
CREATE POLICY "Users can read own and family notifications" ON public.user_notifications
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())::text
    OR family_group_id IN (SELECT family_group_id FROM public.get_user_family_group_ids())
    OR public.is_school_admin()
  );

DROP POLICY IF EXISTS "Users can mark own notifications as read" ON public.user_notifications;
CREATE POLICY "Users can mark own notifications as read" ON public.user_notifications
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())::text
    OR family_group_id IN (SELECT family_group_id FROM public.get_user_family_group_ids())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())::text
    OR family_group_id IN (SELECT family_group_id FROM public.get_user_family_group_ids())
  );

DROP POLICY IF EXISTS "Service role & admins can manage notifications" ON public.user_notifications;
CREATE POLICY "Service role & admins can manage notifications" ON public.user_notifications
  FOR ALL TO authenticated
  USING (public.is_school_admin())
  WITH CHECK (public.is_school_admin());
