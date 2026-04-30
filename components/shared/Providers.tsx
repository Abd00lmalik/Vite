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

// Contract addresses used for session grants (only when treasury is configured).
const abstraxionContracts: string[] = [
  XION.contracts.vaccinationRecord,
  XION.contracts.milestoneChecker,
  XION.contracts.issuerRegistry,
  XION.contracts.grantEscrow,
].filter(Boolean);

const hasTreasury = Boolean(XION.treasury);

// ── Config strategy ─────────────────────────────────────────────────────────
// WITH treasury: session grants mode. The session key gets ContractExecution
//   grants + fee sponsorship from the treasury. GranteeSignerClient.execute()
//   works without user approval per tx. Gas is paid by treasury.
//
// WITHOUT treasury: no-grants path (direct signing). The user authenticates
//   but no on-chain grants are created. useAbstraxionSigningClient({ requireAuth: true })
//   returns PopupSigningClient which opens a dashboard popup per transaction.
//   The user's funded meta-account pays gas directly.
const abstraxionConfig = {
  chainId:  XION.chainId,
  rpcUrl:   XION.rpc,
  restUrl:  XION.rest,
  gasPrice: XION.gasPrice,
  ...(hasTreasury ? {
    contracts: abstraxionContracts,
    treasury: XION.treasury,
  } : {}),
  authentication: {
    type: 'auto' as const,
    authAppUrl: XION.authApp,
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
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
