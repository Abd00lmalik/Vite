import { create } from 'zustand';
import type { SyncResult } from '@/types';

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  lastResult: SyncResult | null;
  retryCount: number;
  setSyncing: (value: boolean) => void;
  setPending: (count: number) => void;
  setLastResult: (result: SyncResult) => void;
  incrementRetry: () => void;
  resetRetry: () => void;
  resetStore: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  pendingCount: 0,
  lastSyncTime: null,
  lastResult: null,
  retryCount: 0,
  setSyncing: (value) => set({ isSyncing: value }),
  setPending: (count) => set({ pendingCount: count }),
  setLastResult: (result) =>
    set({
      lastResult: result,
      lastSyncTime: new Date().toISOString(),
    }),
  incrementRetry: () => set((state) => ({ retryCount: state.retryCount + 1 })),
  resetRetry: () => set({ retryCount: 0 }),
  resetStore: () =>
    set({
      isSyncing: false,
      pendingCount: 0,
      lastSyncTime: null,
      lastResult: null,
      retryCount: 0,
    }),
}));




