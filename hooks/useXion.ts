'use client';
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useAbstraxionClient,
} from '@burnt-labs/abstraxion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { XION, explorerAddrUrl, SHOW_XION_DEBUG } from '@/lib/xion/config';
import { checkXionAccountPreflight } from '@/lib/xion/preflight';
import { isSyncConfigured } from '@/lib/xion/readiness';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/db/schema';
import {
  clearLegacyWalletStateKeys,
  clearScopedWalletState,
  readScopedWalletState,
  writeScopedWalletState,
  type ScopedWalletState,
} from '@/lib/xion/walletState';

const hasTreasury = Boolean(XION.treasury);

export function useXion() {
  const session = useAuthStore((state) => state.session);
  const { data: account, login, logout: logoutAccount, isLoading } =
    useAbstraxionAccount();

  // Session key client (GranteeSignerClient) — has .execute(), needs feegrant.
  // Only useful when treasury is configured for fee sponsorship.
  const { client: sessionClient, signArb } =
    useAbstraxionSigningClient();

  // Direct signing client (PopupSigningClient) — has .signAndBroadcast(),
  // user pays gas via popup approval. Works without treasury/feegrant.
  const { client: directClient, error: directSigningError } =
    useAbstraxionSigningClient({ requireAuth: true });

  const { client: queryClient } = useAbstraxionClient();
  const connectIntentUserRef = useRef<string | null>(null);
  const [boundWallet, setBoundWallet] = useState<ScopedWalletState | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Choose the right client based on treasury availability:
  // - With treasury: prefer session client (GranteeSignerClient, gasless)
  // - Without treasury: use direct client (PopupSigningClient, user pays gas)
  const signingMode: 'session' | 'direct' | 'none' = useMemo(() => {
    if (hasTreasury && sessionClient) return 'session';
    if (directClient) return 'direct';
    if (sessionClient) return 'session'; // fallback, will warn about feegrant
    return 'none';
  }, [sessionClient, directClient]);

  const activeSigningClient = useMemo(() => {
    if (signingMode === 'session') return sessionClient ?? null;
    if (signingMode === 'direct') return directClient ?? null;
    return null;
  }, [signingMode, sessionClient, directClient]);

  // SDK Audit logging
  useEffect(() => {
    const c = activeSigningClient;
    if (!c) return;
    const clientAny = c as any;
    const proto = Object.getPrototypeOf(c);
    if (SHOW_XION_DEBUG) {
      console.log("[XION SDK AUDIT]", {
        signingMode,
        hasTreasury,
        clientConstructor: clientAny?.constructor?.name,
        prototypeKeys: Object.getOwnPropertyNames(proto ?? {}),
        hasExecute: typeof clientAny?.execute,
        hasSignAndBroadcast: typeof clientAny?.signAndBroadcast,
        hasSignArb: typeof signArb,
        sessionClient: (sessionClient as any)?.constructor?.name ?? "none",
        directClient: (directClient as any)?.constructor?.name ?? "none",
        directSigningError: directSigningError ?? "none",
      });
    }
  }, [activeSigningClient, signingMode, sessionClient, directClient, signArb, directSigningError]);

  // Handle ?granted=true redirect from Abstraxion auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('granted') === 'true') {
        if (session?.userId) {
          connectIntentUserRef.current = session.userId;
        }
        login();
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [login, session?.userId]);

  useEffect(() => {
    if (!session?.userId) {
      setBoundWallet(null);
      setWalletError(null);
      return;
    }
    setBoundWallet(readScopedWalletState(session.userId));
    setWalletError(null);
  }, [session?.userId]);

  useEffect(() => {
    const currentAddress = account?.bech32Address ?? null;
    const currentUserId = session?.userId;

    if (!currentUserId || !currentAddress) {
      return;
    }

    const stored = readScopedWalletState(currentUserId);
    if (stored?.walletAddress === currentAddress) {
      setBoundWallet(stored);
      setWalletError(null);
      connectIntentUserRef.current = null;
      return;
    }

    if (connectIntentUserRef.current === currentUserId) {
      const state: ScopedWalletState = {
        userId: currentUserId,
        walletAddress: currentAddress,
        connectedAt: new Date().toISOString(),
      };
      writeScopedWalletState(state);
      setBoundWallet(state);
      setWalletError(null);
      connectIntentUserRef.current = null;

      void (async () => {
        try {
          const preflight = await checkXionAccountPreflight(currentAddress);
          if (preflight.accountFound) {
            await db.users.update(currentUserId, {
              walletAddress: currentAddress,
              walletConnectedAt: state.connectedAt,
            });
            console.log(
              `[useXion] Wallet ${currentAddress} verified on-chain and saved to user record.`
            );
          } else {
            console.warn(
              `[useXion] Wallet ${currentAddress} is not initialized on-chain. ` +
              `Stored in localStorage for UI but NOT written to Dexie to prevent sync poisoning. ` +
              `Fund this address to complete binding.`
            );
          }
        } catch (error) {
          console.warn(
            `[useXion] Could not verify wallet ${currentAddress} on-chain (network error). ` +
            `Writing to Dexie optimistically.`,
            error
          );
          await db.users.update(currentUserId, {
            walletAddress: currentAddress,
            walletConnectedAt: state.connectedAt,
          });
        }
      })();
      return;
    }

    setWalletError('Connected wallet does not match this account. Reconnect your wallet.');
    logoutAccount?.();
    setBoundWallet(null);
  }, [account?.bech32Address, logoutAccount, session?.userId]);

  useEffect(() => {
    if (session?.userId) return;
    if (!account?.bech32Address) return;

    clearLegacyWalletStateKeys();
    logoutAccount?.();
  }, [account?.bech32Address, logoutAccount, session?.userId]);

  const address = useMemo(() => {
    const currentAddress = account?.bech32Address ?? null;
    if (!session?.userId || !currentAddress || !boundWallet) return null;
    if (boundWallet.userId !== session.userId) return null;
    return boundWallet.walletAddress === currentAddress ? currentAddress : null;
  }, [account?.bech32Address, boundWallet, session?.userId]);

  function connect() {
    if (!session?.userId) {
      setWalletError('Sign in before connecting a XION wallet.');
      return;
    }
    connectIntentUserRef.current = session.userId;
    setWalletError(null);
    login();
  }

  function disconnect() {
    if (session?.userId) {
      clearScopedWalletState(session.userId);
      void db.users.update(session.userId, {
        walletAddress: undefined,
        walletConnectedAt: undefined,
      });
    }
    clearLegacyWalletStateKeys();
    connectIntentUserRef.current = null;
    setBoundWallet(null);
    setWalletError(null);
    logoutAccount?.();
  }

  return {
    address,
    account,
    signingClient: activeSigningClient,
    signingMode,
    queryClient,
    connect,
    login: connect,
    disconnect,
    isLoading,
    isConnected: !!address,
    walletError,
    explorerUrl: address ? explorerAddrUrl(address) : null,
    configured:  isSyncConfigured(),
  };
}

// Hook to read on-chain balance of a XION address
export function useXionBalance(address: string | null) {
  const { client: queryClient } = useAbstraxionClient();
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address || !queryClient) return;
    setLoading(true);
    fetch(`${XION.rest}/cosmos/bank/v1beta1/balances/${address}`, { method: 'GET', cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        const uxion = data.balances?.find((b: any) => b.denom === 'uxion');
        setBalance(uxion?.amount ?? '0');
      })
      .catch(() => setBalance('0'))
      .finally(() => setLoading(false));
  }, [address, queryClient]);

  return { balance, loading };
}
