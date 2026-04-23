function normalizePublicEnv(value: string | undefined): string {
  if (!value) {
    return '';
  }

  // Secret-style placeholders are invalid at runtime.
  if (value.trim().startsWith('@')) {
    return '';
  }

  return value;
}

const DEFAULT_RPC = 'https://rpc.xion-testnet-2.burnt.com:443';
const DEFAULT_REST = 'https://api.xion-testnet-2.burnt.com';
const DEFAULT_CHAIN_ID = 'xion-testnet-2';
const DEFAULT_AUTH_APP = 'https://auth.testnet.burnt.com';
const DEFAULT_GAS_PRICE = '0.001uxion';

export const XION = {
  rpc: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_RPC_URL) || DEFAULT_RPC,
  rest: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_REST_URL) || DEFAULT_REST,
  chainId: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_CHAIN_ID) || DEFAULT_CHAIN_ID,
  treasury: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_TREASURY_ADDRESS),
  authApp: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_AUTH_APP_URL) || DEFAULT_AUTH_APP,
  gasPrice: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_GAS_PRICE) || DEFAULT_GAS_PRICE,
  explorer: 'https://explorer.burnt.com/xion-testnet-2',
  contracts: {
    issuerRegistry: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_ISSUER_REGISTRY),
    vaccinationRecord: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_VACCINATION_RECORD),
    milestoneChecker: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_MILESTONE_CHECKER),
    grantEscrow: normalizePublicEnv(process.env.NEXT_PUBLIC_XION_GRANT_ESCROW),
  },
};

export function explorerTxUrl(txHash: string): string {
  return `${XION.explorer}/transactions/${txHash}`;
}

export function explorerAddrUrl(addr: string): string {
  return `${XION.explorer}/accounts/${addr}`;
}

export function isConfigured(): boolean {
  return !!(
    XION.rpc &&
    XION.rest &&
    XION.chainId &&
    XION.treasury &&
    XION.contracts.issuerRegistry &&
    XION.contracts.vaccinationRecord &&
    XION.contracts.milestoneChecker &&
    XION.contracts.grantEscrow
  );
}
