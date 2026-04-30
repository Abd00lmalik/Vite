'use client';
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useAbstraxionClient,
} from '@burnt-labs/abstraxion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { XION, explorerAddrUrl } from '@/lib/xion/config';
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

export function useXion() {
  const session = useAuthStore((state) => state.session);
  const { data: account, login, logout: logoutAccount, isLoading } =
    useAbstraxionAccount();
  const { client: signingClient } =
    useAbstraxionSigningClient({ requireAuth: true });
  const { client: queryClient } = useAbstraxionClient();
  const connectIntentUserRef = useRef<string | null>(null);
  const [boundWallet, setBoundWallet] = useState<ScopedWalletState | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Handle ?granted=true redirect from Abstraxion auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('granted') === 'true') {
        if (session?.userId) {
          connectIntentUserRef.current = session.userId;
        }
        login();
        // Remove the param from URL
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
      // Always store in localStorage for UI display
      writeScopedWalletState(state);
      setBoundWallet(state);
      setWalletError(null);
      connectIntentUserRef.current = null;

      // Only write to Dexie if the address is verified on-chain.
      // This prevents stale/ephemeral abstract account addresses from
      // poisoning the sync pipeline via resolvePatientPayoutAddress.
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
          // Network error — store optimistically but log the issue
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

    // A wallet is connected but not bound to the current authenticated account.
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
    signingClient,
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



