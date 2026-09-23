/**
 * Centralized Supabase configuration and URL/key sanitization.
 * Prevents "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL"
 * when environment variables contain leading '=' signs, whitespace, surrounding quotes,
 * or when publishable keys are mistakenly placed into the URL variable.
 */

export const DEFAULT_SUPABASE_URL = 'https://vpkxkmglbzqyfgvoizjs.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_UG0DxyzhN5LGS9PdJnlbnw_TbJpw9NO';

/**
 * Sanitizes and validates a Supabase project URL.
 * Always returns a clean, valid HTTP or HTTPS URL.
 */
export function sanitizeSupabaseUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') {
    return DEFAULT_SUPABASE_URL;
  }

  // Strip leading and trailing equals, quotes, and whitespace
  let cleaned = raw.trim().replace(/^[=\s"']+|[=\s"']+$/g, '');

  // If a publishable or service role key was mistakenly supplied as the URL
  if (
    cleaned.startsWith('sb_') ||
    cleaned.startsWith('eyJ') ||
    (!cleaned.includes('.') && !cleaned.includes('localhost'))
  ) {
    return DEFAULT_SUPABASE_URL;
  }

  // Prepend protocol if omitted
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      // Remove trailing slashes for clean client initialization
      return parsed.origin + (parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, ''));
    }
  } catch {
    // Malformed URL format - return safe default
  }

  return DEFAULT_SUPABASE_URL;
}

/**
 * Sanitizes a Supabase Anon / Publishable or Service Key.
 */
export function sanitizeSupabaseKey(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') {
    return DEFAULT_SUPABASE_ANON_KEY;
  }

  let cleaned = raw.trim().replace(/^[=\s"']+|[=\s"']+$/g, '');

  // If a URL was mistakenly supplied as the key
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://') || cleaned.startsWith('//')) {
    return DEFAULT_SUPABASE_ANON_KEY;
  }

  if (cleaned.length < 10) {
    return DEFAULT_SUPABASE_ANON_KEY;
  }

  return cleaned;
}

/**
 * Resolves verified, sanitized Supabase credentials across Vite (import.meta.env),
 * Next.js, and Node (process.env) runtimes.
 */
export function resolveSupabaseConfig(): { url: string; anonKey: string } {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  const procEnv = typeof process !== 'undefined' ? process.env : undefined;

  const urlCandidates = [
    procEnv?.SUPABASE_URL,
    metaEnv?.VITE_SUPABASE_URL,
    procEnv?.VITE_SUPABASE_URL,
    procEnv?.NEXT_PUBLIC_SUPABASE_URL,
  ];

  let resolvedUrl = DEFAULT_SUPABASE_URL;
  for (const candidate of urlCandidates) {
    if (candidate && typeof candidate === 'string') {
      const sanitized = sanitizeSupabaseUrl(candidate);
      const trimmed = candidate.trim().replace(/^[=\s"']+|[=\s"']+$/g, '');
      // Only pick if it's not falling back due to candidate being an auth key
      if (!trimmed.startsWith('sb_') && !trimmed.startsWith('eyJ')) {
        resolvedUrl = sanitized;
        break;
      }
    }
  }

  const keyCandidates = [
    procEnv?.SUPABASE_ANON_KEY,
    procEnv?.SUPABASE_PUBLISHABLE_KEY,
    metaEnv?.VITE_SUPABASE_ANON_KEY,
    metaEnv?.VITE_SUPABASE_PUBLISHABLE_KEY,
    procEnv?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    procEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    procEnv?.NEXT_PUBLIC_SUPABASE_URL, // In case key was assigned to NEXT_PUBLIC_SUPABASE_URL
  ];

  let resolvedKey = DEFAULT_SUPABASE_ANON_KEY;
  for (const candidate of keyCandidates) {
    if (candidate && typeof candidate === 'string') {
      const sanitized = sanitizeSupabaseKey(candidate);
      const trimmed = candidate.trim().replace(/^[=\s"']+|[=\s"']+$/g, '');
      if (sanitized !== DEFAULT_SUPABASE_ANON_KEY || trimmed.startsWith('sb_') || trimmed.startsWith('eyJ')) {
        resolvedKey = sanitized;
        break;
      }
    }
  }

  return { url: resolvedUrl, anonKey: resolvedKey };
}
