import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import fs from 'fs';
import path from 'path';
import { getInitialSeedData } from './seed.ts';
import { getSupabaseAdminClient, isSupabaseConfigured } from './supabaseClient.ts';

function sqlEscape(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val) || typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Generates clean, idempotent SQL statements from the verified seed data
 */
export function generateSeedSql(): string {
  const seed = getInitialSeedData();
  const lines: string[] = [
    '--',
    '-- SchoolCore Production Seed Data (Idempotent)',
    '-- Contains School A (Bright Future Secondary School) and School B (Excel Academy International)',
    '--',
    'BEGIN;',
    '',
  ];

  // 1. Schools
  lines.push('-- 1. Schools');
  for (const s of seed.schools) {
    lines.push(
      `INSERT INTO public.schools (id, name, code, phone, email, address, state, country, current_session_id, current_term, created_at, updated_at)
       VALUES (${sqlEscape(s.id)}, ${sqlEscape(s.name)}, ${sqlEscape(s.code)}, ${sqlEscape(s.phone)}, ${sqlEscape(s.email)}, ${sqlEscape(s.address)}, ${sqlEscape(s.state)}, ${sqlEscape(s.country)}, ${sqlEscape(s.current_session_id)}, ${sqlEscape(s.current_term)}, ${sqlEscape(s.created_at)}, ${sqlEscape(s.updated_at)})
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, phone = EXCLUDED.phone, updated_at = NOW();`
    );
  }
  lines.push('');

  // 2. Academic Sessions
  lines.push('-- 2. Academic Sessions');
  for (const ses of seed.academicSessions) {
    lines.push(
      `INSERT INTO public.academic_sessions (id, school_id, name, start_date, end_date, is_current, created_at)
       VALUES (${sqlEscape(ses.id)}, ${sqlEscape(ses.school_id)}, ${sqlEscape(ses.name)}, ${sqlEscape(ses.start_date)}, ${sqlEscape(ses.end_date)}, ${sqlEscape(ses.is_current)}, ${sqlEscape(ses.created_at)})
       ON CONFLICT (id) DO NOTHING;`
    );
  }
  lines.push('');

  // 3. Profiles
  lines.push('-- 3. User Profiles');
  for (const p of seed.profiles) {
    lines.push(
      `INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, password_hash, created_at)
       VALUES (${sqlEscape(p.id)}, ${sqlEscape(p.email)}, ${sqlEscape(p.full_name)}, ${sqlEscape(p.phone)}, ${sqlEscape(p.avatar_url)}, ${sqlEscape(p.password_hash)}, ${sqlEscape(p.created_at)})
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;`
    );
  }
  lines.push('');

  // 4. School Users (Memberships)
  lines.push('-- 4. School Users (Tenant Memberships)');
  for (const su of seed.schoolUsers) {
    lines.push(
      `INSERT INTO public.school_users (id, school_id, profile_id, role, status, created_at)
       VALUES (${sqlEscape(su.id)}, ${sqlEscape(su.school_id)}, ${sqlEscape(su.profile_id)}, ${sqlEscape(su.role)}, ${sqlEscape(su.status)}, ${sqlEscape(su.created_at)})
       ON CONFLICT (school_id, profile_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;`
    );
  }
  lines.push('');

  // 5. Staff
  lines.push('-- 5. Staff Members');
  for (const st of seed.staff) {
    lines.push(
      `INSERT INTO public.staff (id, school_id, profile_id, employee_id, full_name, email, phone, role, assigned_classes, status, created_at)
       VALUES (${sqlEscape(st.id)}, ${sqlEscape(st.school_id)}, ${sqlEscape(st.profile_id)}, ${sqlEscape(st.employee_id)}, ${sqlEscape(st.full_name)}, ${sqlEscape(st.email)}, ${sqlEscape(st.phone)}, ${sqlEscape(st.role)}, ${sqlEscape(st.assigned_classes)}, ${sqlEscape(st.status)}, ${sqlEscape(st.created_at)})
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, assigned_classes = EXCLUDED.assigned_classes;`
    );
  }
  lines.push('');

  // 6. Classes
  lines.push('-- 6. Classes');
  for (const c of seed.classes) {
    lines.push(
      `INSERT INTO public.classes (id, school_id, name, level, arm, class_teacher_id, class_teacher_name, capacity, academic_session_id, status, created_at)
       VALUES (${sqlEscape(c.id)}, ${sqlEscape(c.school_id)}, ${sqlEscape(c.name)}, ${sqlEscape(c.level)}, ${sqlEscape(c.arm)}, ${sqlEscape(c.class_teacher_id)}, ${sqlEscape(c.class_teacher_name)}, ${sqlEscape(c.capacity)}, ${sqlEscape(c.academic_session_id)}, ${sqlEscape(c.status)}, ${sqlEscape(c.created_at)})
       ON CONFLICT (id) DO UPDATE SET class_teacher_id = EXCLUDED.class_teacher_id, class_teacher_name = EXCLUDED.class_teacher_name;`
    );
  }
  lines.push('');

  // 7. Subjects
  lines.push('-- 7. Subjects');
  for (const sub of seed.subjects) {
    lines.push(
      `INSERT INTO public.subjects (id, school_id, name, code, category, created_at)
       VALUES (${sqlEscape(sub.id)}, ${sqlEscape(sub.school_id)}, ${sqlEscape(sub.name)}, ${sqlEscape(sub.code)}, ${sqlEscape(sub.category)}, ${sqlEscape(sub.created_at)})
       ON CONFLICT (id) DO NOTHING;`
    );
  }
  lines.push('');

  // 8. Students
  lines.push('-- 8. Students');
  for (const st of seed.students) {
    lines.push(
      `INSERT INTO public.students (id, school_id, first_name, middle_name, last_name, gender, date_of_birth, admission_number, current_class_id, house, guardian_name, guardian_phone, guardian_email, guardian_relationship, address, admission_date, status, notes, created_at, updated_at)
       VALUES (${sqlEscape(st.id)}, ${sqlEscape(st.school_id)}, ${sqlEscape(st.first_name)}, ${sqlEscape(st.middle_name)}, ${sqlEscape(st.last_name)}, ${sqlEscape(st.gender)}, ${sqlEscape(st.date_of_birth)}, ${sqlEscape(st.admission_number)}, ${sqlEscape(st.current_class_id)}, ${sqlEscape(st.house)}, ${sqlEscape(st.guardian_name)}, ${sqlEscape(st.guardian_phone)}, ${sqlEscape(st.guardian_email)}, ${sqlEscape(st.guardian_relationship)}, ${sqlEscape(st.address)}, ${sqlEscape(st.admission_date)}, ${sqlEscape(st.status)}, ${sqlEscape(st.notes)}, ${sqlEscape(st.created_at)}, ${sqlEscape(st.updated_at)})
       ON CONFLICT (school_id, admission_number) DO UPDATE SET current_class_id = EXCLUDED.current_class_id, status = EXCLUDED.status, updated_at = NOW();`
    );
  }
  lines.push('');

  // 9. Attendance Sessions
  lines.push('-- 9. Attendance Sessions');
  for (const att of seed.attendanceSessions) {
    lines.push(
      `INSERT INTO public.attendance_sessions (id, school_id, class_id, date, session_type, marked_by_id, marked_by_name, present_count, absent_count, late_count, created_at, updated_at)
       VALUES (${sqlEscape(att.id)}, ${sqlEscape(att.school_id)}, ${sqlEscape(att.class_id)}, ${sqlEscape(att.date)}, ${sqlEscape(att.session_type)}, ${sqlEscape(att.marked_by_id)}, ${sqlEscape(att.marked_by_name)}, ${sqlEscape(att.present_count)}, ${sqlEscape(att.absent_count)}, ${sqlEscape(att.late_count)}, ${sqlEscape(att.created_at)}, ${sqlEscape(att.updated_at)})
       ON CONFLICT (school_id, class_id, date, session_type) DO UPDATE SET present_count = EXCLUDED.present_count, absent_count = EXCLUDED.absent_count, late_count = EXCLUDED.late_count;`
    );
  }
  lines.push('');

  // 10. Attendance Records
  lines.push('-- 10. Attendance Records');
  for (const rec of seed.attendanceRecords) {
    const r = rec as any;
    lines.push(
      `INSERT INTO public.attendance_records (id, session_id, student_id, status, remark, created_at)
       VALUES (${sqlEscape(r.id)}, ${sqlEscape(r.session_id)}, ${sqlEscape(r.student_id)}, ${sqlEscape(r.status)}, ${sqlEscape(r.remarks || r.remark)}, ${sqlEscape(r.created_at)})
       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, remark = EXCLUDED.remark;`
    );
  }
  lines.push('');

  // 11. Notices
  lines.push('-- 11. Notices');
  for (const not of seed.notices) {
    lines.push(
      `INSERT INTO public.notices (id, school_id, author_id, author_name, title, message, audience, priority, status, published_at, expires_at, created_at)
       VALUES (${sqlEscape(not.id)}, ${sqlEscape(not.school_id)}, ${sqlEscape(not.author_id)}, ${sqlEscape(not.author_name)}, ${sqlEscape(not.title)}, ${sqlEscape(not.message)}, ${sqlEscape(not.audience)}, ${sqlEscape(not.priority)}, ${sqlEscape(not.status)}, ${sqlEscape(not.published_at)}, ${sqlEscape(not.expires_at)}, ${sqlEscape(not.created_at)})
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, message = EXCLUDED.message, status = EXCLUDED.status;`
    );
  }
  lines.push('');

  // 12. Settings
  lines.push('-- 12. School Settings');
  for (const set of seed.settings) {
    const s = set as any;
    lines.push(
      `INSERT INTO public.school_settings (id, school_id, academic_year_label, grading_system, school_motto, auto_generate_admission_numbers, default_student_status, created_at, updated_at)
       VALUES (${sqlEscape(s.id)}, ${sqlEscape(s.school_id)}, ${sqlEscape(s.academic_year_label || s.academic_year)}, ${sqlEscape(s.grading_system || 'STANDARD')}, ${sqlEscape(s.school_motto)}, ${sqlEscape(s.auto_generate_admission_numbers ?? true)}, ${sqlEscape(s.default_student_status || 'ACTIVE')}, ${sqlEscape(s.created_at)}, ${sqlEscape(s.updated_at)})
       ON CONFLICT (school_id) DO UPDATE SET academic_year_label = EXCLUDED.academic_year_label, grading_system = EXCLUDED.grading_system, updated_at = NOW();`
    );
  }
  lines.push('');

  // 13. Audit Logs
  lines.push('-- 13. Audit Logs');
  for (const a of seed.auditLogs) {
    lines.push(
      `INSERT INTO public.audit_logs (id, school_id, actor_id, actor_name, actor_role, action, entity, entity_id, details, created_at)
       VALUES (${sqlEscape(a.id)}, ${sqlEscape(a.school_id)}, ${sqlEscape(a.actor_id)}, ${sqlEscape(a.actor_name)}, ${sqlEscape(a.actor_role)}, ${sqlEscape(a.action)}, ${sqlEscape(a.entity)}, ${sqlEscape(a.entity_id)}, ${sqlEscape(a.details)}, ${sqlEscape(a.timestamp)})
       ON CONFLICT (id) DO NOTHING;`
    );
  }
  lines.push('');

  // 14. Academic Configs (Phase 2)
  lines.push('-- 14. Academic Configs (Phase 2)');
  for (const ac of seed.academicConfigs) {
    const c = ac as any;
    lines.push(
      `INSERT INTO public.academic_configs (id, school_id, ca1_max, ca2_max, ca3_max, exam_max, grading_scale, remark_templates, created_at, updated_at)
       VALUES (${sqlEscape(c.id)}, ${sqlEscape(c.school_id)}, ${sqlEscape(c.ca1_max ?? 10)}, ${sqlEscape(c.ca2_max ?? 10)}, ${sqlEscape(c.ca3_max ?? 20)}, ${sqlEscape(c.exam_max ?? 60)}, ${sqlEscape(c.grading_scale)}, ${sqlEscape(c.remark_templates || {})}, ${sqlEscape(c.created_at)}, ${sqlEscape(c.updated_at)})
       ON CONFLICT (school_id) DO UPDATE SET grading_scale = EXCLUDED.grading_scale, updated_at = NOW();`
    );
  }
  lines.push('');

  // 15. Teacher Subject Assignments
  lines.push('-- 15. Teacher Subject Assignments');
  for (const tsa of seed.teacherSubjectAssignments) {
    lines.push(
      `INSERT INTO public.teacher_subject_assignments (id, school_id, teacher_id, teacher_name, class_id, class_name, subject_id, subject_name, academic_session_id, created_at)
       VALUES (${sqlEscape(tsa.id)}, ${sqlEscape(tsa.school_id)}, ${sqlEscape(tsa.teacher_id)}, ${sqlEscape(tsa.teacher_name)}, ${sqlEscape(tsa.class_id)}, ${sqlEscape(tsa.class_name)}, ${sqlEscape(tsa.subject_id)}, ${sqlEscape(tsa.subject_name)}, ${sqlEscape(tsa.academic_session_id)}, ${sqlEscape(tsa.created_at)})
       ON CONFLICT (school_id, teacher_id, class_id, subject_id, academic_session_id) DO NOTHING;`
    );
  }
  lines.push('');

  // 16. Subject Results
  lines.push('-- 16. Subject Results');
  for (const sr of seed.subjectResults) {
    const r = sr as any;
    lines.push(
      `INSERT INTO public.subject_results (id, school_id, student_id, class_id, subject_id, academic_session_id, term, ca1_score, ca2_score, ca3_score, exam_score, total_score, grade, remark, teacher_subject_remark, status, entered_by_id, entered_by_name, created_at, updated_at)
       VALUES (${sqlEscape(r.id)}, ${sqlEscape(r.school_id)}, ${sqlEscape(r.student_id)}, ${sqlEscape(r.class_id)}, ${sqlEscape(r.subject_id)}, ${sqlEscape(r.academic_session_id)}, ${sqlEscape(r.term)}, ${sqlEscape(r.ca1_score)}, ${sqlEscape(r.ca2_score)}, ${sqlEscape(r.ca3_score)}, ${sqlEscape(r.exam_score)}, ${sqlEscape(r.total_score)}, ${sqlEscape(r.grade)}, ${sqlEscape(r.remark)}, ${sqlEscape(r.teacher_subject_remark)}, ${sqlEscape(r.status)}, ${sqlEscape(r.entered_by_id || r.teacher_id)}, ${sqlEscape(r.entered_by_name || r.teacher_name)}, ${sqlEscape(r.created_at)}, ${sqlEscape(r.updated_at)})
       ON CONFLICT (school_id, student_id, subject_id, academic_session_id, term) DO UPDATE SET total_score = EXCLUDED.total_score, grade = EXCLUDED.grade, status = EXCLUDED.status;`
    );
  }
  lines.push('');

  // 17. Student Term Remarks
  lines.push('-- 17. Student Term Remarks');
  for (const rem of seed.studentTermRemarks) {
    const r = rem as any;
    lines.push(
      `INSERT INTO public.student_term_remarks (id, school_id, student_id, academic_session_id, term, form_teacher_remark, form_teacher_id, principal_remark, principal_id, next_term_fees, next_term_resumption_date, created_at, updated_at)
       VALUES (${sqlEscape(r.id)}, ${sqlEscape(r.school_id)}, ${sqlEscape(r.student_id)}, ${sqlEscape(r.academic_session_id)}, ${sqlEscape(r.term)}, ${sqlEscape(r.form_teacher_remark)}, ${sqlEscape(r.form_teacher_id)}, ${sqlEscape(r.principal_remark)}, ${sqlEscape(r.principal_id)}, ${sqlEscape(r.next_term_fees)}, ${sqlEscape(r.next_term_resumption_date)}, ${sqlEscape(r.created_at || r.updated_at)}, ${sqlEscape(r.updated_at)})
       ON CONFLICT (school_id, student_id, academic_session_id, term) DO UPDATE SET form_teacher_remark = EXCLUDED.form_teacher_remark, principal_remark = EXCLUDED.principal_remark;`
    );
  }
  lines.push('');

  lines.push('COMMIT;');
  lines.push('');
  return lines.join('\n');
}

/**
 * Programmatically seeds Supabase using the JavaScript SDK
 */
export async function seedSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.error('SUPABASE_URL and SUPABASE_ANON_KEY must be defined to seed Supabase.');
    return;
  }

  const client = getSupabaseAdminClient();
  const seed = getInitialSeedData();
  console.log('[Seed] Seeding Supabase database...');

  // 1. Schools
  console.log(`[Seed] Inserting ${seed.schools.length} schools...`);
  await client.from('schools').upsert(seed.schools);

  // 2. Academic Sessions
  console.log(`[Seed] Inserting ${seed.academicSessions.length} academic sessions...`);
  await client.from('academic_sessions').upsert(seed.academicSessions);

  // 3. Profiles
  console.log(`[Seed] Inserting ${seed.profiles.length} profiles...`);
  await client.from('profiles').upsert(seed.profiles);

  // 4. School Users
  console.log(`[Seed] Inserting ${seed.schoolUsers.length} school users...`);
  await client.from('school_users').upsert(seed.schoolUsers);

  // 5. Staff
  console.log(`[Seed] Inserting ${seed.staff.length} staff...`);
  await client.from('staff').upsert(seed.staff);

  // 6. Classes
  console.log(`[Seed] Inserting ${seed.classes.length} classes...`);
  await client.from('classes').upsert(seed.classes);

  // 7. Subjects
  console.log(`[Seed] Inserting ${seed.subjects.length} subjects...`);
  await client.from('subjects').upsert(seed.subjects);

  // 8. Students
  console.log(`[Seed] Inserting ${seed.students.length} students...`);
  await client.from('students').upsert(seed.students);

  // 9. Attendance
  console.log(`[Seed] Inserting ${seed.attendanceSessions.length} attendance sessions...`);
  await client.from('attendance_sessions').upsert(seed.attendanceSessions);
  console.log(`[Seed] Inserting ${seed.attendanceRecords.length} attendance records...`);
  await client.from('attendance_records').upsert(seed.attendanceRecords);

  // 10. Notices
  console.log(`[Seed] Inserting ${seed.notices.length} notices...`);
  await client.from('notices').upsert(seed.notices);

  // 11. Settings
  console.log(`[Seed] Inserting ${seed.settings.length} settings...`);
  await client.from('school_settings').upsert(seed.settings);

  // 12. Audit Logs
  console.log(`[Seed] Inserting ${seed.auditLogs.length} audit logs...`);
  await client.from('audit_logs').upsert(
    seed.auditLogs.map((a) => ({
      ...a,
      created_at: a.timestamp,
    }))
  );

  // 13. Academics
  console.log(`[Seed] Inserting academic configs and results...`);
  await client.from('academic_configs').upsert(seed.academicConfigs);
  await client.from('teacher_subject_assignments').upsert(seed.teacherSubjectAssignments);
  await client.from('subject_results').upsert(seed.subjectResults);
  await client.from('student_term_remarks').upsert(seed.studentTermRemarks);

  console.log('[Seed] Supabase seeding completed successfully!');
}

// When run directly as a CLI command
if (process.argv[1]?.endsWith('seed-supabase.ts')) {
  // Write seed.sql
  const sql = generateSeedSql();
  const seedSqlPath = path.resolve(process.cwd(), 'supabase', 'seed.sql');
  fs.writeFileSync(seedSqlPath, sql, 'utf8');
  console.log(`[SchoolCore] Generated idempotent SQL seed at ${seedSqlPath} (${(sql.length / 1024).toFixed(1)} KB)`);

  if (isSupabaseConfigured()) {
    seedSupabase().catch((err) => {
      console.error('[SchoolCore Seed Error]', err);
      process.exit(1);
    });
  } else {
    console.log('[SchoolCore] Supabase credentials not set in environment. Seed SQL generated for PostgreSQL migration.');
  }
}
