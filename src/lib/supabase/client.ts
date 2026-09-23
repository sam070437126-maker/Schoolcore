import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  resolveSupabaseConfig,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
} from '../supabaseConfig.ts';

export function createClient(): SupabaseClient {
  const { url, anonKey } = resolveSupabaseConfig();
  try {
    return createBrowserClient(url, anonKey);
  } catch (err) {
    console.warn('[Supabase SSR] Error creating browser client, using fallback:', err);
    return createBrowserClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
  }
}

export default createClient;
