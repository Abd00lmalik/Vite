'use client';

import { useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { db } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount } = useNotifications();

  const topItems = useMemo(
    () => [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    [notifications]
  );

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && topItems.length > 0) {
      const targetUser = topItems[0]?.userId;
      if (targetUser) {
        await db.notifications.where('userId').equals(targetUser).modify({ read: true });
      }
    }
  };

  return (
    <div className="relative">
      <Button variant="ghost" className="h-10 w-10 p-0" onClick={toggle}>
        <Bell className="h-5 w-5" />
      </Button>
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
          {unreadCount}
        </span>
      ) : null}

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
          <h4 className="mb-2 text-sm font-semibold text-gray-900">Notifications</h4>
          {topItems.length === 0 ? (
            <p className="text-sm text-gray-500">No notifications yet.</p>
          ) : (
            <div className="space-y-2">
              {topItems.map((item) => (
                <div key={item.id} className="rounded-lg bg-gray-50 p-2 text-sm text-gray-700">
                  {item.message}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}


