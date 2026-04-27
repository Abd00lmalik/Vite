'use client';

import { xionConfig } from '@/lib/xion/config';
import { getXionConfigStatus, getOptionalXionVarStatus } from '@/lib/xion/readiness';
import { useXion } from '@/hooks/useXion';

function maskValue(val: string | undefined): string {
  if (!val || val.trim() === '') return '⚠ MISSING';
  
  const str = val.trim();
  if (str.startsWith('xion1') && str.length > 20) {
    return `${str.slice(0, 12)}...${str.slice(-6)}`;
  }
  if (str.startsWith('https://')) return str; // URLs shown in full — not secret
  if (str.length > 10) return `${str.slice(0, 6)}...`;
  return str;
}

export function XionConfigDebug() {
  const { isConnected } = useXion();
  
  const showDebug =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_SHOW_XION_DEBUG === 'true';

  if (!showDebug) return null;

  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown';
  const nodeEnv = process.env.NODE_ENV;
  
  const { configReady, missingVars } = getXionConfigStatus();
  const optionalStatus = getOptionalXionVarStatus();
  
  const syncAllowed = configReady && isConnected;
  let syncBlockReason = '';
  if (!configReady) syncBlockReason = `Missing required vars: ${missingVars.join(', ')}`;
  else if (!isConnected) syncBlockReason = 'Wallet not connected';

  // Sourced from static literals in xionConfig
  const requiredDisplay = [
    { label: 'NEXT_PUBLIC_XION_RPC_URL',            value: xionConfig.rpcUrl,            desc: 'RPC endpoint' },
    { label: 'NEXT_PUBLIC_XION_REST_URL',           value: xionConfig.restUrl,           desc: 'REST endpoint' },
    { label: 'NEXT_PUBLIC_XION_CHAIN_ID',           value: xionConfig.chainId,           desc: 'Chain ID' },
    { label: 'NEXT_PUBLIC_XION_VACCINATION_RECORD', value: xionConfig.contracts.vaccinationRecord, desc: 'VaccinationRecord' },
    { label: 'NEXT_PUBLIC_XION_MILESTONE_CHECKER',  value: xionConfig.contracts.milestoneChecker,  desc: 'MilestoneChecker' },
  ];

  return (
    <details className="border border-yellow-300 bg-yellow-50 rounded-lg p-4 text-xs font-mono mt-4" open>
      <summary className="cursor-pointer font-semibold text-yellow-800 text-sm mb-2">
        XION Config Diagnostic
      </summary>
      <div className="space-y-1 mt-2">
        <div className="text-yellow-700 font-bold">Build: {buildTime} | Env: {nodeEnv}</div>
        <div className="text-yellow-700 text-[10px] mt-1 mb-2 leading-relaxed">
          Values shown below are what the client bundle actually resolved. 
          If a value shows ⚠ MISSING but Vercel has it set, static replacement failed.
          <a href="/xion-build-diagnostic.json" target="_blank" className="underline ml-1">
            View build diagnostic →
          </a>
        </div>
        
        <hr className="border-yellow-200 my-2" />
        
        <div className="font-bold text-yellow-800 mb-1">
          Required config: {configReady ? '✓ Complete' : '✗ Incomplete'}
        </div>
        {requiredDisplay.map(({ label, value, desc }) => (
          <div key={label} className="mb-2">
            <div className={!value ? 'text-red-600' : 'text-green-700'}>
              {!value ? '✗' : '✓'} {label}: {maskValue(value)} — {desc}
            </div>
            {!value && (
              <div className="text-[10px] text-red-500 ml-4 mt-1">
                This variable was not present when this bundle was built.
                If you have already added it in Vercel, you must redeploy with build cache disabled.
              </div>
            )}
          </div>
        ))}
        
        <hr className="border-yellow-200 my-2" />
        
        <div className="font-bold text-yellow-700 mb-1">
          Optional config: {optionalStatus.filter(v => v.present).length} of {optionalStatus.length} present
        </div>
        {optionalStatus.map(({ envName, present, description }) => (
          <div key={envName} className={!present ? 'text-gray-400' : 'text-green-600'}>
            {present ? '✓' : '–'} {envName}: {description}
          </div>
        ))}
        
        <hr className="border-yellow-200 my-2" />
        
        <div className="font-bold text-yellow-800 mb-1">
          Sync allowed: {syncAllowed ? 'Yes' : 'No'}
        </div>
        {!syncAllowed && (
          <div className="text-red-600">— Reason: {syncBlockReason}</div>
        )}
        
        <hr className="border-yellow-200 my-2" />
        <div className="text-[10px] text-yellow-600 italic leading-tight">
          Note: NEXT_PUBLIC_* variables are baked at build time. After changing them in Vercel, 
          you must redeploy with build cache disabled.
        </div>
        <div className="mt-2 text-right">
          <a
            href="/xion-build-diagnostic.json"
            target="_blank"
            className="text-yellow-700 underline text-xs font-semibold"
          >
            View raw build diagnostic →
          </a>
        </div>
      </div>
    </details>
  );
}
