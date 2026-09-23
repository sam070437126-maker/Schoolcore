import { getFirebaseFirestore, isFirebaseConfigured } from './firebaseClient.ts';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const COLLECTIONS = [
  'schools',
  'academicSessions',
  'profiles',
  'schoolUsers',
  'classes',
  'subjects',
  'students',
  'staff',
  'attendanceSessions',
  'attendanceRecords',
  'notices',
  'settings',
  'auditLogs',
  'academicConfigs',
  'teacherSubjectAssignments',
  'subjectResults',
  'studentTermRemarks',
  'homework',
  'directMessages',
  'feeAccounts',
  'feePayments',
  'digitalApprovals',
  'parentStudents',
  'userNotifications',
  'adminInvitations',
  'guardian_student_links',
];

export async function purgeAllDemoData(): Promise<{ success: boolean; message: string; deletedCounts: Record<string, number> }> {
  const deletedCounts: Record<string, number> = {};

  // 1. Clear Cloud Firestore
  if (isFirebaseConfigured()) {
    try {
      const db = getFirebaseFirestore();
      console.log('[Purge] Beginning complete purge of Cloud Firestore demo/test collections...');

      for (const colName of COLLECTIONS) {
        try {
          const colRef = collection(db, colName);
          const snap = await getDocs(colRef);
          if (!snap.empty) {
            let batch = writeBatch(db);
            let count = 0;
            let total = 0;
            for (const d of snap.docs) {
              batch.delete(doc(db, colName, d.id));
              count++;
              total++;
              if (count === 400) {
                await batch.commit();
                batch = writeBatch(db);
                count = 0;
              }
            }
            if (count > 0) {
              await batch.commit();
            }
            deletedCounts[colName] = total;
            console.log(`[Purge] Deleted ${total} records from Firestore collection '${colName}'`);
          } else {
            deletedCounts[colName] = 0;
          }
        } catch (e: any) {
          console.warn(`[Purge] Note on collection ${colName}:`, e.message);
        }
      }
    } catch (err: any) {
      console.error('[Purge] Error during Firestore purge:', err);
    }
  }

  // 2. Clear Supabase tables of demo and test records (preserving real user school samuelemma466@gmail.com)
  try {
    const { getSupabaseAdminClient, isSupabaseConfigured } = await import('./supabaseClient.ts');
    if (isSupabaseConfigured()) {
      const client = getSupabaseAdminClient();
      console.log('[Purge] Purging demo and test schools from Supabase...');
      // List of demo and test school IDs
      const { data: allSchools } = await client.from('schools').select('id, email, code, name');
      if (allSchools && allSchools.length > 0) {
        for (const sch of allSchools) {
          const isRealSchool = sch.email?.toLowerCase().includes('samuelemma466') || sch.code === 'SOFIAT';
          if (!isRealSchool) {
            console.log(`[Purge] Deleting demo/test school: ${sch.name} (${sch.id})`);
            const childTables = [
              'attendance_records',
              'attendance_sessions',
              'subject_results',
              'student_term_remarks',
              'homework',
              'fee_payments',
              'fee_accounts',
              'digital_approvals',
              'notices',
              'teacher_subject_assignments',
              'students',
              'classes',
              'subjects',
              'staff',
              'school_users',
              'school_settings',
              'academic_sessions',
            ];
            for (const table of childTables) {
              try {
                await client.from(table).delete().eq('school_id', sch.id);
              } catch (e) {
                // ignore
              }
            }
            await client.from('schools').delete().eq('id', sch.id);
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('[Purge] Supabase purge notice:', err?.message || err);
  }

  // 3. Clear Local JSON storage (.data/schoolcore_db.json)
  try {
    const { db: localDb } = await import('./db.ts');
    localDb.clearAllData();
    console.log('[Purge] Reset local db to clean state with Super Admin samuelemma466@gmail.com.');
  } catch (err: any) {
    console.warn('[Purge] Error resetting local db file:', err);
  }

  return {
    success: true,
    message: 'All demo and test run details, test records, and accounts have been permanently purged.',
    deletedCounts,
  };
}

if (process.argv[1] && process.argv[1].endsWith('purgeDemoData.ts')) {
  purgeAllDemoData()
    .then((res) => {
      console.log('Purge completed successfully:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Purge failed:', err);
      process.exit(1);
    });
}
