'use client';
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useAbstraxionClient,
} from '@burnt-labs/abstraxion';
import { useEffect, useState } from 'react';
import { XION, isConfigured, explorerAddrUrl } from '@/lib/xion/config';

export function useXion() {
  const { data: account, login, logout: logoutAccount, isLoading } =
    useAbstraxionAccount();
  const { client: signingClient } =
    useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();

  // Handle ?granted=true redirect from Abstraxion auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('granted') === 'true') {
        login();
        // Remove the param from URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [login]);

  const address = account?.bech32Address ?? null;

  function disconnect() {
    logoutAccount?.();
  }

  return {
    address,
    account,
    signingClient,
    queryClient,
    login,
    disconnect,
    isLoading,
    isConnected: !!address,
    explorerUrl: address ? explorerAddrUrl(address) : null,
    configured:  isConfigured(),
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
    fetch(`${XION.rest}/cosmos/bank/v1beta1/balances/${address}`)
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



