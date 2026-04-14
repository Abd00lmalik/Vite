'use client';
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) markAllRead();
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative rounded-full p-2 transition-colors hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            <button onClick={markAllRead} className="text-xs text-teal-600 hover:text-teal-700">
              Mark all read
            </button>
          </div>

          <div className="max-h-72 divide-y divide-gray-50 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 text-sm ${!n.read ? 'bg-teal-50' : 'bg-white'}`}>
                  <p className="text-gray-800">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
