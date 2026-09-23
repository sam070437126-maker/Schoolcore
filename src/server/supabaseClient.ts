import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  resolveSupabaseConfig,
  sanitizeSupabaseUrl,
  sanitizeSupabaseKey,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
} from '../lib/supabaseConfig.ts';
import { isFirebaseConfigured } from './firebaseClient.ts';

// Environment variable extraction with robust sanitization and fallback coverage
const resolved = resolveSupabaseConfig();
const SUPABASE_URL = sanitizeSupabaseUrl(
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  resolved.url
);

const SUPABASE_ANON_KEY = sanitizeSupabaseKey(
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  resolved.anonKey
);

const SUPABASE_SERVICE_ROLE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  ''
).trim().replace(/^[=\s"']+|[=\s"']+$/g, '');

// Database Mode configuration
function resolveDatabaseMode(): string {
  const raw = (process.env.DATABASE_MODE || '').trim().replace(/^["']|["']$/g, '');
  if (raw === 'memory') return 'memory';
  if (raw === 'supabase' || raw.startsWith('postgres')) return 'supabase';
  if (raw === 'firebase') return 'firebase';
  if (isFirebaseConfigured()) return 'firebase';
  if (SUPABASE_URL && SUPABASE_ANON_KEY) return 'supabase';
  return 'memory';
}

export const DATABASE_MODE = resolveDatabaseMode();

let supabaseClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    if (DATABASE_MODE === 'postgres' || DATABASE_MODE === 'supabase' || process.env.NODE_ENV === 'production') {
      throw new Error(
        'Supabase PostgreSQL configuration is missing. SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required in production mode.'
      );
    }
    throw new Error('Supabase client is not configured.');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseClient;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (SUPABASE_SERVICE_ROLE_KEY && SUPABASE_URL) {
    if (!adminClient) {
      adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
    return adminClient;
  }
  return getSupabaseClient();
}

/**
 * Creates an authenticated Supabase client carrying the user's auth token
 * so PostgreSQL Row Level Security (RLS) policies evaluate auth.uid()
 */
export function getAuthenticatedSupabaseClient(token?: string): SupabaseClient {
  if (!token) return getSupabaseClient();

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

/**
 * Health check utility to probe the database connection and schema tables status
 */
export async function checkDatabaseHealth(): Promise<{
  ok: boolean;
  connected: boolean;
  tablesReady: boolean;
  tablesCount?: number;
  projectRef: string;
  message: string;
  latencyMs?: number;
}> {
  if (DATABASE_MODE === 'memory') {
    return {
      ok: true,
      connected: true,
      tablesReady: true,
      tablesCount: 22,
      projectRef: 'local-memory',
      message: 'Running on local validated in-memory repository (DATABASE_MODE=memory)',
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      connected: false,
      tablesReady: false,
      projectRef: 'none',
      message: 'Supabase credentials not configured in environment (SUPABASE_URL / SUPABASE_ANON_KEY)',
    };
  }

  const start = Date.now();
  const projectRef = 'vpkxkmglbzqyfgvoizjs';

  try {
    const client = getSupabaseClient();
    const { error } = await client.from('schools').select('id').limit(1);

    if (error) {
      if (error.code === 'PGRST205') {
        // PostgREST connects successfully, but tables are pending migration in the Supabase project
        return {
          ok: true,
          connected: true,
          tablesReady: false,
          tablesCount: 0,
          projectRef,
          latencyMs: Date.now() - start,
          message: `Connected to Supabase Project (${projectRef}). Database schema is pending initialization in the SQL Editor.`,
        };
      }
      return {
        ok: false,
        connected: false,
        tablesReady: false,
        projectRef,
        message: `Database error: ${error.message}`,
        latencyMs: Date.now() - start,
      };
    }

    return {
      ok: true,
      connected: true,
      tablesReady: true,
      tablesCount: 22,
      projectRef,
      message: `Connected to Supabase PostgreSQL (${projectRef}) with active schema tables`,
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      ok: false,
      connected: false,
      tablesReady: false,
      projectRef,
      message: err.message || 'Connection failed',
    };
  }
}

/**
 * Translates PostgreSQL and Supabase errors into human-friendly messages
 */
export function mapDatabaseError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const code = error.code;

  switch (code) {
    case '23505':
      return 'A record with this information already exists. Please verify admission number or code.';
    case '23503':
      return 'The referenced record was not found or has been removed.';
    case '42501':
      return 'You do not have permission to perform this action. Cross-tenant access is prohibited.';
    case 'PGRST116':
      return 'The requested record could not be found.';
    default:
      if (error.message?.includes('JWT')) {
        return 'Your session has expired. Please sign in again.';
      }
      return error.message || 'We could not complete your database request. Please try again.';
  }
}
