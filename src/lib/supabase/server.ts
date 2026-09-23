import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  resolveSupabaseConfig,
  sanitizeSupabaseKey,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
} from '../supabaseConfig.ts';

export function createServerSupabaseClient(cookies?: {
  get: (name: string) => string | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
  remove: (name: string, options: CookieOptions) => void;
}): SupabaseClient {
  const { url, anonKey } = resolveSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceRoleKey ? sanitizeSupabaseKey(serviceRoleKey) : anonKey;

  try {
    return createServerClient(url, key, {
      cookies: {
        get(name: string) {
          return cookies?.get(name);
        },
        set(name: string, value: string, options: CookieOptions) {
          cookies?.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          cookies?.remove(name, options);
        },
      },
    });
  } catch (err) {
    console.warn('[Supabase SSR] Error creating server client, using fallback:', err);
    return createServerClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
      cookies: {
        get(name: string) {
          return cookies?.get(name);
        },
        set(name: string, value: string, options: CookieOptions) {
          cookies?.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          cookies?.remove(name, options);
        },
      },
    });
  }
}
