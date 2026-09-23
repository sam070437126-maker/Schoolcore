import React from 'react';
import { Bell, CheckCheck, Clock, AlertCircle, BookOpen, UserCheck, Megaphone, Check } from 'lucide-react';
import { UserNotification } from '../types/index.ts';
import { useFamilyNotifications } from '../hooks/useRealtimeDashboard.ts';

interface FamilyNotificationStreamProps {
  familyGroupId?: string;
  childName?: string;
}

export const FamilyNotificationStream: React.FC<FamilyNotificationStreamProps> = ({
  familyGroupId,
  childName,
}) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useFamilyNotifications(familyGroupId);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ATTENDANCE':
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      case 'ACADEMIC':
        return <BookOpen className="w-4 h-4 text-indigo-400" />;
      case 'URGENT':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'ANNOUNCEMENT':
      default:
        return <Megaphone className="w-4 h-4 text-sky-400" />;
    }
  };

  const formatTimestamp = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.round(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-4 h-4 text-stone-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <span className="text-xs font-semibold text-stone-200 uppercase tracking-wider">
            Family Broadcasts & Alerts
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60">
              {unreadCount} unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-stone-800"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Synchronized Notice Banner */}
      <div className="px-4 py-2 bg-stone-900/90 border-b border-stone-800/80 text-[11px] text-stone-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Synchronized dual-guardian stream (Family ID: <code className="text-stone-300 font-mono text-[10px]">{familyGroupId}</code>)
        </span>
        <span className="text-stone-500">Real-time</span>
      </div>

      {/* Notification List */}
      <div className="divide-y divide-stone-800/70 max-h-[380px] overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-xs">
            <div className="w-5 h-5 border-2 border-stone-600 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
            Connecting to secure family notification stream...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-xs">
            No alerts or announcements recorded for your family unit yet.
          </div>
        ) : (
          notifications.map((n) => {
            const isUnread = !n.read_at;
            return (
              <div
                key={n.id}
                className={`p-3.5 transition-colors flex items-start gap-3 ${
                  isUnread ? 'bg-stone-950/40 hover:bg-stone-800/40' : 'hover:bg-stone-800/20 opacity-90'
                }`}
              >
                <div className="p-2 rounded-lg bg-stone-800/80 border border-stone-700/50 mt-0.5 shrink-0">
                  {getCategoryIcon(n.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <h4
                        className={`text-xs truncate ${
                          isUnread ? 'font-semibold text-stone-100' : 'font-medium text-stone-300'
                        }`}
                      >
                        {n.title}
                      </h4>
                      {n.priority === 'URGENT' && (
                        <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-950 text-red-300 border border-red-800/50">
                          URGENT
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-500 flex items-center gap-1 shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimestamp(n.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-stone-400 leading-relaxed line-clamp-3 mb-2">
                    {n.content}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-stone-500 text-[10px]">
                      {n.child_name ? `Child: ${n.child_name}` : childName ? `Child: ${childName}` : 'All Family Students'}
                    </span>

                    {isUnread && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-emerald-400 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
