--
-- SchoolCore Production Seed Data (Idempotent)
-- Contains School A (Bright Future Secondary School) and School B (Excel Academy International)
--
BEGIN;

-- 1. Schools
INSERT INTO public.schools (id, name, code, phone, email, address, state, country, current_session_id, current_term, created_at, updated_at)
       VALUES ('sch-bright-future-01', 'Bright Future Secondary School', 'BFS-LAGOS', '+234 802 345 6789', 'admin@brightfuture.sch.ng', '14 Unity Road, Ikeja, Lagos State', 'Lagos', 'Nigeria', 'ses-2025-2026', 'FIRST_TERM', '2026-06-18T17:07:02.599Z', '2026-09-16T17:07:02.599Z')
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, phone = EXCLUDED.phone, updated_at = NOW();
INSERT INTO public.schools (id, name, code, phone, email, address, state, country, current_session_id, current_term, created_at, updated_at)
       VALUES ('school-2-excel', 'Excel Academy International', 'EAI-ABUJA', '+234 803 999 8811', 'info@excelacademy.sch.ng', 'Plot 42 Garki District, Abuja FCT', 'FCT Abuja', 'Nigeria', 'ses-excel-2025-2026', 'FIRST_TERM', '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, phone = EXCLUDED.phone, updated_at = NOW();

-- 2. Academic Sessions
INSERT INTO public.academic_sessions (id, school_id, name, start_date, end_date, is_current, created_at)
       VALUES ('ses-2025-2026', 'sch-bright-future-01', '2025/2026 Academic Session', '2025-09-08', '2026-07-24', TRUE, '2026-06-18T17:07:02.599Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.academic_sessions (id, school_id, name, start_date, end_date, is_current, created_at)
       VALUES ('ses-2024-2025', 'sch-bright-future-01', '2024/2025 Academic Session', '2024-09-09', '2025-07-25', FALSE, '2025-08-12T17:07:02.599Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.academic_sessions (id, school_id, name, start_date, end_date, is_current, created_at)
       VALUES ('ses-excel-2025-2026', 'school-2-excel', '2025/2026 Academic Session', '2025-09-08', '2026-07-24', TRUE, '2026-07-18T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;

-- 3. User Profiles
INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, password_hash, created_at)
       VALUES ('usr-admin-01', 'admin@brightfuture.sch.ng', 'Alhaji Ibrahim Danjuma', '+234 803 111 2233', NULL, 'admin123', '2026-06-18T17:07:02.599Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, password_hash, created_at)
       VALUES ('usr-principal-01', 'principal@brightfuture.sch.ng', 'Dr. Amina Bello', '+234 802 555 4433', NULL, 'principal123', '2026-06-23T17:07:02.599Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, password_hash, created_at)
       VALUES ('usr-teacher-01', 'samuel@brightfuture.sch.ng', 'Mr. Samuel Adewale', '+234 805 777 8899', NULL, 'teacher123', '2026-06-28T17:07:02.599Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, password_hash, created_at)
       VALUES ('usr-teacher-02', 'chioma@brightfuture.sch.ng', 'Mrs. Chioma Eze', '+234 809 333 1122', NULL, 'teacher123', '2026-07-03T17:07:02.599Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, password_hash, created_at)
       VALUES ('usr-teacher-03', 'yakubu@brightfuture.sch.ng', 'Mr. Yakubu Mohammed', '+234 810 444 9900', NULL, 'teacher123', '2026-07-08T17:07:02.599Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, password_hash, created_at)
       VALUES ('usr-parent-01', 'ngozi.adeyemi@yahoo.com', 'Mrs. Ngozi Adeyemi', '+234 803 234 5678', NULL, 'parent123', '2026-07-18T17:07:02.599Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, password_hash, created_at)
       VALUES ('usr-bursar-01', 'bursar@brightfuture.sch.ng', 'Mr. Femi Balogun', '+234 802 444 1122', NULL, 'bursar123', '2026-06-23T17:07:02.599Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, password_hash, created_at)
       VALUES ('usr-academic-coord-01', 'academics@brightfuture.sch.ng', 'Mrs. Grace Okafor', '+234 803 765 4321', NULL, 'academic123', '2026-06-23T17:07:02.599Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, password_hash, created_at)
       VALUES ('usr-registrar-01', 'registrar@brightfuture.sch.ng', 'Mrs. Joy Danladi', '+234 805 123 9876', NULL, 'registrar123', '2026-06-23T17:07:02.599Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, password_hash, created_at)
       VALUES ('usr-superadmin-01', 'platform@schoolcore.cloud', 'Engr. Babatunde Sanusi', '+234 802 999 0011', NULL, 'superadmin123', '2026-06-08T17:07:02.599Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, password_hash, created_at)
       VALUES ('usr-excel-admin-01', 'admin@excelacademy.sch.ng', 'Mrs. Folashade Adekunle', '+234 803 777 6655', NULL, 'exceladmin123', '2026-07-18T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, password_hash, created_at)
       VALUES ('usr-excel-teacher-01', 'kabiru@excelacademy.sch.ng', 'Mr. Kabiru Lawal', '+234 802 111 4455', NULL, 'teacher123', '2026-07-28T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;

-- 4. School Users (Tenant Memberships)
INSERT INTO public.school_users (id, school_id, profile_id, role, status, created_at)
       VALUES ('su-admin-01', 'sch-bright-future-01', 'usr-admin-01', 'SCHOOL_ADMIN', 'ACTIVE', '2026-06-18T17:07:02.600Z')
       ON CONFLICT (school_id, profile_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
INSERT INTO public.school_users (id, school_id, profile_id, role, status, created_at)
       VALUES ('su-principal-01', 'sch-bright-future-01', 'usr-principal-01', 'PRINCIPAL', 'ACTIVE', '2026-06-23T17:07:02.600Z')
       ON CONFLICT (school_id, profile_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
INSERT INTO public.school_users (id, school_id, profile_id, role, status, created_at)
       VALUES ('su-teacher-01', 'sch-bright-future-01', 'usr-teacher-01', 'TEACHER', 'ACTIVE', '2026-06-28T17:07:02.600Z')
       ON CONFLICT (school_id, profile_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
INSERT INTO public.school_users (id, school_id, profile_id, role, status, created_at)
       VALUES ('su-teacher-02', 'sch-bright-future-01', 'usr-teacher-02', 'TEACHER', 'ACTIVE', '2026-07-03T17:07:02.600Z')
       ON CONFLICT (school_id, profile_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
INSERT INTO public.school_users (id, school_id, profile_id, role, status, created_at)
       VALUES ('su-teacher-03', 'sch-bright-future-01', 'usr-teacher-03', 'TEACHER', 'ACTIVE', '2026-07-08T17:07:02.600Z')
       ON CONFLICT (school_id, profile_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
INSERT INTO public.school_users (id, school_id, profile_id, role, status, created_at)
       VALUES ('su-parent-01', 'sch-bright-future-01', 'usr-parent-01', 'PARENT', 'ACTIVE', '2026-07-18T17:07:02.600Z')
       ON CONFLICT (school_id, profile_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
INSERT INTO public.school_users (id, school_id, profile_id, role, status, created_at)
       VALUES ('su-bursar-01', 'sch-bright-future-01', 'usr-bursar-01', 'BURSAR', 'ACTIVE', '2026-06-23T17:07:02.600Z')
       ON CONFLICT (school_id, profile_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
INSERT INTO public.school_users (id, school_id, profile_id, role, status, created_at)
       VALUES ('su-academic-01', 'sch-bright-future-01', 'usr-academic-coord-01', 'ACADEMIC_COORDINATOR', 'ACTIVE', '2026-06-23T17:07:02.600Z')
       ON CONFLICT (school_id, profile_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
INSERT INTO public.school_users (id, school_id, profile_id, role, status, created_at)
       VALUES ('su-registrar-01', 'sch-bright-future-01', 'usr-registrar-01', 'REGISTRAR', 'ACTIVE', '2026-06-23T17:07:02.600Z')
       ON CONFLICT (school_id, profile_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
INSERT INTO public.school_users (id, school_id, profile_id, role, status, created_at)
       VALUES ('su-superadmin-01', 'sch-bright-future-01', 'usr-superadmin-01', 'SUPER_ADMIN', 'ACTIVE', '2026-06-08T17:07:02.600Z')
       ON CONFLICT (school_id, profile_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
INSERT INTO public.school_users (id, school_id, profile_id, role, status, created_at)
       VALUES ('su-excel-01', 'school-2-excel', 'usr-excel-admin-01', 'SCHOOL_ADMIN', 'ACTIVE', '2026-07-18T17:07:02.600Z')
       ON CONFLICT (school_id, profile_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
INSERT INTO public.school_users (id, school_id, profile_id, role, status, created_at)
       VALUES ('su-excel-02', 'school-2-excel', 'usr-excel-teacher-01', 'TEACHER', 'ACTIVE', '2026-07-28T17:07:02.600Z')
       ON CONFLICT (school_id, profile_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;

-- 5. Staff Members
INSERT INTO public.staff (id, school_id, profile_id, employee_id, full_name, email, phone, role, assigned_classes, status, created_at)
       VALUES ('stf-01', 'sch-bright-future-01', 'usr-admin-01', 'EMP-BFS-001', 'Alhaji Ibrahim Danjuma', 'admin@brightfuture.sch.ng', '+234 803 111 2233', 'SCHOOL_ADMIN', NULL, 'ACTIVE', '2026-06-18T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, assigned_classes = EXCLUDED.assigned_classes;
INSERT INTO public.staff (id, school_id, profile_id, employee_id, full_name, email, phone, role, assigned_classes, status, created_at)
       VALUES ('stf-02', 'sch-bright-future-01', 'usr-principal-01', 'EMP-BFS-002', 'Dr. Amina Bello', 'principal@brightfuture.sch.ng', '+234 802 555 4433', 'PRINCIPAL', NULL, 'ACTIVE', '2026-06-23T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, assigned_classes = EXCLUDED.assigned_classes;
INSERT INTO public.staff (id, school_id, profile_id, employee_id, full_name, email, phone, role, assigned_classes, status, created_at)
       VALUES ('stf-03', 'sch-bright-future-01', 'usr-teacher-01', 'EMP-BFS-003', 'Mr. Samuel Adewale', 'samuel@brightfuture.sch.ng', '+234 805 777 8899', 'TEACHER', '["cls-jss-2a","cls-ss-1a"]'::jsonb, 'ACTIVE', '2026-06-28T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, assigned_classes = EXCLUDED.assigned_classes;
INSERT INTO public.staff (id, school_id, profile_id, employee_id, full_name, email, phone, role, assigned_classes, status, created_at)
       VALUES ('stf-04', 'sch-bright-future-01', 'usr-teacher-02', 'EMP-BFS-004', 'Mrs. Chioma Eze', 'chioma@brightfuture.sch.ng', '+234 809 333 1122', 'TEACHER', '["cls-jss-1a","cls-ss-3a"]'::jsonb, 'ACTIVE', '2026-07-03T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, assigned_classes = EXCLUDED.assigned_classes;
INSERT INTO public.staff (id, school_id, profile_id, employee_id, full_name, email, phone, role, assigned_classes, status, created_at)
       VALUES ('stf-05', 'sch-bright-future-01', 'usr-teacher-03', 'EMP-BFS-005', 'Mr. Yakubu Mohammed', 'yakubu@brightfuture.sch.ng', '+234 810 444 9900', 'TEACHER', '["cls-jss-3a","cls-ss-2a"]'::jsonb, 'ACTIVE', '2026-07-08T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, assigned_classes = EXCLUDED.assigned_classes;
INSERT INTO public.staff (id, school_id, profile_id, employee_id, full_name, email, phone, role, assigned_classes, status, created_at)
       VALUES ('stf-06', 'sch-bright-future-01', 'usr-bursar-01', 'EMP-BFS-006', 'Mr. Femi Balogun', 'bursar@brightfuture.sch.ng', '+234 802 444 1122', 'BURSAR', NULL, 'ACTIVE', '2026-06-23T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, assigned_classes = EXCLUDED.assigned_classes;
INSERT INTO public.staff (id, school_id, profile_id, employee_id, full_name, email, phone, role, assigned_classes, status, created_at)
       VALUES ('stf-07', 'sch-bright-future-01', 'usr-academic-coord-01', 'EMP-BFS-007', 'Mrs. Grace Okafor', 'academics@brightfuture.sch.ng', '+234 803 765 4321', 'ACADEMIC_COORDINATOR', NULL, 'ACTIVE', '2026-06-23T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, assigned_classes = EXCLUDED.assigned_classes;
INSERT INTO public.staff (id, school_id, profile_id, employee_id, full_name, email, phone, role, assigned_classes, status, created_at)
       VALUES ('stf-08', 'sch-bright-future-01', 'usr-registrar-01', 'EMP-BFS-008', 'Mrs. Joy Danladi', 'registrar@brightfuture.sch.ng', '+234 805 123 9876', 'REGISTRAR', NULL, 'ACTIVE', '2026-06-23T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, assigned_classes = EXCLUDED.assigned_classes;
INSERT INTO public.staff (id, school_id, profile_id, employee_id, full_name, email, phone, role, assigned_classes, status, created_at)
       VALUES ('stf-excel-01', 'school-2-excel', 'usr-excel-admin-01', 'EMP-EAI-001', 'Mrs. Folashade Adekunle', 'admin@excelacademy.sch.ng', '+234 803 777 6655', 'SCHOOL_ADMIN', NULL, 'ACTIVE', '2026-07-18T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, assigned_classes = EXCLUDED.assigned_classes;
INSERT INTO public.staff (id, school_id, profile_id, employee_id, full_name, email, phone, role, assigned_classes, status, created_at)
       VALUES ('stf-excel-02', 'school-2-excel', 'usr-excel-teacher-01', 'EMP-EAI-002', 'Mr. Kabiru Lawal', 'kabiru@excelacademy.sch.ng', '+234 802 111 4455', 'TEACHER', '["cls-excel-01"]'::jsonb, 'ACTIVE', '2026-07-28T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, assigned_classes = EXCLUDED.assigned_classes;

-- 6. Classes
INSERT INTO public.classes (id, school_id, name, level, arm, class_teacher_id, class_teacher_name, capacity, academic_session_id, status, created_at)
       VALUES ('cls-jss-1a', 'sch-bright-future-01', 'JSS 1A', 'JSS 1', 'A', 'stf-04', 'Mrs. Chioma Eze', 45, 'ses-2025-2026', 'ACTIVE', '2026-06-23T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET class_teacher_id = EXCLUDED.class_teacher_id, class_teacher_name = EXCLUDED.class_teacher_name;
INSERT INTO public.classes (id, school_id, name, level, arm, class_teacher_id, class_teacher_name, capacity, academic_session_id, status, created_at)
       VALUES ('cls-jss-2a', 'sch-bright-future-01', 'JSS 2A', 'JSS 2', 'A', 'stf-03', 'Mr. Samuel Adewale', 45, 'ses-2025-2026', 'ACTIVE', '2026-06-23T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET class_teacher_id = EXCLUDED.class_teacher_id, class_teacher_name = EXCLUDED.class_teacher_name;
INSERT INTO public.classes (id, school_id, name, level, arm, class_teacher_id, class_teacher_name, capacity, academic_session_id, status, created_at)
       VALUES ('cls-jss-3a', 'sch-bright-future-01', 'JSS 3A', 'JSS 3', 'A', 'stf-05', 'Mr. Yakubu Mohammed', 40, 'ses-2025-2026', 'ACTIVE', '2026-06-23T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET class_teacher_id = EXCLUDED.class_teacher_id, class_teacher_name = EXCLUDED.class_teacher_name;
INSERT INTO public.classes (id, school_id, name, level, arm, class_teacher_id, class_teacher_name, capacity, academic_session_id, status, created_at)
       VALUES ('cls-ss-1a', 'sch-bright-future-01', 'SS 1 Science', 'SS 1', 'Science', 'stf-03', 'Mr. Samuel Adewale', 40, 'ses-2025-2026', 'ACTIVE', '2026-06-23T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET class_teacher_id = EXCLUDED.class_teacher_id, class_teacher_name = EXCLUDED.class_teacher_name;
INSERT INTO public.classes (id, school_id, name, level, arm, class_teacher_id, class_teacher_name, capacity, academic_session_id, status, created_at)
       VALUES ('cls-ss-2a', 'sch-bright-future-01', 'SS 2 Commercial', 'SS 2', 'Commercial', 'stf-05', 'Mr. Yakubu Mohammed', 40, 'ses-2025-2026', 'ACTIVE', '2026-06-23T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET class_teacher_id = EXCLUDED.class_teacher_id, class_teacher_name = EXCLUDED.class_teacher_name;
INSERT INTO public.classes (id, school_id, name, level, arm, class_teacher_id, class_teacher_name, capacity, academic_session_id, status, created_at)
       VALUES ('cls-ss-3a', 'sch-bright-future-01', 'SS 3 Arts', 'SS 3', 'Arts', 'stf-04', 'Mrs. Chioma Eze', 35, 'ses-2025-2026', 'ACTIVE', '2026-06-23T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET class_teacher_id = EXCLUDED.class_teacher_id, class_teacher_name = EXCLUDED.class_teacher_name;
INSERT INTO public.classes (id, school_id, name, level, arm, class_teacher_id, class_teacher_name, capacity, academic_session_id, status, created_at)
       VALUES ('cls-excel-01', 'school-2-excel', 'SS 2 Emerald', 'SS 2', 'Emerald', 'stf-excel-02', 'Mr. Kabiru Lawal', 35, 'ses-excel-2025-2026', 'ACTIVE', '2026-07-18T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET class_teacher_id = EXCLUDED.class_teacher_id, class_teacher_name = EXCLUDED.class_teacher_name;
INSERT INTO public.classes (id, school_id, name, level, arm, class_teacher_id, class_teacher_name, capacity, academic_session_id, status, created_at)
       VALUES ('cls-excel-02', 'school-2-excel', 'JSS 1 Topaz', 'JSS 1', 'Topaz', NULL, NULL, 40, 'ses-excel-2025-2026', 'ACTIVE', '2026-07-18T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET class_teacher_id = EXCLUDED.class_teacher_id, class_teacher_name = EXCLUDED.class_teacher_name;

-- 7. Subjects
INSERT INTO public.subjects (id, school_id, name, code, category, created_at)
       VALUES ('sub-01', 'sch-bright-future-01', 'Mathematics', 'MTH', 'CORE', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, school_id, name, code, category, created_at)
       VALUES ('sub-02', 'sch-bright-future-01', 'English Language', 'ENG', 'CORE', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, school_id, name, code, category, created_at)
       VALUES ('sub-03', 'sch-bright-future-01', 'Basic Science', 'BSC', 'CORE', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, school_id, name, code, category, created_at)
       VALUES ('sub-04', 'sch-bright-future-01', 'Physics', 'PHY', 'ELECTIVE', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, school_id, name, code, category, created_at)
       VALUES ('sub-05', 'sch-bright-future-01', 'Chemistry', 'CHM', 'ELECTIVE', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, school_id, name, code, category, created_at)
       VALUES ('sub-06', 'sch-bright-future-01', 'Biology', 'BIO', 'ELECTIVE', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, school_id, name, code, category, created_at)
       VALUES ('sub-07', 'sch-bright-future-01', 'Economics', 'ECO', 'ELECTIVE', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, school_id, name, code, category, created_at)
       VALUES ('sub-08', 'sch-bright-future-01', 'Civic Education', 'CVE', 'CORE', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, school_id, name, code, category, created_at)
       VALUES ('sub-09', 'sch-bright-future-01', 'Literature in English', 'LIT', 'ELECTIVE', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, school_id, name, code, category, created_at)
       VALUES ('sub-excel-01', 'school-2-excel', 'Physics', 'PHY', 'ELECTIVE', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, school_id, name, code, category, created_at)
       VALUES ('sub-excel-02', 'school-2-excel', 'Chemistry', 'CHM', 'ELECTIVE', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, school_id, name, code, category, created_at)
       VALUES ('sub-excel-03', 'school-2-excel', 'Mathematics', 'MTH', 'CORE', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, school_id, name, code, category, created_at)
       VALUES ('sub-excel-04', 'school-2-excel', 'English Language', 'ENG', 'CORE', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;

-- 8. Students
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-01', 'sch-bright-future-01', 'Tunde', 'Oluwaseun', 'Adeyemi', 'MALE', '2012-05-14', 'BFS/2024/042', 'cls-jss-2a', 'Red House (Falcon)', 'Engr. Babatunde Adeyemi', '+234 803 234 5678', 'b.adeyemi@yahoo.com', 'Father', 'Block 4, Flat 2, LSDPC Estate, Ogba, Lagos', '2024-09-10', 'ACTIVE', 'Active member of the Junior STEM & Robotics club.', '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-02', 'sch-bright-future-01', 'Fatima', 'Zahra', 'Abubakar', 'FEMALE', '2012-08-22', 'BFS/2024/043', 'cls-jss-2a', 'Blue House (Eagle)', 'Hajiya Maryam Abubakar', '+234 802 987 6543', 'm.abubakar@gmail.com', 'Mother', '22 Adeniyi Jones Avenue, Ikeja, Lagos', '2024-09-10', 'ACTIVE', 'Class Representative. Excellent in Mental Mathematics.', '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-03', 'sch-bright-future-01', 'Chinedu', 'Paul', 'Okonkwo', 'MALE', '2012-03-10', 'BFS/2024/044', 'cls-jss-2a', 'Green House (Cheetah)', 'Mr. Emmanuel Okonkwo', '+234 805 123 4455', NULL, 'Father', '7 Obafemi Awolowo Way, Ikeja, Lagos', '2024-09-10', 'ACTIVE', NULL, '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-04', 'sch-bright-future-01', 'Blessing', 'Ngozi', 'Eze', 'FEMALE', '2012-11-05', 'BFS/2024/045', 'cls-jss-2a', 'Yellow House (Lion)', 'Mrs. Victoria Eze', '+234 809 888 7766', 'v.eze@gmail.com', 'Mother', '15 Allen Avenue, Ikeja, Lagos', '2024-09-10', 'ACTIVE', NULL, '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-05', 'sch-bright-future-01', 'Kareem', 'Ayomide', 'Balogun', 'MALE', '2012-07-19', 'BFS/2024/046', 'cls-jss-2a', 'Red House (Falcon)', 'Alhaji Rasaq Balogun', '+234 818 234 1122', NULL, 'Father', '3 Toyin Street, Ikeja, Lagos', '2024-09-10', 'ACTIVE', NULL, '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-06', 'sch-bright-future-01', 'Aisha', 'Bilikisu', 'Usman', 'FEMALE', '2012-01-30', 'BFS/2024/047', 'cls-jss-2a', 'Blue House (Eagle)', 'Malam Garba Usman', '+234 803 765 4321', NULL, 'Father', '11 Kodesho Street, Ikeja, Lagos', '2024-09-10', 'ACTIVE', NULL, '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-07', 'sch-bright-future-01', 'Emeka', 'David', 'Nwachukwu', 'MALE', '2012-09-12', 'BFS/2024/048', 'cls-jss-2a', 'Green House (Cheetah)', 'Dr. (Mrs) Joy Nwachukwu', '+234 802 445 6677', NULL, 'Mother', '8 Aromire Avenue, Ikeja, Lagos', '2024-09-10', 'ACTIVE', NULL, '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-08', 'sch-bright-future-01', 'Grace', 'Oluwakemi', 'Akinola', 'FEMALE', '2012-04-18', 'BFS/2024/049', 'cls-jss-2a', 'Yellow House (Lion)', 'Pastor Peter Akinola', '+234 806 333 9988', NULL, 'Father', '19 Opebi Road, Ikeja, Lagos', '2024-09-10', 'ACTIVE', NULL, '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-09', 'sch-bright-future-01', 'Farouk', 'Ahmed', 'Suleiman', 'MALE', '2010-06-15', 'BFS/2023/018', 'cls-ss-1a', 'Red House (Falcon)', 'Alhaji Suleiman Farouk', '+234 803 999 1100', NULL, 'Father', '10 Mobolaji Bank Anthony Way, Maryland, Lagos', '2023-09-11', 'ACTIVE', 'Aspiring Mechanical Engineer.', '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-10', 'sch-bright-future-01', 'Oluwatomisin', 'Deborah', 'Ogunleye', 'FEMALE', '2010-12-02', 'BFS/2023/019', 'cls-ss-1a', 'Blue House (Eagle)', 'Mrs. Folashade Ogunleye', '+234 802 112 3344', NULL, 'Mother', '5 Oregun Road, Ikeja, Lagos', '2023-09-11', 'ACTIVE', NULL, '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-11', 'sch-bright-future-01', 'Ikechukwu', 'Francis', 'Obi', 'MALE', '2010-02-28', 'BFS/2023/020', 'cls-ss-1a', 'Green House (Cheetah)', 'Chief Kenneth Obi', '+234 805 776 5544', NULL, 'Father', '29 Agidingbi Road, Ikeja, Lagos', '2023-09-11', 'ACTIVE', NULL, '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-12', 'sch-bright-future-01', 'Zainab', 'Hauwa', 'Danjuma', 'FEMALE', '2010-09-14', 'BFS/2023/021', 'cls-ss-1a', 'Yellow House (Lion)', 'Dr. Danjuma Ibrahim', '+234 807 889 9001', NULL, 'Father', '14 Unity Road, Ikeja, Lagos', '2023-09-11', 'ACTIVE', NULL, '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-13', 'sch-bright-future-01', 'Damilola', 'Victor', 'Ajayi', 'MALE', '2010-04-09', 'BFS/2023/022', 'cls-ss-1a', 'Red House (Falcon)', 'Mr. Olumide Ajayi', '+234 812 345 6780', NULL, 'Father', '12 Medical Road, Ikeja, Lagos', '2023-09-11', 'ACTIVE', NULL, '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-14', 'sch-bright-future-01', 'Chidimma', 'Ruth', 'Mbah', 'FEMALE', '2010-10-31', 'BFS/2023/023', 'cls-ss-1a', 'Blue House (Eagle)', 'Mrs. Angela Mbah', '+234 809 112 2334', NULL, 'Mother', '34 Awolowo Way, Ikeja, Lagos', '2023-09-11', 'ACTIVE', NULL, '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-15', 'sch-bright-future-01', 'Tobi', 'Joseph', 'Adegoke', 'MALE', '2013-02-14', 'BFS/2025/001', 'cls-jss-1a', 'Green House (Cheetah)', 'Mr. Joseph Adegoke', '+234 803 554 4332', NULL, 'Father', '6 Oba Akran Avenue, Ikeja, Lagos', '2025-09-08', 'ACTIVE', NULL, '2026-08-17T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-16', 'sch-bright-future-01', 'Maryam', 'Khadijah', 'Lawal', 'FEMALE', '2013-05-19', 'BFS/2025/002', 'cls-jss-1a', 'Red House (Falcon)', 'Hajiya Binta Lawal', '+234 802 667 8899', NULL, 'Mother', '18 Kudirat Abiola Way, Oregun, Lagos', '2025-09-08', 'ACTIVE', NULL, '2026-08-17T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-excel-01', 'school-2-excel', 'Zainab', 'Halima', 'Bello', 'FEMALE', '2010-04-12', 'EAI/2025/101', 'cls-excel-01', 'Emerald House', 'Engr. Mahmud Bello', '+234 803 222 1199', 'm.bello@gmail.com', 'Father', '24 Crescent, Maitama, Abuja', '2025-09-08', 'ACTIVE', NULL, '2026-09-16T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-excel-02', 'school-2-excel', 'Kalu', '', 'Umeh', 'MALE', '2010-08-20', 'EAI/2025/102', 'cls-excel-01', 'Diamond House', 'Mrs. Ngozi Umeh', '+234 802 888 3344', 'n.umeh@yahoo.com', 'Mother', '10 Aminu Kano Crescent, Wuse II, Abuja', '2025-09-08', 'ACTIVE', NULL, '2026-09-16T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();
INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES ('stu-excel-03', 'school-2-excel', 'Maryam', 'Sani', 'Aliyu', 'FEMALE', '2013-01-15', 'EAI/2025/103', 'cls-excel-02', 'Topaz House', 'Alhaji Sani Aliyu', '+234 805 444 6677', 'sani.aliyu@abuja.gov.ng', 'Father', '5 Asokoro Drive, Abuja', '2025-09-08', 'ACTIVE', NULL, '2026-09-16T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();

-- 9. Attendance Sessions
INSERT INTO public.attendance_sessions (id, school_id, class_id, date, session_type, marked_by_id, marked_by_name, present_count, absent_count, late_count, created_at, updated_at)
       VALUES ('att-ses-01', 'sch-bright-future-01', 'cls-jss-2a', '2026-09-15', 'MORNING', 'usr-teacher-01', 'Mr. Samuel Adewale', 7, 1, 0, '2026-09-15T17:07:02.600Z', '2026-09-15T17:07:02.600Z')
       ON CONFLICT (school_id, class_id, date, session_type) DO UPDATE SET present_count = EXCLUDED.present_count, absent_count = EXCLUDED.absent_count, late_count = EXCLUDED.late_count;

-- 10. Attendance Records
INSERT INTO public.attendance_records (id, session_id, student_id, status, remark, created_at)
       VALUES ('att-rec-01', 'att-ses-01', 'stu-01', 'PRESENT', NULL, '2026-09-16T17:07:02.600Z')
       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, remark = EXCLUDED.remark;
INSERT INTO public.attendance_records (id, session_id, student_id, status, remark, created_at)
       VALUES ('att-rec-02', 'att-ses-01', 'stu-02', 'PRESENT', NULL, '2026-09-16T17:07:02.600Z')
       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, remark = EXCLUDED.remark;
INSERT INTO public.attendance_records (id, session_id, student_id, status, remark, created_at)
       VALUES ('att-rec-03', 'att-ses-01', 'stu-03', 'PRESENT', NULL, '2026-09-16T17:07:02.600Z')
       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, remark = EXCLUDED.remark;
INSERT INTO public.attendance_records (id, session_id, student_id, status, remark, created_at)
       VALUES ('att-rec-04', 'att-ses-01', 'stu-04', 'ABSENT', 'Parent notified of illness', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, remark = EXCLUDED.remark;
INSERT INTO public.attendance_records (id, session_id, student_id, status, remark, created_at)
       VALUES ('att-rec-05', 'att-ses-01', 'stu-05', 'PRESENT', NULL, '2026-09-16T17:07:02.600Z')
       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, remark = EXCLUDED.remark;
INSERT INTO public.attendance_records (id, session_id, student_id, status, remark, created_at)
       VALUES ('att-rec-06', 'att-ses-01', 'stu-06', 'PRESENT', NULL, '2026-09-16T17:07:02.600Z')
       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, remark = EXCLUDED.remark;
INSERT INTO public.attendance_records (id, session_id, student_id, status, remark, created_at)
       VALUES ('att-rec-07', 'att-ses-01', 'stu-07', 'PRESENT', NULL, '2026-09-16T17:07:02.600Z')
       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, remark = EXCLUDED.remark;
INSERT INTO public.attendance_records (id, session_id, student_id, status, remark, created_at)
       VALUES ('att-rec-08', 'att-ses-01', 'stu-08', 'PRESENT', NULL, '2026-09-16T17:07:02.600Z')
       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, remark = EXCLUDED.remark;

-- 11. Notices
INSERT INTO public.notices (id, school_id, author_id, author_name, title, message, audience, priority, status, published_at, expires_at, created_at)
       VALUES ('not-01', 'sch-bright-future-01', 'usr-admin-01', 'Alhaji Ibrahim Danjuma', 'Mandatory Staff Briefing & Academic Review', 'All teaching and administrative staff are requested to assemble in the main conference hall this Friday by 2:00 PM promptly. We will review curriculum milestone submissions and upcoming midterm evaluations.', 'TEACHERS', 'HIGH', 'PUBLISHED', '2026-09-14T17:07:02.600Z', NULL, '2026-09-14T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, message = EXCLUDED.message, status = EXCLUDED.status;
INSERT INTO public.notices (id, school_id, author_id, author_name, title, message, audience, priority, status, published_at, expires_at, created_at)
       VALUES ('not-02', 'sch-bright-future-01', 'usr-principal-01', 'Dr. Amina Bello', 'Inter-House Athletic & Sports Competition 2026', 'House masters and mistresses are advised to complete student registrations across track and field events before the end of next week. Practice sessions will commence after school hours on Tuesdays and Thursdays.', 'EVERYONE', 'NORMAL', 'PUBLISHED', '2026-09-11T17:07:02.600Z', NULL, '2026-09-11T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, message = EXCLUDED.message, status = EXCLUDED.status;
INSERT INTO public.notices (id, school_id, author_id, author_name, title, message, audience, priority, status, published_at, expires_at, created_at)
       VALUES ('not-03', 'sch-bright-future-01', 'usr-admin-01', 'Alhaji Ibrahim Danjuma', 'First Term Midterm Break Schedule Notice', 'The school will observe the official First Term midterm break starting next Thursday. Classes will resume normally the following Tuesday. All class teachers must ensure all daily attendance logs are submitted prior to departure.', 'EVERYONE', 'NORMAL', 'PUBLISHED', '2026-09-06T17:07:02.600Z', NULL, '2026-09-06T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, message = EXCLUDED.message, status = EXCLUDED.status;
INSERT INTO public.notices (id, school_id, author_id, author_name, title, message, audience, priority, status, published_at, expires_at, created_at)
       VALUES ('not-excel-01', 'school-2-excel', 'usr-excel-admin-01', 'Mrs. Folashade Adekunle', 'National Robotics & STEM Championship 2026', 'Students selected for the STEM robotics team should report to the Science Lab every Wednesday at 3:30 PM for tournament rehearsals.', 'EVERYONE', 'HIGH', 'PUBLISHED', '2026-09-13T17:07:02.600Z', NULL, '2026-09-13T17:07:02.600Z')
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, message = EXCLUDED.message, status = EXCLUDED.status;

-- 12. School Settings
INSERT INTO public.school_settings (id, school_id, academic_year_label, grading_system, school_motto, auto_generate_admission_numbers, default_student_status, created_at, updated_at)
       VALUES ('set-01', 'sch-bright-future-01', '2025/2026', 'STANDARD', 'Excellence, Integrity, and Service', TRUE, 'ACTIVE', '2026-06-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id) DO UPDATE SET academic_year_label = EXCLUDED.academic_year_label, grading_system = EXCLUDED.grading_system, updated_at = NOW();
INSERT INTO public.school_settings (id, school_id, academic_year_label, grading_system, school_motto, auto_generate_admission_numbers, default_student_status, created_at, updated_at)
       VALUES ('set-excel-01', 'school-2-excel', '2025/2026', 'STANDARD', 'Leadership through Knowledge and Innovation', TRUE, 'ACTIVE', '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id) DO UPDATE SET academic_year_label = EXCLUDED.academic_year_label, grading_system = EXCLUDED.grading_system, updated_at = NOW();

-- 13. Audit Logs
INSERT INTO public.audit_logs (id, school_id, actor_id, actor_name, actor_role, action, entity, entity_id, details, created_at)
       VALUES ('aud-01', 'sch-bright-future-01', 'usr-admin-01', 'Alhaji Ibrahim Danjuma', 'SCHOOL_ADMIN', 'SYSTEM_INITIALIZED', 'School', 'sch-bright-future-01', 'SchoolCore instance initialized for Bright Future Secondary School.', '2026-06-18T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, school_id, actor_id, actor_name, actor_role, action, entity, entity_id, details, created_at)
       VALUES ('aud-02', 'sch-bright-future-01', 'usr-teacher-01', 'Mr. Samuel Adewale', 'TEACHER', 'ATTENDANCE_SUBMITTED', 'AttendanceSession', 'att-ses-01', 'Submitted morning attendance for JSS 2A (7 Present, 1 Absent, 0 Late).', '2026-09-15T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, school_id, actor_id, actor_name, actor_role, action, entity, entity_id, details, created_at)
       VALUES ('aud-03', 'sch-bright-future-01', 'usr-admin-01', 'Alhaji Ibrahim Danjuma', 'SCHOOL_ADMIN', 'NOTICE_PUBLISHED', 'Notice', 'not-01', 'Published notice: Mandatory Staff Briefing & Academic Review.', '2026-09-14T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, school_id, actor_id, actor_name, actor_role, action, entity, entity_id, details, created_at)
       VALUES ('aud-excel-01', 'school-2-excel', 'usr-excel-admin-01', 'Mrs. Folashade Adekunle', 'SCHOOL_ADMIN', 'SYSTEM_INITIALIZED', 'School', 'school-2-excel', 'SchoolCore instance initialized for Excel Academy International.', '2026-07-18T17:07:02.600Z')
       ON CONFLICT (id) DO NOTHING;

-- 14. Academic Configs (Phase 2)
INSERT INTO public.academic_configs (id, school_id, ca1_max, ca2_max, ca3_max, exam_max, grading_scale, remark_templates, created_at, updated_at)
       VALUES ('cfg-sch-bright-future-01', 'sch-bright-future-01', 10, 10, 20, 60, '[{"id":"grd-a","grade":"A","min_score":75,"max_score":100,"remark":"Excellent","gpa_point":5},{"id":"grd-b","grade":"B","min_score":65,"max_score":74,"remark":"Very Good","gpa_point":4},{"id":"grd-c","grade":"C","min_score":50,"max_score":64,"remark":"Credit","gpa_point":3},{"id":"grd-d","grade":"D","min_score":45,"max_score":49,"remark":"Pass","gpa_point":2},{"id":"grd-e","grade":"E","min_score":40,"max_score":44,"remark":"Fair Pass","gpa_point":1},{"id":"grd-f","grade":"F","min_score":0,"max_score":39,"remark":"Fail","gpa_point":0}]'::jsonb, '{}'::jsonb, '2026-06-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id) DO UPDATE SET grading_scale = EXCLUDED.grading_scale, updated_at = NOW();
INSERT INTO public.academic_configs (id, school_id, ca1_max, ca2_max, ca3_max, exam_max, grading_scale, remark_templates, created_at, updated_at)
       VALUES ('cfg-school-2-excel', 'school-2-excel', 10, 10, 20, 60, '[{"id":"grd-a","grade":"A","min_score":75,"max_score":100,"remark":"Distinction","gpa_point":5},{"id":"grd-b","grade":"B","min_score":65,"max_score":74,"remark":"Credit","gpa_point":4},{"id":"grd-c","grade":"C","min_score":50,"max_score":64,"remark":"Merit","gpa_point":3},{"id":"grd-d","grade":"D","min_score":40,"max_score":49,"remark":"Pass","gpa_point":2},{"id":"grd-f","grade":"F","min_score":0,"max_score":39,"remark":"Fail","gpa_point":0}]'::jsonb, '{}'::jsonb, '2026-07-18T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id) DO UPDATE SET grading_scale = EXCLUDED.grading_scale, updated_at = NOW();

-- 15. Teacher Subject Assignments
INSERT INTO public.teacher_subject_assignments (id, school_id, teacher_id, teacher_name, class_id, class_name, subject_id, subject_name, academic_session_id, created_at)
       VALUES ('tsa-01', 'sch-bright-future-01', 'stf-03', 'Mr. Samuel Adewale', 'cls-jss-2a', 'JSS 2A', 'sub-01', 'Mathematics', 'ses-2025-2026', '2026-07-18T17:07:02.600Z')
       ON CONFLICT (school_id, teacher_id, class_id, subject_id, academic_session_id) DO NOTHING;
INSERT INTO public.teacher_subject_assignments (id, school_id, teacher_id, teacher_name, class_id, class_name, subject_id, subject_name, academic_session_id, created_at)
       VALUES ('tsa-02', 'sch-bright-future-01', 'stf-03', 'Mr. Samuel Adewale', 'cls-ss-1a', 'SS 1A', 'sub-01', 'Mathematics', 'ses-2025-2026', '2026-07-18T17:07:02.600Z')
       ON CONFLICT (school_id, teacher_id, class_id, subject_id, academic_session_id) DO NOTHING;
INSERT INTO public.teacher_subject_assignments (id, school_id, teacher_id, teacher_name, class_id, class_name, subject_id, subject_name, academic_session_id, created_at)
       VALUES ('tsa-03', 'sch-bright-future-01', 'stf-04', 'Mrs. Chioma Eze', 'cls-jss-1a', 'JSS 1A', 'sub-02', 'English Language', 'ses-2025-2026', '2026-07-18T17:07:02.600Z')
       ON CONFLICT (school_id, teacher_id, class_id, subject_id, academic_session_id) DO NOTHING;
INSERT INTO public.teacher_subject_assignments (id, school_id, teacher_id, teacher_name, class_id, class_name, subject_id, subject_name, academic_session_id, created_at)
       VALUES ('tsa-04', 'sch-bright-future-01', 'stf-04', 'Mrs. Chioma Eze', 'cls-jss-2a', 'JSS 2A', 'sub-02', 'English Language', 'ses-2025-2026', '2026-07-18T17:07:02.600Z')
       ON CONFLICT (school_id, teacher_id, class_id, subject_id, academic_session_id) DO NOTHING;
INSERT INTO public.teacher_subject_assignments (id, school_id, teacher_id, teacher_name, class_id, class_name, subject_id, subject_name, academic_session_id, created_at)
       VALUES ('tsa-05', 'sch-bright-future-01', 'stf-05', 'Mr. Yakubu Mohammed', 'cls-jss-2a', 'JSS 2A', 'sub-03', 'Basic Science', 'ses-2025-2026', '2026-07-18T17:07:02.600Z')
       ON CONFLICT (school_id, teacher_id, class_id, subject_id, academic_session_id) DO NOTHING;
INSERT INTO public.teacher_subject_assignments (id, school_id, teacher_id, teacher_name, class_id, class_name, subject_id, subject_name, academic_session_id, created_at)
       VALUES ('tsa-06', 'sch-bright-future-01', 'stf-05', 'Mr. Yakubu Mohammed', 'cls-ss-1a', 'SS 1A', 'sub-04', 'Physics', 'ses-2025-2026', '2026-07-18T17:07:02.600Z')
       ON CONFLICT (school_id, teacher_id, class_id, subject_id, academic_session_id) DO NOTHING;

-- 16. Subject Results
INSERT INTO public.subject_results (id, school_id, student_id, class_id, subject_id, academic_session_id, term, ca1_score, ca2_score, ca3_score, exam_score, total_score, grade, remark, teacher_subject_remark, status, entered_by_id, entered_by_name, created_at, updated_at)
       VALUES ('res-01', 'sch-bright-future-01', 'stu-01', 'cls-jss-2a', 'sub-01', 'ses-2025-2026', 'FIRST_TERM', 9, 9, 18, 52, 88, 'A', 'Excellent', 'Outstanding grasp of algebraic concepts.', 'PUBLISHED', 'stf-03', 'Mr. Samuel Adewale', '2026-08-27T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, student_id, subject_id, academic_session_id, term) DO UPDATE SET total_score = EXCLUDED.total_score, grade = EXCLUDED.grade, status = EXCLUDED.status;
INSERT INTO public.subject_results (id, school_id, student_id, class_id, subject_id, academic_session_id, term, ca1_score, ca2_score, ca3_score, exam_score, total_score, grade, remark, teacher_subject_remark, status, entered_by_id, entered_by_name, created_at, updated_at)
       VALUES ('res-02', 'sch-bright-future-01', 'stu-01', 'cls-jss-2a', 'sub-02', 'ses-2025-2026', 'FIRST_TERM', 8, 8, 16, 48, 80, 'A', 'Excellent', 'Expressive writing and strong essay structure.', 'PUBLISHED', 'stf-04', 'Mrs. Chioma Eze', '2026-08-27T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, student_id, subject_id, academic_session_id, term) DO UPDATE SET total_score = EXCLUDED.total_score, grade = EXCLUDED.grade, status = EXCLUDED.status;
INSERT INTO public.subject_results (id, school_id, student_id, class_id, subject_id, academic_session_id, term, ca1_score, ca2_score, ca3_score, exam_score, total_score, grade, remark, teacher_subject_remark, status, entered_by_id, entered_by_name, created_at, updated_at)
       VALUES ('res-03', 'sch-bright-future-01', 'stu-01', 'cls-jss-2a', 'sub-03', 'ses-2025-2026', 'FIRST_TERM', 8, 8, 17, 51, 84, 'A', 'Excellent', 'Excels in laboratory experiments and practicals.', 'PUBLISHED', 'stf-05', 'Mr. Yakubu Mohammed', '2026-08-27T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, student_id, subject_id, academic_session_id, term) DO UPDATE SET total_score = EXCLUDED.total_score, grade = EXCLUDED.grade, status = EXCLUDED.status;
INSERT INTO public.subject_results (id, school_id, student_id, class_id, subject_id, academic_session_id, term, ca1_score, ca2_score, ca3_score, exam_score, total_score, grade, remark, teacher_subject_remark, status, entered_by_id, entered_by_name, created_at, updated_at)
       VALUES ('res-04', 'sch-bright-future-01', 'stu-02', 'cls-jss-2a', 'sub-01', 'ses-2025-2026', 'FIRST_TERM', 10, 10, 19, 55, 94, 'A', 'Excellent', 'Top scorer in class tests; remarkable precision.', 'PUBLISHED', 'stf-03', 'Mr. Samuel Adewale', '2026-09-01T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, student_id, subject_id, academic_session_id, term) DO UPDATE SET total_score = EXCLUDED.total_score, grade = EXCLUDED.grade, status = EXCLUDED.status;
INSERT INTO public.subject_results (id, school_id, student_id, class_id, subject_id, academic_session_id, term, ca1_score, ca2_score, ca3_score, exam_score, total_score, grade, remark, teacher_subject_remark, status, entered_by_id, entered_by_name, created_at, updated_at)
       VALUES ('res-05', 'sch-bright-future-01', 'stu-02', 'cls-jss-2a', 'sub-02', 'ses-2025-2026', 'FIRST_TERM', 9, 9, 18, 53, 89, 'A', 'Excellent', 'Brilliant grammar and eloquent spoken diction.', 'PUBLISHED', 'stf-04', 'Mrs. Chioma Eze', '2026-09-01T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, student_id, subject_id, academic_session_id, term) DO UPDATE SET total_score = EXCLUDED.total_score, grade = EXCLUDED.grade, status = EXCLUDED.status;
INSERT INTO public.subject_results (id, school_id, student_id, class_id, subject_id, academic_session_id, term, ca1_score, ca2_score, ca3_score, exam_score, total_score, grade, remark, teacher_subject_remark, status, entered_by_id, entered_by_name, created_at, updated_at)
       VALUES ('res-06', 'sch-bright-future-01', 'stu-02', 'cls-jss-2a', 'sub-03', 'ses-2025-2026', 'FIRST_TERM', 9, 9, 19, 54, 91, 'A', 'Excellent', 'Thorough scientific understanding.', 'PUBLISHED', 'stf-05', 'Mr. Yakubu Mohammed', '2026-09-01T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, student_id, subject_id, academic_session_id, term) DO UPDATE SET total_score = EXCLUDED.total_score, grade = EXCLUDED.grade, status = EXCLUDED.status;
INSERT INTO public.subject_results (id, school_id, student_id, class_id, subject_id, academic_session_id, term, ca1_score, ca2_score, ca3_score, exam_score, total_score, grade, remark, teacher_subject_remark, status, entered_by_id, entered_by_name, created_at, updated_at)
       VALUES ('res-07', 'sch-bright-future-01', 'stu-03', 'cls-jss-2a', 'sub-01', 'ses-2025-2026', 'FIRST_TERM', 7, 7, 14, 44, 72, 'B', 'Very Good', 'Shows steady improvement. Capable of higher scores.', 'PUBLISHED', 'stf-03', 'Mr. Samuel Adewale', '2026-09-01T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, student_id, subject_id, academic_session_id, term) DO UPDATE SET total_score = EXCLUDED.total_score, grade = EXCLUDED.grade, status = EXCLUDED.status;
INSERT INTO public.subject_results (id, school_id, student_id, class_id, subject_id, academic_session_id, term, ca1_score, ca2_score, ca3_score, exam_score, total_score, grade, remark, teacher_subject_remark, status, entered_by_id, entered_by_name, created_at, updated_at)
       VALUES ('res-08', 'sch-bright-future-01', 'stu-03', 'cls-jss-2a', 'sub-02', 'ses-2025-2026', 'FIRST_TERM', 7, 8, 15, 45, 75, 'B', 'Very Good', 'Good vocabulary; practice reading comprehension.', 'PUBLISHED', 'stf-04', 'Mrs. Chioma Eze', '2026-09-01T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, student_id, subject_id, academic_session_id, term) DO UPDATE SET total_score = EXCLUDED.total_score, grade = EXCLUDED.grade, status = EXCLUDED.status;
INSERT INTO public.subject_results (id, school_id, student_id, class_id, subject_id, academic_session_id, term, ca1_score, ca2_score, ca3_score, exam_score, total_score, grade, remark, teacher_subject_remark, status, entered_by_id, entered_by_name, created_at, updated_at)
       VALUES ('res-09', 'sch-bright-future-01', 'stu-04', 'cls-jss-2a', 'sub-01', 'ses-2025-2026', 'FIRST_TERM', 8, 8, 16, 46, 78, 'A', 'Excellent', 'Hardworking and very focused student.', 'PUBLISHED', 'stf-03', 'Mr. Samuel Adewale', '2026-09-01T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, student_id, subject_id, academic_session_id, term) DO UPDATE SET total_score = EXCLUDED.total_score, grade = EXCLUDED.grade, status = EXCLUDED.status;
INSERT INTO public.subject_results (id, school_id, student_id, class_id, subject_id, academic_session_id, term, ca1_score, ca2_score, ca3_score, exam_score, total_score, grade, remark, teacher_subject_remark, status, entered_by_id, entered_by_name, created_at, updated_at)
       VALUES ('res-10', 'sch-bright-future-01', 'stu-04', 'cls-jss-2a', 'sub-02', 'ses-2025-2026', 'FIRST_TERM', 8, 9, 17, 49, 83, 'A', 'Excellent', 'Creative storytelling and neat handwriting.', 'PUBLISHED', 'stf-04', 'Mrs. Chioma Eze', '2026-09-01T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, student_id, subject_id, academic_session_id, term) DO UPDATE SET total_score = EXCLUDED.total_score, grade = EXCLUDED.grade, status = EXCLUDED.status;

-- 17. Student Term Remarks
INSERT INTO public.student_term_remarks (id, school_id, student_id, academic_session_id, term, form_teacher_remark, form_teacher_id, principal_remark, principal_id, next_term_fees, next_term_resumption_date, created_at, updated_at)
       VALUES ('rem-01', 'sch-bright-future-01', 'stu-02', 'ses-2025-2026', 'FIRST_TERM', 'An extraordinary performance. Fatima consistently models academic excellence and leadership in JSS 2A.', NULL, 'Outstanding terminal result! Maintain this exemplary standard and conduct.', NULL, NULL, 'January 12, 2026', '2026-09-16T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, student_id, academic_session_id, term) DO UPDATE SET form_teacher_remark = EXCLUDED.form_teacher_remark, principal_remark = EXCLUDED.principal_remark;
INSERT INTO public.student_term_remarks (id, school_id, student_id, academic_session_id, term, form_teacher_remark, form_teacher_id, principal_remark, principal_id, next_term_fees, next_term_resumption_date, created_at, updated_at)
       VALUES ('rem-02', 'sch-bright-future-01', 'stu-01', 'ses-2025-2026', 'FIRST_TERM', 'Tunde has performed excellently across STEM and humanities. Highly disciplined in class.', NULL, 'Very commendable work this term. Keep aiming for the very top.', NULL, NULL, 'January 12, 2026', '2026-09-16T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, student_id, academic_session_id, term) DO UPDATE SET form_teacher_remark = EXCLUDED.form_teacher_remark, principal_remark = EXCLUDED.principal_remark;
INSERT INTO public.student_term_remarks (id, school_id, student_id, academic_session_id, term, form_teacher_remark, form_teacher_id, principal_remark, principal_id, next_term_fees, next_term_resumption_date, created_at, updated_at)
       VALUES ('rem-03', 'sch-bright-future-01', 'stu-03', 'ses-2025-2026', 'FIRST_TERM', 'Chinedu has made commendable progress this term. Regular study habits will bring even higher distinction.', NULL, 'Good and solid terminal performance. Well done.', NULL, NULL, 'January 12, 2026', '2026-09-16T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, student_id, academic_session_id, term) DO UPDATE SET form_teacher_remark = EXCLUDED.form_teacher_remark, principal_remark = EXCLUDED.principal_remark;
INSERT INTO public.student_term_remarks (id, school_id, student_id, academic_session_id, term, form_teacher_remark, form_teacher_id, principal_remark, principal_id, next_term_fees, next_term_resumption_date, created_at, updated_at)
       VALUES ('rem-04', 'sch-bright-future-01', 'stu-04', 'ses-2025-2026', 'FIRST_TERM', 'Blessing is a quiet, diligent and thoroughly reliable pupil. A very pleasing result.', NULL, 'Very good academic performance. Keep up the good spirit.', NULL, NULL, 'January 12, 2026', '2026-09-16T17:07:02.600Z', '2026-09-16T17:07:02.600Z')
       ON CONFLICT (school_id, student_id, academic_session_id, term) DO UPDATE SET form_teacher_remark = EXCLUDED.form_teacher_remark, principal_remark = EXCLUDED.principal_remark;

COMMIT;
