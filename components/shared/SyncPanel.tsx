'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Link2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';
import { db } from '@/lib/db/schema';
import { runSync } from '@/lib/blockchain/sync';
import { useXion } from '@/hooks/useXion';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';

const STEPS = [
  'Gathering pending records',
  'Running stock reconciliation',
  'Building Merkle tree',
  'Submitting batch',
  'Finalizing sync',
];

export function SyncPanel() {
  const { session } = useAuthStore();
  const { address, signingClient, isConnected } = useXion();
  const { isSyncing, setSyncing, setLastResult } = useSyncStore();

  const [step, setStep] = useState(-1);
  const [result, setResult] = useState<any>(null);
  const isOnline = useOfflineStatus();
  const syncRef = useRef(false);

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

  async function handleSync() {
    if (!session || isSyncing || syncRef.current || !isOnline || pendingCount === 0) return;

    syncRef.current = true;
    setSyncing(true);
    setResult(null);

    for (let i = 0; i < STEPS.length; i++) {
      setStep(i);
      await new Promise((resolve) => setTimeout(resolve, 450));
    }

    try {
      const response = await runSync(
        {
          userId: session.userId,
          role: session.role,
          clinicId: session.clinicId,
        },
        signingClient,
        address ?? ''
      );

      setResult(response);
      setLastResult(response);

      if (!isConnected) {
        toast.success(`Sync completed in simulated mode (${response.recordCount} records).`);
      } else if (response.success) {
        toast.success(`${response.recordCount} records synced on XION.`);
      } else {
        toast.error('Sync failed. Review error details.');
      }
    } catch (error: any) {
      toast.error(error?.message ?? 'Sync failed');
    } finally {
      setSyncing(false);
      syncRef.current = false;
      setTimeout(() => setStep(-1), 10000);
    }
  }

  useEffect(() => {
    if (!isOnline || pendingCount === 0 || isSyncing) return;

    const timer = setTimeout(() => {
      void handleSync();
    }, 500);

    return () => clearTimeout(timer);
  }, [isOnline, isSyncing, pendingCount, session?.userId]);

  return (
    <div className="mb-4 rounded-lg border border-ui-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-who-green' : 'bg-gray-400'}`} />
          <span className="text-sm font-medium text-ui-text">{isOnline ? 'Online' : 'Offline Mode'}</span>
          {pendingCount > 0 && <span className="badge-orange">{pendingCount} pending</span>}
        </div>

        <button
          onClick={() => void handleSync()}
          disabled={isSyncing || !isOnline || pendingCount === 0}
          className="btn-primary px-4 py-2 text-sm"
        >
          {isSyncing ? 'Syncing...' : 'Sync to XION'}
        </button>
      </div>

      {!isConnected && (
        <p className="rounded border border-who-orange/20 bg-who-orange-light p-2 text-xs text-who-orange">
          Wallet not connected. Sync will run in simulated mode and still preserve your clinic workflow.
        </p>
      )}

      {step >= 0 && (
        <div className="mt-3 space-y-1">
          {STEPS.map((label, index) => (
            <div key={label} className="flex items-center gap-2 py-1 text-xs">
              <span
                className={`flex-shrink-0 ${
                  index < step
                    ? 'text-who-green'
                    : index === step
                    ? 'text-who-blue'
                    : 'text-gray-300'
                }`}
              >
                {index < step ? 'OK' : index === step ? '...' : 'o'}
              </span>
              <span
                className={
                  index < step
                    ? 'text-who-green'
                    : index === step
                    ? 'text-ui-text'
                    : 'text-gray-400'
                }
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div
          className={`mt-3 space-y-1.5 rounded-lg border p-3 text-xs ${
            result.success
              ? 'border-who-green/30 bg-who-green-light'
              : 'border-who-red/30 bg-who-red-light'
          }`}
        >
          {result.success ? (
            <>
              <p className="font-semibold text-who-green">
                {result.recordCount} records confirmed ({result.mode === 'onchain' ? 'on-chain' : 'simulated'})
              </p>
              <p className="text-ui-text-muted">
                Root: {result.merkleRoot.slice(0, 12)}...{result.merkleRoot.slice(-8)}
              </p>
              {result.grantsReleased > 0 && (
                <p className="font-medium text-who-blue">${result.grantsReleased} in grants released</p>
              )}
              {result.flaggedCount > 0 && (
                <p className="text-who-orange">{result.flaggedCount} records flagged for review</p>
              )}
              {result.mode === 'onchain' ? (
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
                  Simulated sync complete. Connect wallet for on-chain tx hashes.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="font-semibold text-who-red">Sync failed</p>
              {(result.errors ?? []).slice(0, 3).map((error: string) => (
                <p key={error} className="text-who-red">
                  - {error}
                </p>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
