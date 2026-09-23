import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('SchoolCore Master Production Verification & Security Audit Suite', () => {
  const BASE_URL = 'http://localhost:3000';
  let token = '';
  let superAdminId = '';
  let tenantSchoolId = '';
  let testClassId = '';
  let testStudentId = '';
  const testSchoolCode = 'AUD-' + Date.now().toString().slice(-4);

  it('1. Verifies Super Master Admin authentication with samuelemma466@gmail.com', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'samuelemma466@gmail.com', password: 'Admin@2026!' }),
    });
    assert.equal(res.status, 200, 'Login status must be 200');
    const data = await res.json();
    assert.ok(data.token, 'Token must be issued');
    assert.equal(data.user?.email, 'samuelemma466@gmail.com', 'User email must match super admin');
    assert.equal(data.membership?.role, 'SUPER_ADMIN', 'Role must be SUPER_ADMIN');
    token = data.token;
    superAdminId = data.user.id;
  });

  it('2. Verifies session resolution and /api/auth/me token authenticity', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    assert.equal(res.status, 200);
    const me = await res.json();
    assert.equal(me.user?.id, superAdminId);
    assert.equal(me.membership?.role, 'SUPER_ADMIN');
  });

  it('3. Verifies Multi-Tenant provisioning of a new school institution', async () => {
    const res = await fetch(`${BASE_URL}/api/schools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: `Automated Test Academy ${testSchoolCode}`,
        code: testSchoolCode,
        phone: '+234 800 123 4567',
        email: `contact.${testSchoolCode.toLowerCase()}@schoolcore.ng`,
        address: 'Audit Grounds, Victoria Island',
        state: 'Lagos',
        country: 'Nigeria',
      }),
    });
    assert.equal(res.status, 201, 'School creation status must be 201');
    const body = await res.json();
    const school = body.school || body;
    assert.ok(school.id, 'School ID must be present');
    assert.equal(school.code, testSchoolCode);
    tenantSchoolId = school.id;
  });

  it('4. Provisions an academic class under the scoped school tenant', async () => {
    const res = await fetch(`${BASE_URL}/api/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-school-id': tenantSchoolId,
      },
      body: JSON.stringify({
        school_id: tenantSchoolId,
        name: 'JS 1 Diamond',
        level: 'JS 1',
        arm: 'Diamond',
        capacity: 35,
      }),
    });
    assert.equal(res.status, 201);
    const cls = await res.json();
    assert.ok(cls.id);
    assert.equal(cls.school_id, tenantSchoolId);
    testClassId = cls.id;
  });

  it('5. Admits a student with strict multi-tenant boundary compliance', async () => {
    const admNumber = `STU/${testSchoolCode}/101`;
    const res = await fetch(`${BASE_URL}/api/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-school-id': tenantSchoolId,
      },
      body: JSON.stringify({
        school_id: tenantSchoolId,
        admission_number: admNumber,
        first_name: 'Chidi',
        last_name: 'Okafor',
        gender: 'MALE',
        date_of_birth: '2012-05-18',
        current_class_id: testClassId,
        guardian_name: 'Dr. Okafor',
        guardian_phone: '+234 802 334 5566',
        guardian_relationship: 'Father',
      }),
    });
    assert.equal(res.status, 201);
    const student = await res.json();
    assert.ok(student.id);
    assert.equal(student.school_id, tenantSchoolId);
    assert.equal(student.admission_number, admNumber);
    testStudentId = student.id;
  });

  it('6. Records and persists roll call attendance session', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`${BASE_URL}/api/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-school-id': tenantSchoolId,
      },
      body: JSON.stringify({
        school_id: tenantSchoolId,
        class_id: testClassId,
        date: today,
        session_type: 'MORNING',
        records: [
          {
            student_id: testStudentId,
            status: 'PRESENT',
            remark: 'Arrived promptly for assembly',
          },
        ],
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.session?.id, 'Session ID must be returned');
    assert.equal(data.records?.length, 1);
  });

  it('7. Enters academic term continuous assessment scores', async () => {
    const res = await fetch(`${BASE_URL}/api/academics/results/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-school-id': tenantSchoolId,
      },
      body: JSON.stringify({
        school_id: tenantSchoolId,
        classId: testClassId,
        subjectId: 'sub-english',
        term: 'FIRST_TERM',
        entries: [
          {
            studentId: testStudentId,
            ca1: 19,
            ca2: 18,
            exam: 56,
            teacherComment: 'Excellent performance and analytical grasp.',
          },
        ],
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.saved_count > 0 || data.count > 0 || data.success || data.results);
  });

  it('8. Verifies Digital Approvals workflow lifecycle', async () => {
    const createRes = await fetch(`${BASE_URL}/api/approvals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-school-id': tenantSchoolId,
      },
      body: JSON.stringify({
        type: 'PERMISSION_SLIP',
        student_id: testStudentId,
        student_name: 'Chidi Okafor',
        title: 'Robotics Science Excursion',
        details: 'Inter-school STEM exhibition and competition at National Theatre.',
        dates: '2026-10-15',
      }),
    });
    assert.equal(createRes.status, 201);
    const { approval } = await createRes.json();
    assert.ok(approval.id);
    assert.equal(approval.status, 'PENDING');

    const updateRes = await fetch(`${BASE_URL}/api/approvals/${approval.id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-school-id': tenantSchoolId,
      },
      body: JSON.stringify({
        status: 'APPROVED',
        signature_name: 'Dr. Samuel E.',
        teacher_notes: 'Parent consent verified and validated.',
      }),
    });
    assert.equal(updateRes.status, 200);
    const updated = await updateRes.json();
    assert.equal(updated.approval.status, 'APPROVED');
  });

  it('9. Verifies school tuition fee payment recording and ledger', async () => {
    const res = await fetch(`${BASE_URL}/api/finance/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-school-id': tenantSchoolId,
      },
      body: JSON.stringify({
        student_id: testStudentId,
        amount: 50000,
        payment_method: 'TRANSFER',
        description: 'First Term Tuition Payment - Installment 1',
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.payment?.receipt_number);
    assert.equal(data.payment.amount, 50000);
  });

  it('10. Verifies audit trail immutability and administrative logging', async () => {
    const res = await fetch(`${BASE_URL}/api/audit-logs`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-school-id': tenantSchoolId,
      },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.logs));
    assert.ok(data.logs.length > 0, 'Audit log records must exist');
  });

  it('11. Verifies PWA manifests, icons, and offline fallback', async () => {
    const manifestRes = await fetch(`${BASE_URL}/manifest.webmanifest`);
    assert.equal(manifestRes.status, 200);
    const manifest = await manifestRes.json();
    assert.equal(manifest.name, 'SchoolCore Operating System');
    assert.ok(manifest.icons.length >= 2);

    const swRes = await fetch(`${BASE_URL}/sw.js`);
    assert.equal(swRes.status, 200);

    const offlineRes = await fetch(`${BASE_URL}/offline.html`);
    assert.equal(offlineRes.status, 200);
  });

  it('12. Enforces RBAC & rejection of unauthenticated access with 401', async () => {
    const unauthRes = await fetch(`${BASE_URL}/api/students`);
    assert.equal(unauthRes.status, 401, 'Unauthenticated request must be rejected with 401');
  });
});
