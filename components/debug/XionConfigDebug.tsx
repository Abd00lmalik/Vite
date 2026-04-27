'use client';

import { REQUIRED_XION_VARS, OPTIONAL_XION_VARS, isMissing, getXionConfigStatus, getOptionalXionVarStatus } from '@/lib/xion/readiness';
import { useXion } from '@/hooks/useXion';

const DEBUG_ENABLED =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_SHOW_XION_DEBUG === 'true';

function maskValue(val: any): string {
  if (isMissing(val)) return '⚠ MISSING';
  if (typeof val !== 'string') return String(val);
  
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
  if (!DEBUG_ENABLED) return null;

  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown';
  const nodeEnv = process.env.NODE_ENV;
  
  const { configReady, missingVars } = getXionConfigStatus();
  const optionalStatus = getOptionalXionVarStatus();
  const missingOptional = optionalStatus.filter(v => !v.present);
  
  const syncAllowed = configReady && isConnected;
  let syncBlockReason = '';
  if (!configReady) syncBlockReason = `Missing required vars: ${missingVars.join(', ')}`;
  else if (!isConnected) syncBlockReason = 'Wallet not connected';

  return (
    <details className="border border-yellow-300 bg-yellow-50 rounded-lg p-4 text-xs font-mono mt-4" open>
      <summary className="cursor-pointer font-semibold text-yellow-800 text-sm mb-2">
        XION Config Diagnostic
      </summary>
      <div className="space-y-1 mt-2">
        <div className="text-yellow-700 font-bold">Build: {buildTime} | Env: {nodeEnv}</div>
        <hr className="border-yellow-200 my-2" />
        
        <div className="font-bold text-yellow-800 mb-1">
          Required config: {configReady ? '✓ Complete' : '✗ Incomplete'}
        </div>
        {REQUIRED_XION_VARS.map(({ envName, description }) => {
          const val = process.env[envName];
          const missing = isMissing(val);
          return (
            <div key={envName} className={missing ? 'text-red-600' : 'text-green-700'}>
              {missing ? '✗' : '✓'} {envName}: {maskValue(val)} — {description}
            </div>
          );
        })}
        
        <hr className="border-yellow-200 my-2" />
        
        <div className="font-bold text-yellow-700 mb-1">
          Optional config: {OPTIONAL_XION_VARS.length - missingOptional.length} of {OPTIONAL_XION_VARS.length} present
        </div>
        {OPTIONAL_XION_VARS.map(({ envName, description }) => {
          const val = process.env[envName];
          const missing = isMissing(val);
          return (
            <div key={envName} className={missing ? 'text-gray-400' : 'text-green-600'}>
              {missing ? '–' : '✓'} {envName}: {maskValue(val)} — {description}
            </div>
          );
        })}
        
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
      </div>
    </details>
  );
}
