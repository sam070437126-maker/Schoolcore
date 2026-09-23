import {
  DATABASE_MODE as SUPABASE_DATABASE_MODE,
  isSupabaseConfigured,
  checkDatabaseHealth,
} from '../supabaseClient.ts';
import { isFirebaseConfigured, checkFirebaseHealth } from '../firebaseClient.ts';
import { IRepositories } from './types.ts';
import { createFirebaseRepositories } from './firebase/firebaseRepositories.ts';
import { createSupabaseRepositories } from './supabase/supabaseRepositories.ts';
import { createMemoryRepositories } from './memory/memoryRepositories.ts';

export function resolveEffectiveDatabaseMode(): string {
  const raw = (process.env.DATABASE_MODE || '').trim().replace(/^["']|["']$/g, '');
  if (raw === 'memory') return 'memory';
  if (raw === 'supabase' || raw.startsWith('postgres')) return 'supabase';
  if (raw === 'firebase') return 'firebase';
  if (isFirebaseConfigured()) return 'firebase';
  if (isSupabaseConfigured()) return 'supabase';
  return 'memory';
}

export const DATABASE_MODE = resolveEffectiveDatabaseMode();

let activeRepositories: IRepositories | null = null;

export function getRepositories(): IRepositories {
  if (activeRepositories) {
    return activeRepositories;
  }

  // 1. Firebase / Firestore Mode (Authoritative Persistent Cloud Store)
  if (DATABASE_MODE === 'firebase') {
    if (!isFirebaseConfigured()) {
      throw new Error(
        'Firebase configuration error: Production Firebase mode requires valid Firebase credentials. Please verify firebase-applet-config.json.'
      );
    }
    console.log('[SchoolCore] Initialized with Cloud Firestore as repository.');
    activeRepositories = createFirebaseRepositories();
    return activeRepositories;
  }

  // 2. Supabase PostgreSQL Mode
  if (DATABASE_MODE === 'supabase' || DATABASE_MODE === 'postgres') {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Database configuration error: Supabase mode requires valid SUPABASE_URL and SUPABASE_ANON_KEY.'
      );
    }
    console.log('[SchoolCore] Initialized with Supabase PostgreSQL as authoritative repository.');
    activeRepositories = createSupabaseRepositories();
    return activeRepositories;
  }

  // 3. Isolated Development / Testing Memory Mode
  if (DATABASE_MODE === 'memory') {
    console.warn(
      '[SchoolCore Notice] Running in explicit DEVELOPMENT/TEST memory mode (DATABASE_MODE=memory).'
    );
    activeRepositories = createMemoryRepositories();
    return activeRepositories;
  }

  // Fallback
  activeRepositories = isFirebaseConfigured() ? createFirebaseRepositories() : createMemoryRepositories();
  return activeRepositories;
}

// Named export of active repositories singleton
export const repositories: IRepositories = new Proxy({} as IRepositories, {
  get(_target, prop: keyof IRepositories) {
    const repos = getRepositories();
    return repos[prop];
  },
});

export async function checkActiveDatabaseHealth() {
  if (DATABASE_MODE === 'firebase' || isFirebaseConfigured()) {
    return checkFirebaseHealth();
  }
  if (DATABASE_MODE === 'supabase' || DATABASE_MODE === 'postgres' || isSupabaseConfigured()) {
    return checkDatabaseHealth();
  }
  return checkDatabaseHealth();
}

export * from './types.ts';
export { checkActiveDatabaseHealth as checkDatabaseHealth };
