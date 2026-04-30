'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import { DbInit } from './DbInit';
import { XION } from '@/lib/xion/config';
import { clearLegacyContractCache } from '@/lib/xion/clearLegacyContractCache';

const AbstraxionProvider = dynamic(
  () => import('@burnt-labs/abstraxion').then((mod) => mod.AbstraxionProvider),
  { ssr: false }
);

// Build the contracts grant list so the Abstraxion session key is authorized
// to execute against our deployed contracts. Without this, every execute()
// call fails with "account not found" because the grantee has no permissions.
const abstraxionContracts: string[] = [
  XION.contracts.vaccinationRecord,
  XION.contracts.milestoneChecker,
  XION.contracts.issuerRegistry,
  XION.contracts.grantEscrow,
].filter(Boolean);

const abstraxionConfig = {
  chainId:  XION.chainId,
  ...(XION.treasury ? { treasury: XION.treasury } : {}),
  rpcUrl:   XION.rpc,
  restUrl:  XION.rest,
  gasPrice: XION.gasPrice,
  // Using the "no-grants path" (direct user signing). 
  // We do not define 'contracts' or 'treasury'. Users will sign transactions
  // directly and pay gas from their connected meta-account balance.
  authentication: {
    // 'auto' resolves to 'popup' on desktop, 'redirect' on mobile/PWA.
    // This is the recommended default per the Abstraxion SDK docs.
    type: 'auto' as const,
    authAppUrl: XION.authApp,
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Audit and clear legacy contract caches on startup to prevent stale overrides.
    clearLegacyContractCache();
  }, []);

  return (
    <AbstraxionProvider config={abstraxionConfig}>
      <DbInit />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            border: '1px solid #E0E0E0',
            color: '#333333',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          },
          success: { iconTheme: { primary: '#009900', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#CC0000', secondary: '#fff' } },
        }}
      />
    </AbstraxionProvider>
  );
}



