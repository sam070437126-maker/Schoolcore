import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { syncLocalDatabaseToSupabase } from '../src/server/repositories/supabase/supabaseSync.ts';
import { db } from '../src/server/db.ts';

describe('SupabaseSync Pipeline Unit Tests', () => {
  before(() => {
    if (db.data.schools.length === 0) {
      db.data.schools = [
        {
          id: 'sch-001',
          name: 'Apex Academy',
          code: 'APEX',
          phone: '+234 800 000 0000',
          email: 'info@apex.edu',
          address: '1 Education Way',
          state: 'Lagos',
          country: 'Nigeria',
          current_term: 'FIRST_TERM',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      db.data.classes = [
        {
          id: 'cls-jss-1a',
          school_id: 'sch-001',
          name: 'JSS 1A',
          level: 'JSS 1',
          arm: 'A',
          status: 'ACTIVE',
          capacity: 40,
          created_at: new Date().toISOString(),
        },
      ];
      db.data.students = [
        {
          id: 'stu-001',
          school_id: 'sch-001',
          admission_number: 'APX/2026/001',
          first_name: 'David',
          last_name: 'Adeleke',
          gender: 'MALE',
          date_of_birth: '2012-01-01',
          current_class_id: 'cls-jss-1a',
          guardian_name: 'Mr. Adeleke',
          guardian_phone: '+234 800 000 0000',
          guardian_relationship: 'Father',
          address: '1 Education Way',
          admission_date: '2026-09-01',
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      db.data.attendanceSessions = [
        {
          id: 'att-ses-001',
          school_id: 'sch-001',
          class_id: 'cls-jss-1a',
          class_name: 'JSS 1A',
          date: '2026-09-22',
          session_type: 'MORNING',
          marked_by_id: 'usr-001',
          marked_by_name: 'Test Teacher',
          status: 'SUBMITTED',
          total_students: 1,
          present_count: 1,
          absent_count: 0,
          late_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      db.data.attendanceRecords = [
        {
          id: 'att-rec-001',
          school_id: 'sch-001',
          session_id: 'att-ses-001',
          student_id: 'stu-001',
          status: 'PRESENT',
          created_at: new Date().toISOString(),
        },
      ];
    }
  });
  test('handles connection probe failure gracefully without unhandled error propagation', async () => {
    const mockFailingClient = {
      from: () => ({
        select: () => ({
          limit: async () => ({ error: { message: 'Database unreachable in sandbox' } }),
        }),
      }),
    };

    const result = await syncLocalDatabaseToSupabase(mockFailingClient);
    assert.strictEqual(result.ok, false);
    assert.ok(result.message.includes('Cannot connect to Supabase'));
    assert.ok(result.errors.length > 0);
    assert.strictEqual(result.errors[0], 'Database unreachable in sandbox');
  });

  test('successfully executes atomic RPC transaction when sync_schoolcore_bundle RPC is available', async () => {
    let rpcPayloadReceived: any = null;

    const mockRpcClient = {
      from: (table: string) => ({
        select: () => ({
          limit: async () => ({ error: null, data: [{ id: 'sch-001' }] }),
        }),
      }),
      rpc: async (functionName: string, args: any) => {
        assert.strictEqual(functionName, 'sync_schoolcore_bundle');
        rpcPayloadReceived = args.payload;
        return {
          data: {
            success: true,
            counts: {
              schools: 1,
              classes: 4,
              students: 24,
              staff: 8,
              attendance_sessions: 3,
              attendance_records: 48,
              notices: 2,
            },
          },
          error: null,
        };
      },
    };

    const result = await syncLocalDatabaseToSupabase(mockRpcClient);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.mode, 'rpc_atomic');
    assert.strictEqual(result.errors.length, 0);
    assert.strictEqual(result.syncedCounts.schools, 1);
    assert.strictEqual(result.syncedCounts.students, 24);
    assert.ok(rpcPayloadReceived !== null, 'Expected RPC payload to be passed');
    assert.ok(Array.isArray(rpcPayloadReceived.schools));
    assert.ok(Array.isArray(rpcPayloadReceived.students));
  });

  test('falls back gracefully to staged batch execution when RPC is unavailable and maintains FK integrity', async () => {
    const upsertedTables: string[] = [];

    const mockBatchClient = {
      from: (table: string) => {
        return {
          select: () => ({
            limit: async () => ({ error: null, data: [{ id: 'sch-001' }] }),
          }),
          upsert: async (records: any[], options: any) => {
            upsertedTables.push(table);
            return { error: null };
          },
        };
      },
      rpc: async () => {
        // Simulate missing RPC function in PostgreSQL
        return {
          data: null,
          error: { message: 'function sync_schoolcore_bundle does not exist' },
        };
      },
    };

    const result = await syncLocalDatabaseToSupabase(mockBatchClient);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.mode, 'staged_batch');
    // Zero fatal errors propagated
    assert.ok(result.syncedCounts['schools'] >= 1);
    assert.ok(result.syncedCounts['classes'] >= 1);
    assert.ok(result.syncedCounts['students'] >= 1);

    // Verify strict foreign key staging order: schools before classes, classes before students
    const schoolIdx = upsertedTables.indexOf('schools');
    const classIdx = upsertedTables.indexOf('classes');
    const studentIdx = upsertedTables.indexOf('students');
    const attendanceRecIdx = upsertedTables.indexOf('attendance_records');

    assert.ok(schoolIdx < classIdx, 'Schools must be inserted before classes');
    assert.ok(classIdx < studentIdx, 'Classes must be inserted before students');
    assert.ok(studentIdx < attendanceRecIdx, 'Students must be inserted before attendance records');
  });

  test('verifies data sanitization and foreign key normalization', async () => {
    let capturedPayload: any = null;

    const mockClient = {
      from: (table: string) => ({
        select: () => ({
          limit: async () => ({ error: null, data: [{ id: 'sch-001' }] }),
        }),
      }),
      rpc: async (fn: string, args: any) => {
        capturedPayload = args.payload;
        return {
          data: { success: true, counts: {} },
          error: null,
        };
      },
    };

    const result = await syncLocalDatabaseToSupabase(mockClient);
    assert.strictEqual(result.ok, true);
    assert.ok(capturedPayload !== null);

    // Validate that every student has a valid class assignment
    for (const student of capturedPayload.students) {
      assert.ok(student.current_class_id, `Student ${student.id} must have current_class_id`);
      assert.ok(student.admission_number, `Student ${student.id} must have admission_number`);
    }

    // Validate that every attendance record references valid session and student
    const validStudentIds = new Set(capturedPayload.students.map((s: any) => s.id));
    const validSessionIds = new Set(capturedPayload.attendance_sessions.map((s: any) => s.id));

    for (const record of capturedPayload.attendance_records) {
      assert.ok(validSessionIds.has(record.session_id), `Record ${record.id} must reference a valid session`);
      assert.ok(validStudentIds.has(record.student_id), `Record ${record.id} must reference a valid student`);
    }
  });
});
