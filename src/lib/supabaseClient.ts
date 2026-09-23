import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  resolveSupabaseConfig,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
} from './supabaseConfig.ts';

const config = resolveSupabaseConfig();
export const SUPABASE_URL = config.url;
export const SUPABASE_KEY = config.anonKey;

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.warn('[Supabase] Error initializing client with resolved config, using fallback:', err);
      supabaseInstance = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();
export default supabase;
