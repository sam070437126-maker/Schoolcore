import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

export interface FirebaseAppletConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
  oAuthClientId?: string;
}

let cachedConfig: FirebaseAppletConfig | null = null;
let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

export function loadFirebaseConfig(): FirebaseAppletConfig | null {
  if (cachedConfig) return cachedConfig;

  // 1. Try reading firebase-applet-config.json
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      cachedConfig = JSON.parse(raw);
      return cachedConfig;
    } catch (e) {
      console.warn('[SchoolCore Firebase] Failed to parse firebase-applet-config.json:', e);
    }
  }

  // 2. Try environment variables
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_API_KEY) {
    cachedConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.FIREBASE_APP_ID || '',
      firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || undefined,
    };
    return cachedConfig;
  }

  return null;
}

export function isFirebaseConfigured(): boolean {
  const config = loadFirebaseConfig();
  return Boolean(config && config.projectId && config.apiKey);
}

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp;

  const config = loadFirebaseConfig();
  if (!config) {
    throw new Error('Firebase configuration not found. Please ensure firebase-applet-config.json exists or FIREBASE_* environment variables are set.');
  }

  if (getApps().length > 0) {
    firebaseApp = getApp();
  } else {
    firebaseApp = initializeApp(config);
  }

  return firebaseApp;
}

export function getFirebaseFirestore(): Firestore {
  if (firestoreDb) return firestoreDb;

  const app = getFirebaseApp();
  const config = loadFirebaseConfig();
  firestoreDb = getFirestore(app, config?.firestoreDatabaseId || undefined);
  return firestoreDb;
}

export async function checkFirebaseHealth(): Promise<{
  ok: boolean;
  connected: boolean;
  message: string;
  projectId?: string;
  databaseId?: string;
  latencyMs?: number;
  error?: string;
}> {
  if (!isFirebaseConfigured()) {
    return {
      ok: false,
      connected: false,
      message: 'Firebase is not configured. Missing credentials.',
      error: 'Firebase is not configured. Missing credentials.',
    };
  }

  const start = Date.now();
  try {
    const db = getFirebaseFirestore();
    const config = loadFirebaseConfig();
    const probeRef = doc(db, 'healthcheck', `probe-${Date.now()}`);
    await setDoc(probeRef, {
      service: 'SchoolCore-Backend',
      timestamp: Timestamp.now(),
      status: 'healthy',
    });
    await getDoc(probeRef);
    await deleteDoc(probeRef);

    const latency = Date.now() - start;
    return {
      ok: true,
      connected: true,
      message: `Cloud Firestore connected (${latency}ms)`,
      projectId: config?.projectId,
      databaseId: config?.firestoreDatabaseId || '(default)',
      latencyMs: latency,
    };
  } catch (err: any) {
    return {
      ok: false,
      connected: false,
      message: err.message || String(err),
      error: err.message || String(err),
    };
  }
}

export function mapFirestoreError(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const code = err.code || '';
  const msg = err.message || String(err);

  if (code === 'permission-denied' || msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
    return 'Permission denied by Firestore security rules. Your account is not authorized for this operation or tenant boundary.';
  }
  if (code === 'not-found' || msg.includes('not-found')) {
    return 'The requested record could not be found.';
  }
  if (code === 'already-exists' || msg.includes('already-exists')) {
    return 'A record with this identifier already exists.';
  }
  if (code === 'resource-exhausted') {
    return 'Service quota or rate limit exceeded. Please try again shortly.';
  }
  if (code === 'unavailable') {
    return 'The database is temporarily unreachable. Your connection appears unstable.';
  }
  return msg;
}
