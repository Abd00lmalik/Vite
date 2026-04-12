import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSession } from '@/types';

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
      login: (session) => set({ session, isAuthenticated: true }),
      logout: () => set({ session: null, isAuthenticated: false }),
    }),
    { name: 'vite-auth-session' }
  )
);

