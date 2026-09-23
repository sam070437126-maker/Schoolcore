import { getSupabaseClient } from './supabaseClient.ts';
import { resolveSupabaseConfig } from './supabaseConfig.ts';

export interface GoogleOAuthOptions {
  redirectTo?: string;
  skipBrowserRedirect?: boolean;
  popup?: boolean;
}

/**
 * Returns the canonical redirect URI for OAuth callbacks in the current environment.
 * Matches local development (http://localhost:3000) or preview containers.
 */
export function getOAuthRedirectUri(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}`;
  }
  return 'http://localhost:3000';
}

/**
 * Returns the dedicated auth callback URI if configured in Supabase.
 */
export function getOAuthCallbackUri(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  return 'http://localhost:3000/auth/callback';
}

/**
 * Returns configuration diagnostics for Supabase Google OAuth and redirect URIs.
 */
export function getGoogleOAuthDiagnostics() {
  const { url, anonKey } = resolveSupabaseConfig();
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const supabaseProjectRef = url.replace('https://', '').split('.')[0] || 'vpkxkmglbzqyfgvoizjs';

  return {
    supabaseUrl: url,
    supabaseAnonKeyPrefix: anonKey ? `${anonKey.substring(0, 12)}...` : 'not_set',
    currentOrigin,
    localRedirectUri: `${currentOrigin}`,
    localCallbackUri: `${currentOrigin}/auth/callback`,
    supabaseAuthCallbackUrl: `https://${supabaseProjectRef}.supabase.co/auth/v1/callback`,
    requiredGoogleConsoleRedirectUri: `https://${supabaseProjectRef}.supabase.co/auth/v1/callback`,
    recommendedSupabaseRedirectUrls: [
      `${currentOrigin}/**`,
      `${currentOrigin}`,
      `${currentOrigin}/auth/callback`,
      'http://localhost:3000/**',
      'http://localhost:3000',
      'http://localhost:3000/auth/callback',
      'https://ais-dev-w6j4zf2e3k64g67nhumsqx-43070850185.europe-west3.run.app/**',
      'https://ais-pre-w6j4zf2e3k64g67nhumsqx-43070850185.europe-west3.run.app/**',
    ],
  };
}

/**
 * Executes Supabase signInWithOAuth for the 'google' provider
 * with proper query parameters, offline access, and redirect configuration.
 */
export async function signInWithGoogleOAuth(options?: GoogleOAuthOptions) {
  const supabase = getSupabaseClient();
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const redirectUrl = options?.redirectTo || getOAuthRedirectUri();
  const shouldSkipRedirect = options?.skipBrowserRedirect ?? (isIframe || options?.popup);

  console.log('[Supabase OAuth] Initiating signInWithOAuth for Google:', {
    provider: 'google',
    redirectTo: redirectUrl,
    skipBrowserRedirect: shouldSkipRedirect,
    isIframe,
  });

  const response = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      skipBrowserRedirect: shouldSkipRedirect,
    },
  });

  if (response.error) {
    console.error('[Supabase OAuth] signInWithOAuth failed:', response.error);
    return { data: null, error: response.error, url: null };
  }

  // When skipBrowserRedirect is true or running in iframe, open auth URL in popup
  if (response.data?.url && shouldSkipRedirect && typeof window !== 'undefined') {
    const width = 540;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      response.data.url,
      'supabase_google_oauth',
      `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      console.warn('[Supabase OAuth] Popup was blocked by browser. Falling back to top-level navigation.');
      window.location.href = response.data.url;
    }
  }

  return {
    data: response.data,
    error: null,
    url: response.data?.url || null,
  };
}
