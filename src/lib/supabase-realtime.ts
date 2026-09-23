import { useEffect, useRef } from 'react';
import { supabase } from './supabaseClient.ts';
import { RealtimeChannel } from '@supabase/supabase-js';

// Local cross-tab & cross-component event bus for guaranteed zero-latency sync
const LOCAL_EVENT_NAME = 'schoolcore:realtime-event';

export interface RealtimeEventPayload {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC';
  new?: any;
  old?: any;
  schoolId?: string;
  familyGroupId?: string;
  timestamp: number;
}

/**
 * Broadcasts a local event across the current window and all other browser tabs.
 * This guarantees instant feedback even if the network or WebSocket reconnects.
 */
export function broadcastRealtimeUpdate(
  table: 'notices' | 'attendance_records' | 'attendance_sessions' | 'students' | 'classes' | 'user_notifications' | 'parent_student' | 'invitations' | 'profiles' | 'users' | 'staff',
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC' = 'UPDATE',
  payload?: { new?: any; old?: any; schoolId?: string; familyGroupId?: string }
) {
  const detail: RealtimeEventPayload = {
    table,
    eventType,
    new: payload?.new,
    old: payload?.old,
    schoolId: payload?.schoolId,
    familyGroupId: payload?.familyGroupId,
    timestamp: Date.now(),
  };

  // Dispatch on current window
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOCAL_EVENT_NAME, { detail }));

    // Dispatch via localStorage storage event to sync with other browser tabs
    try {
      localStorage.setItem('schoolcore_rt_sync', JSON.stringify(detail));
    } catch {
      // Storage quota or privacy sandbox, silently ignored
    }
  }
}

/**
 * Subscribes to PostgreSQL changes on Supabase for a specific table.
 * Returns an unsubscription function.
 */
export function subscribeToTable(
  table: string,
  onEvent: (payload: any) => void,
  filter?: string
): () => void {
  try {
    const channelId = `realtime_${table}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    const channel: RealtimeChannel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          onEvent(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Connected to Supabase realtime replication
        } else if (status === 'CHANNEL_ERROR') {
          console.warn(`[Supabase Realtime] Reconnecting channel for table ${table}...`);
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.error(`[Supabase Realtime] Error removing channel for ${table}:`, err);
      }
    };
  } catch (err) {
    console.warn(`[Supabase Realtime] Could not initialize subscription for table ${table}:`, err);
    return () => {};
  }
}

/**
 * Convenience listener for school notices.
 */
export function subscribeToNotices(onUpdate: (payload?: any) => void): () => void {
  const unsubRemote = subscribeToTable('notices', onUpdate);

  const handleLocal = (e: Event) => {
    const custom = e as CustomEvent<RealtimeEventPayload>;
    if (custom.detail?.table === 'notices') {
      onUpdate(custom.detail);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'schoolcore_rt_sync' && e.newValue) {
      try {
        const detail = JSON.parse(e.newValue) as RealtimeEventPayload;
        if (detail.table === 'notices') {
          onUpdate(detail);
        }
      } catch {
        // Safe JSON parsing
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(LOCAL_EVENT_NAME, handleLocal);
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    unsubRemote();
    if (typeof window !== 'undefined') {
      window.removeEventListener(LOCAL_EVENT_NAME, handleLocal);
      window.removeEventListener('storage', handleStorage);
    }
  };
}

/**
 * Convenience listener for attendance records & sessions.
 */
export function subscribeToAttendance(onUpdate: (payload?: any) => void): () => void {
  const unsubSessions = subscribeToTable('attendance_sessions', onUpdate);
  const unsubRecords = subscribeToTable('attendance_records', onUpdate);

  const handleLocal = (e: Event) => {
    const custom = e as CustomEvent<RealtimeEventPayload>;
    if (
      custom.detail?.table === 'attendance_records' ||
      custom.detail?.table === 'attendance_sessions'
    ) {
      onUpdate(custom.detail);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'schoolcore_rt_sync' && e.newValue) {
      try {
        const detail = JSON.parse(e.newValue) as RealtimeEventPayload;
        if (
          detail.table === 'attendance_records' ||
          detail.table === 'attendance_sessions'
        ) {
          onUpdate(detail);
        }
      } catch {
        // Safe parse
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(LOCAL_EVENT_NAME, handleLocal);
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    unsubSessions();
    unsubRecords();
    if (typeof window !== 'undefined') {
      window.removeEventListener(LOCAL_EVENT_NAME, handleLocal);
      window.removeEventListener('storage', handleStorage);
    }
  };
}

/**
 * Convenience listener for student records and updates.
 */
export function subscribeToStudents(onUpdate: (payload?: any) => void): () => void {
  const unsubRemote = subscribeToTable('students', onUpdate);

  const handleLocal = (e: Event) => {
    const custom = e as CustomEvent<RealtimeEventPayload>;
    if (custom.detail?.table === 'students') {
      onUpdate(custom.detail);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'schoolcore_rt_sync' && e.newValue) {
      try {
        const detail = JSON.parse(e.newValue) as RealtimeEventPayload;
        if (detail.table === 'students') {
          onUpdate(detail);
        }
      } catch {
        // Safe parse
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(LOCAL_EVENT_NAME, handleLocal);
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    unsubRemote();
    if (typeof window !== 'undefined') {
      window.removeEventListener(LOCAL_EVENT_NAME, handleLocal);
      window.removeEventListener('storage', handleStorage);
    }
  };
}

/**
 * Scoped Real-Time Channel for Family Units.
 * Subscribes to notifications and events keyed by family_group_id rather than a generic school_id.
 * Ensures dual-guardian synchronization where announcements are pushed simultaneously to both parents.
 */
export function subscribeToFamilyChannel(
  familyGroupId: string,
  onUpdate: (payload?: any) => void
): () => void {
  if (!familyGroupId) return () => {};

  // Supabase Postgres changes filter for this family_group_id
  const unsubRemote = subscribeToTable(
    'user_notifications',
    (payload) => {
      onUpdate(payload);
    },
    `family_group_id=eq.${familyGroupId}`
  );

  // Cross-tab and in-memory event listener
  const handleLocal = (e: Event) => {
    const custom = e as CustomEvent<RealtimeEventPayload>;
    if (
      custom.detail?.table === 'user_notifications' &&
      (!custom.detail.familyGroupId || custom.detail.familyGroupId === familyGroupId)
    ) {
      onUpdate(custom.detail);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'schoolcore_rt_sync' && e.newValue) {
      try {
        const detail = JSON.parse(e.newValue) as RealtimeEventPayload;
        if (
          detail.table === 'user_notifications' &&
          (!detail.familyGroupId || detail.familyGroupId === familyGroupId)
        ) {
          onUpdate(detail);
        }
      } catch {
        // Safe parse
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(LOCAL_EVENT_NAME, handleLocal);
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    unsubRemote();
    if (typeof window !== 'undefined') {
      window.removeEventListener(LOCAL_EVENT_NAME, handleLocal);
      window.removeEventListener('storage', handleStorage);
    }
  };
}

/**
 * Convenience listener for school users and profiles.
 */
export function subscribeToUsers(onUpdate: (payload?: any) => void): () => void {
  const unsubRemote = subscribeToTable('profiles', onUpdate);

  const handleLocal = (e: Event) => {
    const custom = e as CustomEvent<RealtimeEventPayload>;
    if (custom.detail?.table === 'profiles' || custom.detail?.table === 'users') {
      onUpdate(custom.detail);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'schoolcore_rt_sync' && e.newValue) {
      try {
        const detail = JSON.parse(e.newValue) as RealtimeEventPayload;
        if (detail.table === 'profiles' || detail.table === 'users') {
          onUpdate(detail);
        }
      } catch {
        // Safe JSON parsing
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(LOCAL_EVENT_NAME, handleLocal);
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    unsubRemote();
    if (typeof window !== 'undefined') {
      window.removeEventListener(LOCAL_EVENT_NAME, handleLocal);
      window.removeEventListener('storage', handleStorage);
    }
  };
}

/**
 * React Hook for Supabase Realtime synchronization with automatic cleanup.
 */
export function useRealtimeSubscription(
  table: 'notices' | 'attendance' | 'students' | 'family' | 'users',
  onUpdate: (payload?: any) => void,
  enabled: boolean = true,
  familyGroupId?: string
) {
  const savedCallback = useRef(onUpdate);

  useEffect(() => {
    savedCallback.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled) return;

    let unsub: () => void;

    if (table === 'notices') {
      unsub = subscribeToNotices((payload) => savedCallback.current(payload));
    } else if (table === 'attendance') {
      unsub = subscribeToAttendance((payload) => savedCallback.current(payload));
    } else if (table === 'students') {
      unsub = subscribeToStudents((payload) => savedCallback.current(payload));
    } else if (table === 'users') {
      unsub = subscribeToUsers((payload) => savedCallback.current(payload));
    } else if (table === 'family' && familyGroupId) {
      unsub = subscribeToFamilyChannel(familyGroupId, (payload) => savedCallback.current(payload));
    } else {
      unsub = () => {};
    }

    return () => {
      if (unsub) unsub();
    };
  }, [table, enabled, familyGroupId]);
}
