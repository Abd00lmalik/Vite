'use client';

import { useCallback, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { countPendingSyncItemsForUser } from '@/lib/db/db';
import { useSyncStore } from '@/store/syncStore';
import { useAuthStore } from '@/store/authStore';
import { runSync } from '@/lib/blockchain/sync';
import type { SyncProgressUpdate } from '@/lib/blockchain/sync';
import type { SyncResult } from '@/types';
import { useXion } from './useXion';

export function useSync() {
  const { session } = useAuthStore();
  const { signingClient, address: senderAddress } = useXion();
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
      if (!session?.userId) return 0;
      return countPendingSyncItemsForUser(session.userId);
    }, [session?.userId]) ?? 0;

  const sync = useCallback(async (): Promise<SyncResult | null> => {
    if (!session || isSyncing) return null;

    setSyncing(true);
    setProgressStep({ step: 1, message: 'Gathering pending records...' });
    try {
      const result = await runSync(session, signingClient, senderAddress ?? '', setProgressStep);
      setLastResult(result);
      setPending(await countPendingSyncItemsForUser(session.userId));
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
  }, [incrementRetry, isSyncing, resetRetry, senderAddress, session, setLastResult, setPending, setSyncing, signingClient]);

  return { sync, isSyncing, lastResult, lastSyncTime, pendingCount, progressStep };
}



