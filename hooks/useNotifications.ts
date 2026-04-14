import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

export function useNotifications() {
  const { session } = useAuthStore();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  // useLiveQuery re-runs only when the DB data actually changes
  // It does NOT cause infinite loops because it is not inside useEffect
  const unreadCount = useLiveQuery(
    async () => {
      if (!session?.userId) return 0;
      return db.notifications
        .where('userId')
        .equals(session.userId)
        .filter((n) => !n.read)
        .count();
    },
    [session?.userId],
    0
  );

  const notifications = useLiveQuery(
    async () => {
      if (!session?.userId) return [];
      return db.notifications.where('userId').equals(session.userId).reverse().sortBy('createdAt');
    },
    [session?.userId],
    []
  );

  // Sync the live count into Zustand store only when the value changes
  // Using the primitive unreadCount value (number) as the dependency - safe
  useEffect(() => {
    setUnreadCount(unreadCount ?? 0);
  }, [unreadCount, setUnreadCount]);

  async function markAllRead() {
    if (!session?.userId) return;
    await db.notifications.where('userId').equals(session.userId).modify({ read: true });
  }

  async function markOneRead(id: string) {
    await db.notifications.update(id, { read: true });
  }

  return {
    notifications: notifications ?? [],
    unreadCount: unreadCount ?? 0,
    markAllRead,
    markOneRead,
  };
}

