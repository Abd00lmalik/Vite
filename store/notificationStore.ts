import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count: number) => {
    // Only call set if the value actually changed — prevents redundant renders
    set((state) => (state.unreadCount === count ? state : { unreadCount: count }));
  },
}));
