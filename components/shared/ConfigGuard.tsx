'use client';
import { isConfigured } from '@/lib/xion/config';
import Link from 'next/link';

export function ConfigGuard({ children }: { children: React.ReactNode }) {
  if (!isConfigured()) {
    return (
      <div className="min-h-screen bg-ui-bg flex items-center justify-center p-6">
        <div className="bg-white border border-ui-border rounded-xl p-8
                        max-w-lg w-full shadow-modal text-center">
          <div className="w-16 h-16 bg-who-orange-light rounded-full
                          flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">Ã¢Å¡â„¢Ã¯Â¸Â</span>
          </div>
          <h2 className="text-xl font-bold text-ui-text mb-3">
            XION Configuration Required
          </h2>
          <p className="text-sm text-ui-text-muted mb-6 leading-relaxed">
            Vite requires XION testnet-2 contract addresses to be
            configured. Please complete the deployment steps in DEPLOY.md
            and add the contract addresses to your environment variables.
          </p>
          <div className="bg-ui-bg border border-ui-border rounded-lg p-4
                          text-left text-xs font-mono mb-6 space-y-1">
            <p className="text-ui-text-muted">Required in .env.local:</p>
            {[
              'NEXT_PUBLIC_XION_RPC_URL',
              'NEXT_PUBLIC_XION_REST_URL',
              'NEXT_PUBLIC_XION_CHAIN_ID',
              'NEXT_PUBLIC_XION_TREASURY_ADDRESS',
              'NEXT_PUBLIC_XION_ISSUER_REGISTRY',
              'NEXT_PUBLIC_XION_VACCINATION_RECORD',
              'NEXT_PUBLIC_XION_MILESTONE_CHECKER',
              'NEXT_PUBLIC_XION_GRANT_ESCROW',
            ].map(k => (
              <p key={k} className="text-who-blue">{k}=...</p>
            ))}
          </div>
          <p className="text-xs text-ui-text-muted">
            See{' '}
            <a href="https://github.com/Abd00lmalik/Vite/blob/main/DEPLOY.md"
               target="_blank" rel="noopener noreferrer"
               className="text-who-blue hover:underline">
              DEPLOY.md
            </a>
            {' '}for setup instructions.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}



