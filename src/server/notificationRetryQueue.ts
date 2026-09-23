import { UserNotification } from '../types/index.ts';
import { db } from './db.ts';

export interface QueuedNotificationItem {
  id: string;
  schoolId: string;
  familyGroupId?: string;
  userId?: string;
  notification: Omit<UserNotification, 'id' | 'created_at'>;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt: number;
  status: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'FAILED';
  lastError?: string;
  createdAt: number;
}

class NotificationRetryQueueService {
  private queue: QueuedNotificationItem[] = [];
  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    // Process retry queue every 30 seconds
    if (typeof setInterval !== 'undefined') {
      this.timer = setInterval(() => {
        this.processQueue().catch((err) => {
          console.warn('[NotificationRetryQueue] Error during interval processing:', err);
        });
      }, 30000);
    }
  }

  /**
   * Enqueues a notification with fault-tolerant retry policy
   */
  public enqueue(
    schoolId: string,
    notification: Omit<UserNotification, 'id' | 'created_at'>,
    options?: { familyGroupId?: string; userId?: string; maxAttempts?: number }
  ): string {
    const id = `nrq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const item: QueuedNotificationItem = {
      id,
      schoolId,
      familyGroupId: options?.familyGroupId || notification.family_group_id,
      userId: options?.userId || notification.user_id,
      notification,
      attemptCount: 0,
      maxAttempts: options?.maxAttempts || 5,
      nextRetryAt: Date.now(),
      status: 'PENDING',
      createdAt: Date.now(),
    };

    this.queue.push(item);
    
    // Attempt immediate delivery
    this.processQueue().catch((err) => {
      console.warn(`[NotificationRetryQueue] Immediate delivery failed for ${id}:`, err);
    });

    return id;
  }

  /**
   * Processes ready items in the queue
   */
  public async processQueue(): Promise<{ processed: number; delivered: number; failed: number }> {
    if (this.isProcessing) return { processed: 0, delivered: 0, failed: 0 };
    this.isProcessing = true;

    let processed = 0;
    let delivered = 0;
    let failed = 0;

    const now = Date.now();
    const readyItems = this.queue.filter(
      (item) => item.status === 'PENDING' && item.nextRetryAt <= now
    );

    for (const item of readyItems) {
      processed += 1;
      item.status = 'PROCESSING';
      item.attemptCount += 1;

      try {
        // Attempt delivery to in-memory store and Supabase
        const finalNotification: UserNotification = {
          ...item.notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          school_id: item.schoolId,
          family_group_id: item.familyGroupId,
          user_id: item.userId,
          created_at: new Date().toISOString(),
        };

        // Persist to database engine
        if (!db.data.userNotifications) {
          db.data.userNotifications = [];
        }
        db.data.userNotifications.push(finalNotification);
        db.save();

        item.status = 'DELIVERED';
        delivered += 1;
      } catch (err: any) {
        console.warn(`[NotificationRetryQueue] Delivery failed on attempt ${item.attemptCount}:`, err.message);
        item.lastError = err.message || 'Unknown network/storage failure';

        if (item.attemptCount >= item.maxAttempts) {
          item.status = 'FAILED';
          failed += 1;
        } else {
          item.status = 'PENDING';
          // Exponential backoff: 2s, 4s, 8s, 16s, 32s...
          const backoffDelay = Math.pow(2, item.attemptCount) * 1000;
          item.nextRetryAt = Date.now() + backoffDelay;
        }
      }
    }

    // Retain only pending and recent completed items
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    this.queue = this.queue.filter(
      (item) => item.status === 'PENDING' || item.createdAt > cutoff
    );

    this.isProcessing = false;
    return { processed, delivered, failed };
  }

  /**
   * Get queue health metrics
   */
  public getStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter((q) => q.status === 'PENDING').length,
      delivered: this.queue.filter((q) => q.status === 'DELIVERED').length,
      failed: this.queue.filter((q) => q.status === 'FAILED').length,
    };
  }
}

export const notificationRetryQueue = new NotificationRetryQueueService();
