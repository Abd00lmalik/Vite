'use client';
import { getXionConfigStatus, REQUIRED_ENV_VARS } from '@/lib/xion/readiness';

export function ConfigGuard({ children }: { children: React.ReactNode }) {
  const { configReady, missingVars } = getXionConfigStatus();

  if (!configReady) {
    return (
      <div className="min-h-screen bg-ui-bg flex items-center justify-center p-6">
        <div className="bg-white border border-ui-border rounded-xl p-8 max-w-lg w-full shadow-modal text-center">
          <div className="w-16 h-16 bg-who-orange-light rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-who-orange">!</span>
          </div>
          <h2 className="text-xl font-bold text-ui-text mb-3">
            XION Configuration Required
          </h2>
          <p className="text-sm text-ui-text-muted mb-6 leading-relaxed">
            VITE requires XION testnet-2 contract addresses to be configured. Complete deployment and
            set environment variables before enabling real sync.
          </p>
          <div className="bg-ui-bg border border-ui-border rounded-lg p-4 text-left text-xs font-mono mb-6 space-y-1">
            <p className="text-ui-text-muted font-bold mb-2">Required environment variables:</p>
            {REQUIRED_ENV_VARS.map(({ envName, description }) => {
              const isMissing = missingVars.includes(envName);
              return (
                <div key={envName} className="flex items-start justify-between gap-4">
                  <span className={isMissing ? 'text-red-500 font-bold' : 'text-who-green'}>
                    {envName}
                  </span>
                  <span className="text-gray-400 text-right">{description}</span>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-left text-ui-text-muted bg-yellow-50 border border-yellow-100 p-3 rounded-lg mb-6">
            <p className="font-bold text-yellow-800 mb-1">💡 Important Note:</p>
            <p>
              NEXT_PUBLIC_* variables are baked during build. If you added them in Vercel, 
              you must <strong>redeploy without using the build cache</strong> for changes to take effect.
            </p>
          </div>
          <p className="text-xs text-ui-text-muted">
            See <a href="https://github.com/Abd00lmalik/Vite/blob/main/DEPLOY.md" target="_blank" rel="noopener noreferrer" className="text-who-blue hover:underline">DEPLOY.md</a> for setup instructions.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
