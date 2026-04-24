'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, ExternalLink, Link2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';
import { db } from '@/lib/db/schema';
import { runSync, type SyncProgressUpdate } from '@/lib/blockchain/sync';
import { useXion } from '@/hooks/useXion';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { isDemoAccount } from '@/lib/auth/demo';
import { shortTxHash } from '@/lib/utils/format';

const STEP_LABELS: Record<SyncProgressUpdate['step'], string> = {
  1: 'Gathering pending records',
  2: 'Checking wallet status on XION',
  3: 'Building Merkle tree',
  4: 'Submitting batch to XION',
  5: 'Verifying milestones and grants',
};

const TOTAL_STEPS = 5;
const STEP_SEQUENCE: SyncProgressUpdate['step'][] = [1, 2, 3, 4, 5];

export function SyncPanel() {
  const { session } = useAuthStore();
  const { address, signingClient, isConnected, walletError } = useXion();
  const { isSyncing, setSyncing, setLastResult } = useSyncStore();

  const [progress, setProgress] = useState<SyncProgressUpdate | null>(null);
  const [result, setResult] = useState<any>(null);
  const isOnline = useOfflineStatus();
  const syncRef = useRef(false);
  const reduceMotion = useReducedMotion();

  const demoSession = isDemoAccount({ userId: session?.userId, demo: session?.demo });
  const clinicId = session?.clinicId ?? (session ? `clinic-${session.userId.slice(0, 6)}` : 'clinic-unknown');

  const pendingCount = useLiveQuery(async () => {
    if (!session) return 0;

    const pendingVaccinations = await db.vaccinations
      .where('clinicId')
      .equals(clinicId)
      .filter((record) => record.syncStatus === 'pending')
      .count();

    const pendingPatients = await db.patients
      .where('clinicId')
      .equals(clinicId)
      .filter((patient) => patient.syncStatus === 'pending')
      .count();

    return pendingVaccinations + pendingPatients;
  }, [clinicId, session?.userId]) ?? 0;

  const progressPercent = useMemo(() => {
    if (!progress) return 0;
    return Math.round((progress.step / TOTAL_STEPS) * 100);
  }, [progress]);

  async function handleSync() {
    if (!session || isSyncing || syncRef.current || !isOnline || pendingCount === 0) return;
    if (!demoSession && (!isConnected || !signingClient || !address)) {
      toast.error('Connect your XION wallet before syncing real records.');
      return;
    }

    syncRef.current = true;
    setSyncing(true);
    setResult(null);
    setProgress({ step: 1, message: STEP_LABELS[1] });

    try {
      const response = await runSync(
        {
          userId: session.userId,
          role: session.role,
          clinicId: session.clinicId,
          demo: session.demo,
        },
        signingClient,
        address ?? '',
        (update) => setProgress(update)
      );

      setResult(response);
      setLastResult(response);

      if (response.success) {
        const txSuffix = response.txHash ? ` Tx: ${shortTxHash(response.txHash)}` : '';
        toast.success(`${response.recordCount} records synced.${txSuffix}`);
      } else {
        toast.error(response.errors[0] ?? 'Sync failed.');
      }
    } catch (error: any) {
      const message = error?.message ?? 'Sync failed.';
      setResult({
        success: false,
        recordCount: 0,
        merkleRoot: '0x0',
        mode: demoSession ? 'simulated' : 'onchain',
        errors: [message],
      });
      toast.error(message);
    } finally {
      setSyncing(false);
      syncRef.current = false;
      setTimeout(() => setProgress(null), 1200);
      setTimeout(() => setResult(null), 10000);
    }
  }

  useEffect(() => {
    if (!isOnline || pendingCount === 0 || isSyncing) return;
    if (!demoSession && !isConnected) return;

    const timer = setTimeout(() => {
      void handleSync();
    }, 800);

    return () => clearTimeout(timer);
  }, [demoSession, isConnected, isOnline, isSyncing, pendingCount, session?.userId]);

  return (
    <div className="mb-4 rounded-xl border border-ui-border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-who-green' : 'bg-gray-400'}`} />
          <span className="text-sm font-medium text-ui-text">{isOnline ? 'Online' : 'Offline Mode'}</span>
          {pendingCount > 0 ? <span className="badge-orange">{pendingCount} pending</span> : null}
        </div>

        <button
          onClick={() => void handleSync()}
          disabled={isSyncing || !isOnline || pendingCount === 0}
          className="btn-primary h-10 px-4 text-sm disabled:opacity-50"
        >
          {isSyncing ? 'Syncing...' : isOnline ? 'Sync to XION' : 'Offline'}
        </button>
      </div>

      {!demoSession && !isConnected ? (
        <p className="rounded border border-who-orange/20 bg-who-orange-light p-2 text-xs text-who-orange">
          Connect your XION wallet to sync real records.
        </p>
      ) : null}

      {walletError ? (
        <p className="mt-2 rounded border border-who-red/20 bg-who-red-light p-2 text-xs text-who-red">
          {walletError}
        </p>
      ) : null}

      <AnimatePresence>
        {progress ? (
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
            className="mt-3 space-y-2 rounded-lg border border-ui-border bg-ui-surface p-3"
          >
            <div className="flex items-center justify-between text-xs text-ui-text-muted">
              <span>{STEP_LABELS[progress.step]}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <motion.div
                className="h-full rounded-full bg-who-blue"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: reduceMotion ? 0.01 : 0.35, ease: 'easeOut' }}
              />
            </div>
            <div className="space-y-1">
              {STEP_SEQUENCE.map((stepKey) => {
                const done = stepKey < progress.step;
                const current = stepKey === progress.step;
                return (
                  <div key={stepKey} className="flex items-center gap-2 text-xs">
                    <span
                      className={
                        done
                          ? 'text-who-green'
                          : current
                          ? 'text-who-blue'
                          : 'text-gray-300'
                      }
                    >
                      {done ? 'OK' : current ? '...' : 'o'}
                    </span>
                    <span
                      className={
                        done
                          ? 'text-who-green'
                          : current
                          ? 'text-ui-text'
                          : 'text-gray-400'
                      }
                    >
                      {STEP_LABELS[stepKey]}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {result ? (
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            className={`mt-3 space-y-1.5 rounded-lg border p-3 text-xs ${
              result.success
                ? 'border-who-green/30 bg-who-green-light'
                : 'border-who-red/30 bg-who-red-light'
            }`}
          >
            {result.success ? (
              <>
                <p className="font-semibold text-who-green">
                  {result.recordCount} records synced {result.mode === 'onchain' ? 'on-chain' : '(demo mode)'}
                </p>
                <p className="text-ui-text-muted">
                  Root: {result.merkleRoot.slice(0, 12)}...{result.merkleRoot.slice(-8)}
                </p>
                {result.txHash ? (
                  <p className="font-mono text-ui-text-muted">
                    Tx: {shortTxHash(result.txHash)}{result.blockHeight ? ` @ ${result.blockHeight}` : ''}
                  </p>
                ) : null}
                {result.grantsReleased > 0 ? (
                  <p className="font-medium text-who-blue">${result.grantsReleased} in grants released</p>
                ) : null}
                {result.flaggedCount > 0 ? (
                  <p className="text-who-orange">{result.flaggedCount} records flagged for review</p>
                ) : null}
                {result.mode === 'onchain' && result.explorerUrl ? (
                  <a
                    href={result.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-who-blue hover:underline"
                  >
                    View on XION Explorer
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="inline-flex items-center gap-1 text-ui-text-muted">
                    <Link2 className="h-3 w-3" />
                    Demo mode sync completed locally.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="inline-flex items-center gap-1 font-semibold text-who-red">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Sync failed
                </p>
                {(result.errors ?? []).slice(0, 3).map((error: string) => (
                  <p key={error} className="text-who-red">
                    - {error}
                  </p>
                ))}
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
