'use client';

import { xionConfig } from '@/lib/xion/config';

// Only render in non-production or when explicitly enabled via Vercel env var.
// NEXT_PUBLIC_SHOW_XION_DEBUG=true can be set temporarily to inspect the live
// build's active contract addresses after a redeploy.
const DEBUG_ENABLED =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_SHOW_XION_DEBUG === 'true';

export function XionConfigDebug() {
  if (!DEBUG_ENABLED) return null;

  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown';

  return (
    <details className="border border-yellow-300 bg-yellow-50 rounded-lg p-4 text-xs font-mono text-yellow-900 mt-4">
      <summary className="cursor-pointer font-semibold text-yellow-800 text-sm">
        XION Config Debug (public env only)
      </summary>
      <div className="mt-3 space-y-1">
        <div><span className="font-bold">Build time:</span> {buildTime}</div>
        <div><span className="font-bold">RPC:</span> {xionConfig.rpcUrl || '⚠ NOT SET'}</div>
        <div><span className="font-bold">REST:</span> {xionConfig.restUrl || '⚠ NOT SET'}</div>
        <div><span className="font-bold">Chain ID:</span> {xionConfig.chainId || '⚠ NOT SET'}</div>
        <hr className="border-yellow-300 my-2" />
        <div>
          <span className="font-bold">VaccinationRecord:</span>{' '}
          {xionConfig.vaccinationRecord || '⚠ NOT SET'}
        </div>
        <div>
          <span className="font-bold">MilestoneChecker:</span>{' '}
          {xionConfig.milestoneChecker || '⚠ NOT SET'}
        </div>
        <div>
          <span className="font-bold">IssuerRegistry:</span>{' '}
          {xionConfig.issuerRegistry || '⚠ NOT SET'}
        </div>
        <div>
          <span className="font-bold">GrantEscrow:</span>{' '}
          {xionConfig.grantEscrow || '⚠ NOT SET'}
        </div>
        <hr className="border-yellow-300 my-2" />
        <div>
          <span className="font-bold">useRealXion:</span>{' '}
          {String(xionConfig.useRealXion)}
        </div>
      </div>
    </details>
  );
}
