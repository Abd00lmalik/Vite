function normalizePublicEnv(value: string | undefined): string {
  if (!value) return '';
  const normalized = value.trim();
  if (!normalized || normalized.startsWith('@')) return '';
  return normalized;
}

export const xionConfig = {
  rpcUrl: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_RPC_URL),
  restUrl: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_REST_URL),
  chainId: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_CHAIN_ID),
  issuerRegistry: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_ISSUER_REGISTRY),
  vaccinationRecord: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_VACCINATION_RECORD),
  milestoneChecker: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_MILESTONE_CHECKER),
  grantEscrow: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_GRANT_ESCROW),
  treasuryAddress: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_TREASURY_ADDRESS),
  authAppUrl: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_AUTH_APP_URL),
  gasPrice: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_GAS_PRICE),
  useRealXion: normalizePublicEnv(process.env.NEXT_PUBLIC_USE_REAL_XION) === 'true',
} as const;

export type XionConfig = typeof xionConfig;

const DEFAULT_RPC = 'https://rpc.xion-testnet-2.burnt.com:443';
const DEFAULT_REST = 'https://api.xion-testnet-2.burnt.com';
const DEFAULT_CHAIN_ID = 'xion-testnet-2';
const DEFAULT_AUTH_APP = 'https://auth.testnet.burnt.com';
const DEFAULT_GAS_PRICE = '0.001uxion';

export const XION_ENV_NAME_BY_FIELD: Record<
  keyof Pick<
    XionConfig,
    | 'rpcUrl'
    | 'restUrl'
    | 'chainId'
    | 'issuerRegistry'
    | 'vaccinationRecord'
    | 'milestoneChecker'
    | 'grantEscrow'
  >,
  string
> = {
  rpcUrl: 'NEXT_PUBLIC_XION_RPC_URL',
  restUrl: 'NEXT_PUBLIC_XION_REST_URL',
  chainId: 'NEXT_PUBLIC_XION_CHAIN_ID',
  issuerRegistry: 'NEXT_PUBLIC_XION_ISSUER_REGISTRY',
  vaccinationRecord: 'NEXT_PUBLIC_XION_VACCINATION_RECORD',
  milestoneChecker: 'NEXT_PUBLIC_XION_MILESTONE_CHECKER',
  grantEscrow: 'NEXT_PUBLIC_XION_GRANT_ESCROW',
};

export const SYNC_REQUIRED_XION_FIELDS: (keyof XionConfig)[] = [
  'rpcUrl',
  'restUrl',
  'chainId',
  'vaccinationRecord',
  'milestoneChecker',
];

export const SYNC_OPTIONAL_XION_FIELDS: (keyof XionConfig)[] = [
  'issuerRegistry',
  'grantEscrow',
];

export const XION = {
  rpc: xionConfig.rpcUrl || DEFAULT_RPC,
  rest: xionConfig.restUrl || DEFAULT_REST,
  chainId: xionConfig.chainId || DEFAULT_CHAIN_ID,
  treasury: xionConfig.treasuryAddress,
  authApp: xionConfig.authAppUrl || DEFAULT_AUTH_APP,
  gasPrice: xionConfig.gasPrice || DEFAULT_GAS_PRICE,
  explorer: 'https://explorer.burnt.com/xion-testnet-2',
  contracts: {
    issuerRegistry: xionConfig.issuerRegistry,
    vaccinationRecord: xionConfig.vaccinationRecord,
    milestoneChecker: xionConfig.milestoneChecker,
    grantEscrow: xionConfig.grantEscrow,
  },
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

export function isSyncConfigured(): boolean {
  return SYNC_REQUIRED_XION_FIELDS.every((field) => Boolean(xionConfig[field]));
}

export function isConfigured(): boolean {
  return isSyncConfigured();
}

export function shouldUseRealXion(signingClient?: unknown, senderAddress?: string): boolean {
  return XION_RUNTIME.useRealXion && isSyncConfigured() && !!signingClient && !!senderAddress;
}
