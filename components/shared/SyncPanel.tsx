'use client';
import { useXion } from '@/hooks/useXion';
import { runSync } from '@/lib/blockchain/sync';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { useState, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = [
  'Gathering pending records',
  'Running stock reconciliation',
  'Building Merkle tree',
  'Submitting to XION testnet-2',
  'Checking milestones',
  'Releasing grants on-chain',
  'Sending SMS notifications',
  'Sync complete',
];

export function SyncPanel() {
  const { session }                          = useAuthStore();
  const { address, signingClient, isConnected } = useXion();
  const { isSyncing, setSyncing, setLastResult } = useSyncStore();
  const [step, setStep]                      = useState(-1);
  const [result, setResult]                  = useState<any>(null);
  const [isOnline, setIsOnline]              = useState(true);
  const syncRef                              = useRef(false);

  const pendingCount = useLiveQuery(
    () => db.vaccinations.where('syncStatus').equals('pending').count(),
    []
  ) ?? 0;

  async function handleSync() {
    if (isSyncing || syncRef.current || !isOnline) return;
    if (!isConnected || !signingClient || !address) {
      toast.error('Connect your XION account to sync');
      return;
    }

    syncRef.current = true;
    setSyncing(true);
    setResult(null);

    for (let i = 0; i < STEPS.length - 1; i++) {
      setStep(i);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const res = await runSync(
        { userId: session?.userId ?? '', role: session?.role ?? '',
          clinicId: session?.clinicId },
        signingClient,
        address
      );
      setResult(res);
      setLastResult(res);
      setStep(STEPS.length - 1);
      if (res.success) {
        toast.success(`${res.recordCount} records synced on XION`);
      } else {
        toast.error('Sync failed: check errors below');
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Sync failed');
    } finally {
      setSyncing(false);
      syncRef.current = false;
      setTimeout(() => { setStep(-1); }, 15000);
    }
  }

  return (
    <div className="bg-white border border-ui-border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${
            isOnline ? 'bg-who-green' : 'bg-gray-400'
          }`} />
          <span className="text-sm font-medium text-ui-text">
            {isOnline ? 'Online' : 'Offline Mode'}
          </span>
          {pendingCount > 0 && (
            <span className="badge-orange">{pendingCount} pending</span>
          )}
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing || !isOnline || pendingCount === 0 || !isConnected}
          className="btn-primary text-sm py-2 px-4"
        >
          {isSyncing ? 'Syncing...' : 'Sync to XION'}
        </button>
      </div>

      {!isConnected && (
        <p className="text-xs text-who-orange bg-who-orange-light border
                      border-who-orange/20 rounded p-2">
          Connect your XION account to sync records on-chain.
        </p>
      )}

      {/* Progress steps */}
      {step >= 0 && (
        <div className="mt-3 space-y-1">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1">
              <span className={`flex-shrink-0 ${
                i < step  ? 'text-who-green' :
                i === step ? 'text-who-blue' :
                'text-gray-300'
              }`}>
                {i < step ? 'Ã¢Å“â€œ' : i === step ? 'Ã¢â€”Â' : 'Ã¢â€”â€¹'}
              </span>
              <span className={
                i < step  ? 'text-who-green' :
                i === step ? 'text-ui-text' :
                'text-gray-400'
              }>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Result card */}
      {result?.success && result.txHash && (
        <div className="mt-3 p-3 bg-who-green-light border border-who-green/30
                        rounded-lg text-xs space-y-1.5">
          <p className="font-semibold text-who-green">
            Ã¢Å“â€œ {result.recordCount} records confirmed on XION testnet-2
          </p>
          <p className="text-ui-text-muted">
            Root: {result.merkleRoot.slice(0,12)}...{result.merkleRoot.slice(-8)}
          </p>
          {result.grantsReleased > 0 && (
            <p className="text-who-blue font-medium">
              ${result.grantsReleased} in grants released
            </p>
          )}
          {result.flaggedCount > 0 && (
            <p className="text-who-orange">
              Ã¢Å¡Â  {result.flaggedCount} records flagged for review
            </p>
          )}
          <a
            href={result.explorerUrl}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-who-blue hover:underline"
          >
            View on XION Explorer
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}



