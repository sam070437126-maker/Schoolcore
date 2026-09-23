import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebaseClient.ts';
import { getInitialSeedData } from './seed.ts';

function sanitize(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

export async function seedFirestoreDatabase(force = false): Promise<{ success: boolean; message: string; counts: Record<string, number> }> {
  const db = getFirebaseFirestore();
  const seed = getInitialSeedData();
  const counts: Record<string, number> = {};

  // Always ensure Super Master Admin exists
  try {
    for (const profile of seed.profiles) {
      const docRef = doc(db, 'profiles', profile.id);
      await setDoc(docRef, sanitize(profile), { merge: true });
    }
    for (const membership of seed.schoolUsers) {
      const docRef = doc(db, 'schoolUsers', membership.id);
      await setDoc(docRef, sanitize(membership), { merge: true });
    }
    for (const log of seed.auditLogs) {
      const docRef = doc(db, 'auditLogs', log.id);
      await setDoc(docRef, sanitize(log), { merge: true });
    }
    counts['profiles'] = seed.profiles.length;
    counts['schoolUsers'] = seed.schoolUsers.length;
    console.log('[seedFirestoreDatabase] Super Master Admin profile and membership ensured in Firestore.');
  } catch (err: any) {
    console.error('[seedFirestoreDatabase] Error ensuring Super Master Admin:', err);
  }

  return {
    success: true,
    message: 'Firestore initialized with Super Master Admin samuelemma466@gmail.com',
    counts,
  };
}
