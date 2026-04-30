'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, ExternalLink, Link2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';
import { countPendingSyncItemsForUser } from '@/lib/db/db';
import { XION, SHOW_XION_DEBUG, xionConfig } from '@/lib/xion/config';
import { getXionSubmitter } from '@/lib/xion/signer-adapter';
import { runSync, type SyncProgressUpdate } from '@/lib/blockchain/sync';
import { useXion } from '@/hooks/useXion';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { isDemoAccount } from '@/lib/auth/demo';
import { shortTxHash } from '@/lib/utils/format';
import {
  formatContractFailure,
  getXionConfigStatus,
  getOptionalXionVarStatus,
  isSyncConfigured,
  getMissingXionVars,
  type ContractPreflightResult,
  validateRequiredContracts,
} from '@/lib/xion/readiness';
import { toastErrorOnce } from '@/lib/utils/toastOnce';
import {
  formatAccountNotInitializedMessage,
  isAccountNotInitializedMessage,
  runSyncPreflight,
  type SyncPreflightResult,
} from '@/lib/xion/preflight';
import { clearSyncQueueQuarantine, getSyncQueueQuarantine } from '@/lib/db/syncQueueSanitizer';

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
  const { isSyncing, setSyncing, setLastResult, clearLastResult } = useSyncStore();

  const [progress, setProgress] = useState<SyncProgressUpdate | null>(null);
  const [result, setResult] = useState<any>(null);
  const [readiness, setReadiness] = useState<SyncPreflightResult | null>(null);
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(false);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  const [contractFailures, setContractFailures] = useState<ContractPreflightResult['failures']>([]);
  const [isCheckingContracts, setIsCheckingContracts] = useState(false);
  const [quarantineCount, setQuarantineCount] = useState(0);
  const isOnline = useOfflineStatus();
  const syncRef = useRef(false);
  const accountInitToastIdRef = useRef<string | undefined>(undefined);
  const reduceMotion = useReducedMotion();
  const configStatus = getXionConfigStatus();
  const optionalVars = getOptionalXionVarStatus();
  const missingOptionalVars = optionalVars.filter(v => !v.present).map(v => v.envName);
  
  const adapter = getXionSubmitter(signingClient);
  const isServerFallbackEnabled = process.env.NEXT_PUBLIC_XION_ENABLE_SERVER_SUBMIT === 'true';

  const demoSession = isDemoAccount({ userId: session?.userId, demo: session?.demo });
  const requiresOnchainSync = !demoSession;
  const configMissing = requiresOnchainSync && !configStatus.configReady;
  const walletMissing =
    requiresOnchainSync &&
    configStatus.configReady &&
    (!isConnected || !signingClient || !address);
  const pendingCount = useLiveQuery(async () => {
    if (!session?.userId) return 0;
    return countPendingSyncItemsForUser(session.userId);
  }, [session?.userId]) ?? 0;

  const progressPercent = useMemo(() => {
    if (!progress) return 0;
    return Math.round((progress.step / TOTAL_STEPS) * 100);
  }, [progress]);

  const missingOnChainAccount = requiresOnchainSync && !!address && readiness?.accountExists === false;
  const insufficientOnChainBalance =
    requiresOnchainSync &&
    !!address &&
    readiness?.accountExists === true &&
    readiness?.hasMinimumBalance === false;
  const walletReady =
    !requiresOnchainSync ||
    (!!address && readiness?.accountExists === true && readiness?.hasMinimumBalance === true);
  const contractsReady = !requiresOnchainSync || contractFailures.length === 0;

  useEffect(() => {
    const connectedAddress = address;
    if (!requiresOnchainSync || configMissing || !connectedAddress) {
      setReadiness(null);
      setReadinessError(null);
      return;
    }

    let cancelled = false;
    setIsCheckingReadiness(true);

    async function checkReadiness() {
      try {
        if (!connectedAddress) return;
        const latest = await runSyncPreflight(connectedAddress, XION.rest);
        if (cancelled) return;

        setReadiness(latest);
        setReadinessError(null);

        if (latest.accountExists && latest.hasMinimumBalance) {
          setResult((prev: any) => {
            const errors = prev?.errors ?? [];
            if (errors.some((error: string) => isAccountNotInitializedMessage(error))) {
              return null;
            }
            return prev;
          });
          clearLastResult();
          if (accountInitToastIdRef.current) {
            toast.dismiss(accountInitToastIdRef.current);
            accountInitToastIdRef.current = undefined;
          }
        }
      } catch (error: any) {
        if (cancelled) return;
        setReadiness(null);
        setReadinessError(error?.message ?? 'Unable to verify wallet readiness right now.');
      } finally {
        if (!cancelled) {
          setIsCheckingReadiness(false);
        }
      }
    }

    void checkReadiness();

    return () => {
      cancelled = true;
    };
  }, [address, clearLastResult, configMissing, requiresOnchainSync]);

  useEffect(() => {
    if (!requiresOnchainSync || configMissing || !walletReady) {
      setContractFailures([]);
      setIsCheckingContracts(false);
      return;
    }

    let cancelled = false;
    setIsCheckingContracts(true);

    async function checkContracts() {
      try {
        const validation = await validateRequiredContracts(XION.rest);
        if (cancelled) return;
        setContractFailures(validation.failures);
      } finally {
        if (!cancelled) {
          setIsCheckingContracts(false);
        }
      }
    }

    void checkContracts();

    return () => {
      cancelled = true;
    };
  }, [configMissing, requiresOnchainSync, walletReady]);

  // Clear stale configuration error if config becomes valid
  useEffect(() => {
    if (!configMissing && result?.batchId === 'config-missing') {
      setResult(null);
    }
  }, [configMissing, result?.batchId]);

  useEffect(() => {
    if (!session?.userId) {
      setQuarantineCount(0);
      return;
    }
    setQuarantineCount(getSyncQueueQuarantine(session.userId).length);
  }, [pendingCount, result, session?.userId]);

  async function handleSync() {
    if (!session || isSyncing || syncRef.current || !isOnline || pendingCount === 0) return;
    if (configMissing) {
      const missing = getMissingXionVars();
      toastErrorOnce(
        `XION sync is not configured. Missing: ${missing.join(', ')}`,
        (message) => toast.error(message)
      );
      return;
    }
    if (walletMissing) {
      return;
    }
    if (!contractsReady) {
      setResult({
        success: false,
        recordCount: 0,
        merkleRoot: '0x0',
        mode: demoSession ? 'simulated' : 'onchain',
        errors: contractFailures.map(formatContractFailure),
      });
      return;
    }

    if (requiresOnchainSync && address) {
      try {
        const latest = await runSyncPreflight(address, XION.rest);
        setReadiness(latest);
        setReadinessError(null);

        if (!latest.accountExists) {
          const message = formatAccountNotInitializedMessage(address);
          const toastId = toastErrorOnce(message, (msg) => toast.error(msg));
          accountInitToastIdRef.current = toastId;
          return;
        }

        if (!latest.hasMinimumBalance) {
          toastErrorOnce(
            `Insufficient UXION balance for gas fees. Minimum required: 75000 uxion. Current: ${latest.balanceAmount} uxion.`,
            (msg) => toast.error(msg)
          );
          return;
        }

        clearLastResult();
      } catch (error: any) {
        const message = error?.message ?? 'Unable to verify wallet readiness right now.';
        setReadinessError(message);
        toastErrorOnce(message, (msg) => toast.error(msg));
        return;
      }
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
        if (response.phaseB?.skipped) {
          toast.success(`${response.recordCount} records synced.${txSuffix} (Payouts skipped)`);
        } else {
          toast.success(`${response.recordCount} records synced.${txSuffix}`);
        }
      } else {
        const firstError = response.errors?.[0] ?? 'Sync failed.';
        const toastId = toastErrorOnce(firstError, (message) => toast.error(message));
        if (isAccountNotInitializedMessage(firstError)) {
          accountInitToastIdRef.current = toastId;
        }
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
      const toastId = toastErrorOnce(message, (text) => toast.error(text));
      if (isAccountNotInitializedMessage(message)) {
        accountInitToastIdRef.current = toastId;
      }
    } finally {
      setSyncing(false);
      syncRef.current = false;
      setTimeout(() => setProgress(null), 1200);
      setTimeout(() => setResult(null), 10000);
    }
  }

  const syncDisabled =
    isSyncing ||
    !isOnline ||
    pendingCount === 0 ||
    configMissing ||
    walletMissing ||
    isCheckingReadiness ||
    isCheckingContracts ||
    missingOnChainAccount ||
    insufficientOnChainBalance ||
    !contractsReady;
  const syncDisabledReason = configMissing
    ? 'XION sync requires environment configuration. See setup guide.'
    : walletMissing
    ? 'Connect your XION wallet to enable sync.'
    : isCheckingReadiness
    ? 'Checking wallet readiness on XION...'
    : isCheckingContracts
    ? 'Validating XION contracts on-chain...'
    : missingOnChainAccount
    ? 'Wallet account is not initialized on-chain yet.'
    : insufficientOnChainBalance
    ? 'Insufficient UXION balance for gas fees.'
    : !contractsReady
    ? 'Fix contract configuration before syncing.'
    : readinessError
    ? 'Unable to verify wallet readiness right now.'
    : !isOnline
    ? 'Device is offline.'
    : pendingCount === 0
    ? 'No pending records to sync.'
    : '';

  const handleClearQuarantine = () => {
    if (!session?.userId) return;
    clearSyncQueueQuarantine(session.userId);
    setQuarantineCount(0);
    toast.success('Quarantined records cleared.');
  };

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
          disabled={syncDisabled}
          title={syncDisabledReason}
          className="btn-primary h-10 px-4 text-sm disabled:opacity-50"
        >
          {isSyncing ? 'Syncing...' : isOnline ? 'Sync to XION' : 'Offline'}
        </button>
      </div>

      {configMissing ? (
        <div className="rounded border border-who-orange/20 bg-who-orange-light p-3 text-xs leading-relaxed text-who-orange">
          <strong className="font-semibold">XION sync is not configured.</strong>
          <p className="mt-1">The following required environment variables are missing:</p>
          <ul className="mt-1 list-inside list-disc">
            {configStatus.missingVars.map(v => <li key={v}>{v}</li>)}
          </ul>
          <p className="mt-2 text-[10px] opacity-80 italic">
            Set these in Vercel → Project Settings → Environment Variables, then redeploy with "Clear Build Cache" enabled.
          </p>
        </div>
      ) : null}

      {!configMissing && missingOptionalVars.length > 0 && SHOW_XION_DEBUG ? (
        <p className="mt-2 rounded border border-ui-border bg-ui-surface p-2 text-xs text-ui-text-muted">
          Optional XION features not configured: {missingOptionalVars.join(', ')}.
          Sync can still run.
        </p>
      ) : null}

      {SHOW_XION_DEBUG && signingClient && (
        <div className="mt-2 rounded border border-ui-border bg-ui-surface p-2 text-[10px] leading-tight text-ui-text-muted">
          <div className="font-semibold uppercase tracking-wider opacity-60">Signing Diagnostics</div>
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
            <span>Signing mode:</span>
            <span className="font-mono text-ui-text">
              {adapter.mode === 'browser_direct' ? 'Direct Wallet' : 
               adapter.mode === 'browser_session' ? 'Abstraxion Session' : 
               adapter.mode === 'server_testnet' ? 'Server Testnet' : 'Unsupported'}
            </span>
            
            <span>Compatibility:</span>
            <span className={`font-medium ${adapter.mode !== 'unsupported' ? 'text-who-green' : 'text-who-orange'}`}>
              {adapter.mode !== 'unsupported' ? 'YES (Compatible)' : 'NO (Incompatible)'}
            </span>

            <span>Signer Type:</span>
            <span className="font-mono text-ui-text truncate">
              {signingClient?.constructor?.name || typeof signingClient}
            </span>

            {isServerFallbackEnabled && (
              <>
                <span>Server Fallback:</span>
                <span className="text-who-green">ENABLED</span>
              </>
            )}
          </div>
          {adapter.mode === 'unsupported' && (
            <p className="mt-2 font-medium text-who-orange">
              Error: {adapter.reason}. Try reconnecting your XION wallet.
            </p>
          )}
        </div>
      )}

      {walletMissing ? (
        <p className="mt-2 rounded border border-who-orange/20 bg-who-orange-light p-2 text-xs text-who-orange">
          Connect your XION wallet to enable sync.
        </p>
      ) : null}

      {missingOnChainAccount ? (
        <p className="mt-2 rounded border border-who-orange/20 bg-who-orange-light p-2 text-xs text-who-orange">
          <strong>Wallet account is not initialized on-chain.</strong>
          <br />
          Fund your wallet with a small amount of UXION first.
          <br />
          Wallet: {address}
        </p>
      ) : null}

      {insufficientOnChainBalance ? (
        <p className="mt-2 rounded border border-who-orange/20 bg-who-orange-light p-2 text-xs text-who-orange">
          Insufficient UXION for sync gas fees. Current balance: {readiness?.balanceAmount ?? 0} uxion.
        </p>
      ) : null}

      {readinessError ? (
        <p className="mt-2 rounded border border-who-red/20 bg-who-red-light p-2 text-xs text-who-red">
          {readinessError}
        </p>
      ) : null}

      {!configMissing && walletReady && contractFailures.length > 0 ? (
        <div className="mt-2 rounded border border-who-orange/20 bg-who-orange-light p-2 text-xs text-who-orange">
          <p className="font-semibold">Contract verification failed on XION Testnet-2.</p>
          {contractFailures.map((failure) => (
            <p key={`${failure.envVar}:${failure.address}:${failure.reason}`} className="mt-1">
              - {formatContractFailure(failure)}
            </p>
          ))}
        </div>
      ) : null}

      {quarantineCount > 0 ? (
        <div className="mt-2 rounded border border-who-orange/20 bg-who-orange-light p-2 text-xs text-who-orange">
          <p>
            {quarantineCount} record(s) were excluded from sync because they contain stale or cross-account data.
          </p>
          <button
            type="button"
            onClick={handleClearQuarantine}
            className="mt-2 rounded border border-who-orange/40 px-2 py-1 text-[11px] font-semibold hover:bg-who-orange/10"
          >
            Clear quarantined records
          </button>
        </div>
      ) : null}

      {SHOW_XION_DEBUG ? (
        <details className="mt-3 rounded border border-yellow-300 bg-yellow-50 p-3 text-xs font-mono text-yellow-900">
          <summary className="cursor-pointer font-semibold text-yellow-800">
            Sync Address Diagnostics
          </summary>
          <div className="mt-2 space-y-1">
            <div>
              <span className="font-bold">VaccinationRecord (env):</span>{' '}
              {xionConfig.contracts.vaccinationRecord || <span className="text-red-600">⚠ NOT SET</span>}
            </div>
            <div>
              <span className="font-bold">MilestoneChecker (env):</span>{' '}
              {xionConfig.contracts.milestoneChecker || <span className="text-red-600">⚠ NOT SET</span>}
            </div>
            <div>
              <span className="font-bold">IssuerRegistry (env):</span>{' '}
              {xionConfig.contracts.issuerRegistry || <span className="text-red-600">⚠ NOT SET</span>}
            </div>
            <div>
              <span className="font-bold">GrantEscrow (env):</span>{' '}
              {xionConfig.contracts.grantEscrow || <span className="text-red-600">⚠ NOT SET</span>}
            </div>
            <hr className="border-yellow-300 my-1" />
            <div className="text-yellow-700 text-[10px]">
              Source: NEXT_PUBLIC_XION_* env vars baked at build time.
              Build: {process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown'}.
              If these differ from your Vercel settings, clear site data and reload.
            </div>
          </div>
        </details>
      ) : null}

      {syncDisabledReason ? (
        <p className="mt-2 text-xs text-ui-text-muted">{syncDisabledReason}</p>
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
                      {stepKey === 5 && result?.phaseB?.skipped && done ? 'Skipped (no payout account)' : STEP_LABELS[stepKey]}
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
                  Sync complete
                </p>
                <p className="text-ui-text-muted mt-1">
                  Vaccination records stored {result.mode === 'onchain' ? 'on-chain' : '(demo mode)'}
                </p>
                {result.phaseB?.skipped && (
                  <p className="text-who-orange mt-1">
                    Payout skipped (no valid patient payout account)
                  </p>
                )}
                <div className="mt-2 text-ui-text-muted">
                  <p>Root: {result.merkleRoot.slice(0, 12)}...{result.merkleRoot.slice(-8)}</p>
                  {result.txHash ? (
                    <p className="font-mono">
                      Tx: {shortTxHash(result.txHash)}{result.blockHeight ? ` @ ${result.blockHeight}` : ''}
                    </p>
                  ) : null}
                </div>
                {result.grantsReleased > 0 ? (
                  <p className="font-medium text-who-blue mt-1">${result.grantsReleased} in grants released</p>
                ) : null}
                {result.flaggedCount > 0 ? (
                  <p className="text-who-orange mt-1">{result.flaggedCount} records flagged for review</p>
                ) : null}
                <div className="mt-2">
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
                </div>
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
