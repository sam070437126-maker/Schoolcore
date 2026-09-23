import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.ts';
import { DashboardStats, AttendanceStatus, UserNotification } from '../types/index.ts';
import { subscribeToTable, subscribeToFamilyChannel, broadcastRealtimeUpdate } from '../lib/supabase-realtime.ts';

export interface VersionedDashboardStats extends DashboardStats {
  _version: number;
  _lastSyncedAt: number;
}

const DASHBOARD_QUERY_KEY = ['dashboard', 'stats'];

/**
 * Universal Real-Time Dashboard Hook with Supabase channel subscription,
 * concurrency version-tagging, and zero polling overhead.
 * Supports Scoped Real-Time Channels keyed by family_group_id.
 */
export function useRealtimeDashboard(schoolId?: string, userId?: string, familyGroupId?: string) {
  const queryClient = useQueryClient();
  const versionRef = useRef<number>(1);

  const queryKey = [...DASHBOARD_QUERY_KEY, schoolId || 'all', userId || 'me', familyGroupId || 'global'];

  const query = useQuery<VersionedDashboardStats>({
    queryKey,
    queryFn: async () => {
      const data = await api.getDashboardStats();
      versionRef.current += 1;
      return {
        ...data,
        _version: versionRef.current,
        _lastSyncedAt: Date.now(),
      };
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
  });

  // Supabase Real-Time Channel Subscriptions
  useEffect(() => {
    // Invalidate dashboard stats whenever attendance, students, or classes mutate
    const handleRemoteEvent = (payload: any) => {
      // Increment local version tag on push event
      versionRef.current += 1;
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const unsubAttendance = subscribeToTable('attendance_records', handleRemoteEvent);
    const unsubSessions = subscribeToTable('attendance_sessions', handleRemoteEvent);
    const unsubStudents = subscribeToTable('students', handleRemoteEvent);
    const unsubNotices = subscribeToTable('notices', handleRemoteEvent);

    // Scoped Real-Time Channel for Family Units
    let unsubFamily = () => {};
    if (familyGroupId) {
      unsubFamily = subscribeToFamilyChannel(familyGroupId, (payload) => {
        versionRef.current += 1;
        queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['family', 'guardians'] });
      });
    }

    return () => {
      unsubAttendance();
      unsubSessions();
      unsubStudents();
      unsubNotices();
      unsubFamily();
    };
  }, [queryClient, familyGroupId]);

  return {
    stats: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    version: query.data?._version ?? versionRef.current,
  };
}

/**
 * Scoped Real-Time Hook for Family Notifications
 */
export function useFamilyNotifications(familyGroupId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<{
    notifications: UserNotification[];
    unreadCount: number;
    familyGroupIds: string[];
  }>({
    queryKey: ['notifications', familyGroupId || 'current'],
    queryFn: async () => {
      return api.getUserNotifications();
    },
    staleTime: 1000 * 30, // 30s
  });

  useEffect(() => {
    if (!familyGroupId) return;

    const unsub = subscribeToFamilyChannel(familyGroupId, () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      unsub();
    };
  }, [queryClient, familyGroupId]);

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.markNotificationRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return api.markAllNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: query.data?.notifications || [],
    unreadCount: query.data?.unreadCount || 0,
    familyGroupIds: query.data?.familyGroupIds || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    markAsRead: markReadMutation.mutate,
    markAllAsRead: markAllReadMutation.mutate,
  };
}

/**
 * Optimistic attendance submission hook.
 * Uses TanStack Query onMutate to instantly reflect present/absent/late totals
 * in the active dashboard before network completion, with automatic rollback.
 */
export function useOptimisticAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      classId: string;
      date: string;
      sessionType: string;
      records: Array<{ student_id: string; status: AttendanceStatus; remarks?: string }>;
      remarks?: string;
    }) => {
      const result = await api.saveAttendanceSession(payload);
      // Broadcast real-time event
      broadcastRealtimeUpdate('attendance_records', 'SYNC', { schoolId: result?.session?.school_id });
      return result;
    },
    onMutate: async (newAttendance) => {
      // Cancel outgoing queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEY });

      // Snapshot previous dashboard cache
      const previousDashboard = queryClient.getQueryData<VersionedDashboardStats>(DASHBOARD_QUERY_KEY);

      if (previousDashboard) {
        // Calculate new attendance breakdown optimistically
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;

        newAttendance.records.forEach((r) => {
          if (r.status === 'PRESENT') presentCount += 1;
          else if (r.status === 'ABSENT') absentCount += 1;
          else if (r.status === 'LATE') lateCount += 1;
        });

        const totalMarked = presentCount + absentCount + lateCount;
        const calculatedRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : (previousDashboard.attendance_today?.rate_percentage || 0);

        // Optimistically update query cache with incremented version
        queryClient.setQueriesData<VersionedDashboardStats>(
          { queryKey: DASHBOARD_QUERY_KEY },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              attendance_today: {
                marked_classes: (old.attendance_today?.marked_classes || 0) + 1,
                total_classes: old.attendance_today?.total_classes || 1,
                present: presentCount,
                absent: absentCount,
                late: lateCount,
                rate_percentage: calculatedRate,
              },
              _version: (old._version || 1) + 1,
              _lastSyncedAt: Date.now(),
            };
          }
        );
      }

      return { previousDashboard };
    },
    onError: (err, newAttendance, context) => {
      // Rollback to previous snapshot on failure
      if (context?.previousDashboard) {
        queryClient.setQueriesData({ queryKey: DASHBOARD_QUERY_KEY }, context.previousDashboard);
      }
    },
    onSettled: () => {
      // Re-sync with server authoritative state
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });
}

/**
 * Optimistic notices creation hook with onMutate rollback and version incrementing.
 */
export function useOptimisticNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noticeData: {
      title: string;
      content: string;
      audience: any;
      priority: any;
      target_class_id?: string;
    }) => {
      const result = await api.createNotice(noticeData);
      broadcastRealtimeUpdate('notices', 'INSERT', { new: result });
      return result;
    },
    onMutate: async (newNotice) => {
      await queryClient.cancelQueries({ queryKey: ['notices'] });
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEY });

      const previousNotices = queryClient.getQueryData<any[]>(['notices']);

      queryClient.setQueriesData<any[]>({ queryKey: ['notices'] }, (old) => {
        const optimisticItem = {
          id: `temp-${Date.now()}`,
          title: newNotice.title,
          content: newNotice.content,
          audience: newNotice.audience,
          priority: newNotice.priority,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          _isOptimistic: true,
        };
        return old ? [optimisticItem, ...old] : [optimisticItem];
      });

      return { previousNotices };
    },
    onError: (err, newNotice, context) => {
      if (context?.previousNotices) {
        queryClient.setQueriesData({ queryKey: ['notices'] }, context.previousNotices);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });
}
