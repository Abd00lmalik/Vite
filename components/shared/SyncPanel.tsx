'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { useSync } from '@/hooks/useSync';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SyncResult } from '@/types';

const SYNC_STEPS = [
  'Gathering pending records...',
  'Running stock reconciliation...',
  'Building Merkle tree...',
  'Submitting batch to XION...',
  'Checking milestones...',
  'Releasing grants...',
  'Sending SMS notifications...',
  'Writing audit log...',
  'Sync complete.',
] as const;

export function SyncPanel() {
  const { sync, isSyncing, lastSyncTime, pendingCount, progressStep } = useSync();
  const isOnline = useOfflineStatus();
  const wasOffline = useRef(false);
  const syncInProgress = useRef(false);
  const resultTimeoutRef = useRef<number | null>(null);

  const [stepIndex, setStepIndex] = useState<number>(-1);
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleSync = useCallback(async () => {
    if (!isOnline || isSyncing || syncInProgress.current) return;

    syncInProgress.current = true;
    setStepIndex(0);
    setResult(null);

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setStepIndex((prev) => Math.min(Math.max(prev, index), SYNC_STEPS.length - 1));
      if (index >= SYNC_STEPS.length - 1) {
        window.clearInterval(timer);
      }
    }, 600);

    try {
      const syncResult = await sync();
      if (syncResult) {
        setResult(syncResult);
        if (resultTimeoutRef.current) {
          window.clearTimeout(resultTimeoutRef.current);
        }
        resultTimeoutRef.current = window.setTimeout(() => {
          setResult(null);
        }, 10000);
      }
    } finally {
      window.clearInterval(timer);
      setStepIndex(SYNC_STEPS.length - 1);
      window.setTimeout(() => setStepIndex(-1), 1800);
      syncInProgress.current = false;
    }
  }, [isOnline, isSyncing, sync]);

  useEffect(() => {
    if (!progressStep) return;
    const liveIndex = SYNC_STEPS.findIndex((step) => step === progressStep);
    if (liveIndex >= 0) {
      setStepIndex((prev) => Math.max(prev, liveIndex));
    }
  }, [progressStep]);

  useEffect(() => {
    const handleOnline = () => {
      if (wasOffline.current && pendingCount > 0 && !syncInProgress.current) {
        void handleSync();
      }
      wasOffline.current = false;
    };

    const handleOffline = () => {
      wasOffline.current = true;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleSync, pendingCount]);

  useEffect(() => {
    return () => {
      if (resultTimeoutRef.current) {
        window.clearTimeout(resultTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? 'active' : 'offline'}>{isOnline ? 'Online' : 'Offline'}</Badge>
          <Badge variant={pendingCount > 0 ? 'pending' : 'synced'}>{pendingCount} pending</Badge>
        </div>
        <Button
          type="button"
          onClick={handleSync}
          loading={isSyncing}
          disabled={!isOnline || isSyncing || syncInProgress.current}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={isSyncing ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
          {isOnline ? (isSyncing ? 'Syncing...' : 'Sync Now') : 'Offline'}
        </Button>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Last sync: {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Not synced yet'}
      </div>

      {(isSyncing || stepIndex >= 0) && (
        <div className="mt-3 rounded-lg border border-teal-100 bg-teal-50 p-3">
          <p className="text-sm font-semibold text-teal-dark">Sync Progress</p>
          <ul className="mt-2 space-y-1.5 text-sm text-teal-dark">
            {SYNC_STEPS.map((step, index) => {
              const done = index < stepIndex;
              const active = index === stepIndex && isSyncing;
              return (
                <li key={step} className="flex items-center gap-2">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : active ? (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-teal-400 border-t-teal-700" />
                  ) : (
                    <span className="h-3 w-3 rounded-full border border-teal-300" />
                  )}
                  <span className={done ? 'text-teal-dark/80' : active ? 'font-medium text-teal-dark' : 'text-teal-dark/55'}>
                    {step}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <AnimatePresence>
        {result ? (
          <motion.div
            key="sync-result"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-3 rounded-xl border p-3 text-sm ${
              result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}
          >
            {result.success ? (
              <>
                <p className="font-semibold text-green-700">OK {result.recordCount} records synced</p>
                <p className="mt-1 font-mono text-xs text-green-600">Root: {result.merkleRoot.slice(0, 12)}...</p>
                {result.grantsReleased > 0 ? (
                  <p className="text-xs text-green-600">${result.grantsReleased} in grants released</p>
                ) : null}
                {result.flaggedCount && result.flaggedCount > 0 ? (
                  <p className="text-xs text-amber-600">Warning: {result.flaggedCount} records flagged for review</p>
                ) : null}
              </>
            ) : (
              <p className="font-semibold text-red-700">Sync failed. Check errors.</p>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
