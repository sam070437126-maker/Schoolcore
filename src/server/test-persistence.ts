import { getRepositories } from './repositories/index.ts';
import { DATABASE_MODE } from './supabaseClient.ts';

async function runPersistenceTests() {
  console.log('====================================================');
  console.log('  SchoolCore Live Persistence & Isolation Verification');
  console.log('====================================================');
  console.log(`Current Mode: ${DATABASE_MODE}`);

  const repos = getRepositories();

  const schoolAId = 'sch-bright-future-01';
  const schoolBId = 'school-2-excel';

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Schools Module
    // ----------------------------------------------------
    console.log('\n--- 1. Schools & Multi-Tenant Boundaries ---');
    const schools = await repos.schools.getSchools();
    assert(schools.length >= 2, 'Multiple schools loaded', `Found ${schools.length}`);

    const schoolA = await repos.schools.getSchoolById(schoolAId);
    const schoolB = await repos.schools.getSchoolById(schoolBId);
    assert(schoolA !== undefined && schoolA.id === schoolAId, 'School A (Bright Future) resolved');
    assert(schoolB !== undefined && schoolB.id === schoolBId, 'School B (Excel Academy) resolved');

    // ----------------------------------------------------
    // TEST 2: Users and Profiles
    // ----------------------------------------------------
    console.log('\n--- 2. Users and Role Authority ---');
    const adminA = await repos.users.getProfileByEmail('admin@brightfuture.sch.ng');
    assert(adminA !== undefined, 'Admin A profile exists');

    if (adminA) {
      const membershipA = await repos.users.getSchoolUser(schoolAId, adminA.id);
      assert(membershipA?.role === 'SCHOOL_ADMIN', 'Admin A has SCHOOL_ADMIN role');

      // Verify Admin A has NO membership in School B (strict tenant check)
      const crossMembership = await repos.users.getSchoolUser(schoolBId, adminA.id);
      assert(crossMembership === undefined, 'Tenant Isolation: Admin A has NO membership in School B');
    }

    // ----------------------------------------------------
    // TEST 3: Students & Cross-Tenant Data Isolation
    // ----------------------------------------------------
    console.log('\n--- 3. Students CRUD & Strict Cross-School Isolation ---');
    const studentsA = await repos.students.getStudents(schoolAId, {}, { page: 1, limit: 100 });
    const studentsB = await repos.students.getStudents(schoolBId, {}, { page: 1, limit: 100 });

    assert(studentsA.students.length > 0, `School A has students (count: ${studentsA.total})`);
    assert(studentsB.students.length > 0, `School B has students (count: ${studentsB.total})`);

    // Verify ZERO overlap between schools
    const schoolAIds = new Set(studentsA.students.map((s) => s.id));
    const schoolBIds = new Set(studentsB.students.map((s) => s.id));
    const overlap = [...schoolAIds].filter((id) => schoolBIds.has(id));
    assert(overlap.length === 0, 'ZERO student ID collision or leakage across schools');

    const leakCheckA = studentsA.students.some((s) => s.school_id !== schoolAId);
    const leakCheckB = studentsB.students.some((s) => s.school_id !== schoolBId);
    assert(!leakCheckA && !leakCheckB, '100% of queried students match their respective tenant school_id');

    // Test Student Lifecycle: Create -> Read -> Update -> Archive
    const testAdmNo = `TEST-ADM-${Date.now().toString().slice(-5)}`;
    const createdStudent = await repos.students.createStudent({
      id: `stu-test-${Date.now()}`,
      school_id: schoolAId,
      first_name: 'Test',
      last_name: 'Student',
      admission_number: testAdmNo,
      gender: 'MALE',
      date_of_birth: '2012-05-15',
      current_class_id: 'cls-jss1a-01',
      house: 'Red House',
      guardian_name: 'Test Guardian',
      guardian_phone: '+234 800 123 4567',
      guardian_email: 'guardian@test.com',
      guardian_relationship: 'Parent',
      address: '10 Test Lane',
      admission_date: '2026-09-01',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    assert(createdStudent.id !== undefined, 'Created student persists');

    const fetchedStudent = await repos.students.getStudentById(schoolAId, createdStudent.id);
    assert(fetchedStudent?.admission_number === testAdmNo, 'Fetched newly created student matches admission number');

    const updatedStudent = await repos.students.updateStudent(schoolAId, createdStudent.id, {
      first_name: 'UpdatedName',
      status: 'INACTIVE',
    });
    assert(updatedStudent?.first_name === 'UpdatedName' && updatedStudent?.status === 'INACTIVE', 'Student update and archive persists');

    // ----------------------------------------------------
    // TEST 4: Classes & Staff
    // ----------------------------------------------------
    console.log('\n--- 4. Classes and Staff ---');
    const classesA = await repos.classes.getClasses(schoolAId);
    assert(classesA.length > 0, `School A classes retrieved (${classesA.length} classes)`);

    const staffA = await repos.staff.getStaff(schoolAId);
    assert(staffA.length > 0, `School A staff retrieved (${staffA.length} staff)`);

    // ----------------------------------------------------
    // TEST 5: Attendance Module
    // ----------------------------------------------------
    console.log('\n--- 5. Attendance Recording Lifecycle ---');
    const testDate = '2026-09-15';
    const testClass = classesA[0].id;
    const sessionRes = await repos.attendance.saveAttendanceSession(
      {
        id: `ses-test-${testClass}-${testDate}-MORNING`,
        school_id: schoolAId,
        class_id: testClass,
        date: testDate,
        session_type: 'MORNING',
        marked_by_id: 'usr-teacher-01',
        marked_by_name: 'Mr. Samuel Adewale',
        status: 'SUBMITTED',
        total_students: 1,
        present_count: 1,
        absent_count: 0,
        late_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      [
        {
          id: `att-rec-${Date.now()}`,
          session_id: `ses-test-${testClass}-${testDate}-MORNING`,
          student_id: studentsA.students[0].id,
          school_id: schoolAId,
          status: 'PRESENT',
          remarks: 'Early arrival',
          created_at: new Date().toISOString(),
        },
      ]
    );
    assert(sessionRes.session.present_count === 1, 'Attendance session saved');

    const retrievedSession = await repos.attendance.getAttendanceSession(schoolAId, testClass, testDate, 'MORNING');
    assert(retrievedSession !== undefined && retrievedSession.present_count === 1, 'Attendance session retrieved successfully');

    // ----------------------------------------------------
    // TEST 6: Notices & Settings
    // ----------------------------------------------------
    console.log('\n--- 6. Notices and Settings ---');
    const notice = await repos.notices.createNotice({
      id: `not-test-${Date.now()}`,
      school_id: schoolAId,
      author_id: 'usr-admin-01',
      author_name: 'Administrator',
      title: 'Term Resumption Notice',
      message: 'Welcome to the new academic session.',
      audience: 'EVERYONE',
      priority: 'HIGH',
      status: 'PUBLISHED',
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
    assert(notice.title === 'Term Resumption Notice', 'Notice created and published');

    const notices = await repos.notices.getNotices(schoolAId, 'TEACHER');
    assert(notices.some((n) => n.id === notice.id), 'Notice visible to intended audience');

    const settings = await repos.settings.getSettings(schoolAId);
    assert(settings !== undefined && settings.school_id === schoolAId, 'School settings retrieved');

    // ----------------------------------------------------
    // TEST 7: Audit Logs
    // ----------------------------------------------------
    console.log('\n--- 7. Audit Logging ---');
    const audit = await repos.auditLogs.addAuditLog({
      school_id: schoolAId,
      actor_id: 'usr-admin-01',
      actor_name: 'Administrator',
      actor_role: 'SCHOOL_ADMIN',
      action: 'SYSTEM_VERIFICATION',
      entity: 'AuditTest',
      entity_id: 'test-1',
      details: 'Automated persistence verification suite run',
    });
    assert(audit.action === 'SYSTEM_VERIFICATION', 'Audit log inserted');

    const logs = await repos.auditLogs.getAuditLogs(schoolAId, 10);
    assert(logs.some((l) => l.action === 'SYSTEM_VERIFICATION'), 'Audit log recorded and retrieved');

    // ----------------------------------------------------
    // TEST 8: Dashboard Stats Aggregation
    // ----------------------------------------------------
    console.log('\n--- 8. Dashboard Aggregation ---');
    const stats = await repos.dashboard.getDashboardStats(schoolAId, 'usr-admin-01', 'SCHOOL_ADMIN');
    assert(stats.total_students > 0, `Dashboard total_students > 0 (${stats.total_students})`);
    assert(stats.total_staff > 0, `Dashboard total_staff > 0 (${stats.total_staff})`);
    assert(stats.total_classes > 0, `Dashboard total_classes > 0 (${stats.total_classes})`);

    console.log('\n====================================================');
    console.log(`  Tests Completed: ${passed} passed, ${failed} failed`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('\n[FATAL TEST ERROR]', err);
    process.exit(1);
  }
}

runPersistenceTests();
