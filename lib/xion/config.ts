// lib/xion/config.ts
// CRITICAL: Every process.env access here MUST be a static string literal.
// Next.js replaces these at build time. Dynamic access (process.env[key]) will
// resolve to undefined in the browser bundle even if the var was set at build time.

function normalizePublicEnv(value: string | undefined): string {
  if (!value) return '';
  const normalized = value.trim();
  if (!normalized || normalized.startsWith('@')) return '';
  if (normalized === 'undefined') return '';
  return normalized;
}

export const xionConfig = {
  // Network — static literals only
  rpcUrl:  normalizePublicEnv(process.env.NEXT_PUBLIC_XION_RPC_URL),
  restUrl: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_REST_URL),
  chainId: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_CHAIN_ID),

  // Optional network config
  gasPrice:        normalizePublicEnv(process.env.NEXT_PUBLIC_XION_GAS_PRICE)        || '0.001uxion',
  authAppUrl:      normalizePublicEnv(process.env.NEXT_PUBLIC_XION_AUTH_APP_URL)     || 'https://auth.testnet.burnt.com',
  treasuryAddress: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_TREASURY_ADDRESS),
  useRealXion:     normalizePublicEnv(process.env.NEXT_PUBLIC_USE_REAL_XION) === 'true',

  // Contracts — static literals only
  contracts: {
    vaccinationRecord: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_VACCINATION_RECORD),
    milestoneChecker:  normalizePublicEnv(process.env.NEXT_PUBLIC_XION_MILESTONE_CHECKER),
    issuerRegistry:    normalizePublicEnv(process.env.NEXT_PUBLIC_XION_ISSUER_REGISTRY),
    grantEscrow:       normalizePublicEnv(process.env.NEXT_PUBLIC_XION_GRANT_ESCROW),
  },
} as const;

export type XionConfig = typeof xionConfig;

// Legacy compatibility exports — these map directly to xionConfig
export const XION = {
  rpc: xionConfig.rpcUrl,
  rest: xionConfig.restUrl,
  chainId: xionConfig.chainId,
  treasury: xionConfig.treasuryAddress,
  authApp: xionConfig.authAppUrl,
  gasPrice: xionConfig.gasPrice,
  explorer: 'https://explorer.burnt.com/xion-testnet-2',
  contracts: xionConfig.contracts,
} as const;

export const XION_RUNTIME = {
  useRealXion: xionConfig.useRealXion,
};

export function explorerTxUrl(txHash: string): string {
  return `${XION.explorer}/transactions/${txHash}`;
}

export function explorerAddrUrl(addr: string): string {
  return `${XION.explorer}/accounts/${addr}`;
}

// Circular dependency avoidance: logic that depends on readiness.ts 
// is imported dynamically or provided by readiness.ts directly.
import { getXionConfigStatus, isSyncConfigured } from './readiness';


export function isConfigured(): boolean {
  return isSyncConfigured();
}

export function shouldUseRealXion(signingClient?: unknown, senderAddress?: string): boolean {
  return XION_RUNTIME.useRealXion && isSyncConfigured() && !!signingClient && !!senderAddress;
}
