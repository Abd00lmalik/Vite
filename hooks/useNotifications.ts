'use client';

import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';

export function useNotifications() {
  const { session } = useAuthStore();
  const { unreadCount, setUnreadCount } = useNotificationStore();

  const notifications =
    useLiveQuery(async () => {
      if (!session?.userId) return [];
      return db.notifications
        .where('userId')
        .equals(session.userId)
        .reverse()
        .sortBy('createdAt');
    }, [session?.userId]) ?? [];

  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length;
    setUnreadCount(unread);
  }, [notifications, setUnreadCount]);

  return {
    notifications,
    unreadCount,
  };
}

