'use client';

import { REQUIRED_ENV_VARS, OPTIONAL_ENV_VARS, isMissing } from '@/lib/xion/readiness';
import { xionConfig } from '@/lib/xion/config';

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
  if (!DEBUG_ENABLED) return null;

  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown';
  const nodeEnv = process.env.NODE_ENV;

  return (
    <details className="border border-yellow-300 bg-yellow-50 rounded-lg p-4 text-xs font-mono mt-4" open>
      <summary className="cursor-pointer font-semibold text-yellow-800 text-sm mb-2">
        XION Config Diagnostic
      </summary>
      <div className="space-y-1 mt-2">
        <div className="text-yellow-700 font-bold">Build: {buildTime} | Env: {nodeEnv}</div>
        <hr className="border-yellow-200 my-2" />
        
        <div className="font-bold text-yellow-800 mb-1">Required variables:</div>
        {REQUIRED_ENV_VARS.map(({ key, envName, description }) => {
          const val = xionConfig[key];
          const missing = isMissing(val);
          return (
            <div key={envName} className={missing ? 'text-red-600' : 'text-green-700'}>
              {missing ? '✗' : '✓'} {envName}: {maskValue(val)} — {description}
            </div>
          );
        })}
        
        <hr className="border-yellow-200 my-2" />
        
        <div className="font-bold text-yellow-700 mb-1">Optional variables:</div>
        {OPTIONAL_ENV_VARS.map(({ key, envName, description }) => {
          const val = xionConfig[key];
          const missing = isMissing(val);
          return (
            <div key={envName} className={missing ? 'text-gray-400' : 'text-green-600'}>
              {missing ? '–' : '✓'} {envName}: {maskValue(val)} — {description}
            </div>
          );
        })}
        
        <hr className="border-yellow-200 my-2" />
        <div className="text-[10px] text-yellow-600 italic leading-tight">
          Note: NEXT_PUBLIC_* variables are baked at build time. After changing them in Vercel, 
          you must redeploy with build cache disabled.
        </div>
      </div>
    </details>
  );
}
