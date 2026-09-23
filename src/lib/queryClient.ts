import { QueryClient } from '@tanstack/react-query';

/**
 * Standardized TanStack Query Client for SchoolCore.
 * Designed for low-latency updates, offline resilience, and automatic cache invalidation
 * triggered by Supabase Realtime channel subscriptions.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes stale time (real-time subscriptions push changes immediately)
      gcTime: 1000 * 60 * 15, // 15 minutes garbage collection time
      retry: 1,
      refetchOnWindowFocus: false, // Prevent redundant HTTP requests over low bandwidth
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

export interface VersionedEntity<T> {
  data: T;
  version: number;
  lastUpdated: number;
}
