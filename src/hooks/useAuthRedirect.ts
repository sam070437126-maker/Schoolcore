import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { getStoredToken, clearStoredToken } from '../lib/api.ts';

export interface AuthRedirectOptions {
  requiredRole?: string;
  onSessionExpired?: () => void;
  onInviteTokenFound?: (token: string) => void;
}

export function useAuthRedirect(options?: AuthRedirectOptions) {
  const { user, role, isLoading, isAuthenticated, refreshAuth, logout } = useAuth();
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // 1. Detect invite token from URL
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('invite_token');
      if (token && token.trim().length > 0) {
        setInviteToken(token.trim());
        if (options?.onInviteTokenFound) {
          options.onInviteTokenFound(token.trim());
        }
      }
    } catch {
      // ignore
    }
  }, [options]);

  // 2. Session Integrity and Recovery
  const checkSessionIntegrity = useCallback(async (): Promise<boolean> => {
    const token = getStoredToken();
    if (!token) {
      return false;
    }

    // Inspect token format and TTL timestamp if encoded in sck_sec_
    if (token.startsWith('sck_sec_')) {
      const parts = token.slice(8).split('___');
      if (parts.length >= 3) {
        const createdAt = parseInt(parts[2], 10);
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        if (!isNaN(createdAt) && Date.now() - createdAt > SEVEN_DAYS_MS) {
          console.warn('[useAuthRedirect] Session token has expired (TTL exceeded). Purging session.');
          clearStoredToken();
          if (options?.onSessionExpired) {
            options.onSessionExpired();
          }
          await logout();
          return false;
        }
      }
    }

    return true;
  }, [options, logout]);

  // 3. Clear invite token from URL without reloading
  const clearInviteTokenFromUrl = useCallback(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('invite_token');
      window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
      setInviteToken(null);
    } catch {
      setInviteToken(null);
    }
  }, []);

  return {
    user,
    role,
    isLoading,
    isAuthenticated,
    inviteToken,
    isVerifying,
    setIsVerifying,
    checkSessionIntegrity,
    clearInviteTokenFromUrl,
    refreshAuth,
  };
}
