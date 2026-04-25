import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSession } from '@/types';
import { useSyncStore } from './syncStore';
import { useNotificationStore } from './notificationStore';
import { clearLegacyGlobalDataKeys } from '@/lib/storage/scopedStorage';

interface AuthState {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      isAuthenticated: false,
      login: (session) => {
        useSyncStore.getState().resetStore();
        useNotificationStore.getState().resetStore();
        clearLegacyGlobalDataKeys();
        set({ session, isAuthenticated: true });
      },
      logout: () => {
        useSyncStore.getState().resetStore();
        useNotificationStore.getState().resetStore();
        clearLegacyGlobalDataKeys();
        set({ session: null, isAuthenticated: false });
      },
    }),
    { name: 'vite-auth-session' }
  )
);




