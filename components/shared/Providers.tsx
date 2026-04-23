'use client';

import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import { DbInit } from './DbInit';

const AbstraxionProvider = dynamic(
  () => import('@burnt-labs/abstraxion').then((mod) => mod.AbstraxionProvider),
  { ssr: false }
);

const abstraxionConfig = {
  chainId:  process.env.NEXT_PUBLIC_XION_CHAIN_ID!,
  treasury: process.env.NEXT_PUBLIC_XION_TREASURY_ADDRESS,
  rpcUrl:   process.env.NEXT_PUBLIC_XION_RPC_URL!,
  restUrl:  process.env.NEXT_PUBLIC_XION_REST_URL!,
  gasPrice: process.env.NEXT_PUBLIC_XION_GAS_PRICE ?? '0.001uxion',
  authentication: {
    // We use 'auto' which leverages Abstraxion's direct signing flow.
    // If 'requireAuth' is true, users sign transactions directly from their meta-account.
    // The "No grants configured" warning in the console is EXPECTED and intentional 
    // because we are not using the treasury session key / grant-based signing flow here.
    type: 'auto' as const,
    authAppUrl: process.env.NEXT_PUBLIC_XION_AUTH_APP_URL,
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
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



