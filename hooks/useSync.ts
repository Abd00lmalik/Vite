'use client';

import { useCallback, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { useSyncStore } from '@/store/syncStore';
import { useAuthStore } from '@/store/authStore';
import { runSync } from '@/lib/blockchain/sync';
import type { SyncProgressUpdate } from '@/lib/blockchain/sync';
import type { SyncResult } from '@/types';

export function useSync() {
  const { session } = useAuthStore();
  const [progressStep, setProgressStep] = useState<SyncProgressUpdate | null>(null);
  const {
    isSyncing,
    lastResult,
    lastSyncTime,
    setSyncing,
    setLastResult,
    setPending,
    incrementRetry,
    resetRetry,
  } = useSyncStore();

  const pendingCount =
    useLiveQuery(async () => {
      const pendingVaccinations = await db.vaccinations.where('syncStatus').equals('pending').count();
      const pendingPatients = await db.patients.where('syncStatus').equals('pending').count();
      return pendingVaccinations + pendingPatients;
    }, []) ?? 0;

  const sync = useCallback(async (): Promise<SyncResult | null> => {
    if (!session || isSyncing) return null;

    setSyncing(true);
    setProgressStep('Gathering pending records...');
    try {
      const result = await runSync(session, setProgressStep);
      setLastResult(result);
      setPending(
        (await db.vaccinations.where('syncStatus').equals('pending').count()) +
          (await db.patients.where('syncStatus').equals('pending').count())
      );
      if (result.success) {
        resetRetry();
      } else {
        incrementRetry();
      }
      return result;
    } catch (_error) {
      incrementRetry();
      return null;
    } finally {
      setSyncing(false);
      setTimeout(() => setProgressStep(null), 1200);
    }
  }, [incrementRetry, isSyncing, resetRetry, session, setLastResult, setPending, setSyncing]);

  return { sync, isSyncing, lastResult, lastSyncTime, pendingCount, progressStep };
}
