// All XION configuration Ã¢â‚¬â€ fail loudly if missing

export const XION = {
  rpc:       process.env.NEXT_PUBLIC_XION_RPC_URL!,
  rest:      process.env.NEXT_PUBLIC_XION_REST_URL!,
  chainId:   process.env.NEXT_PUBLIC_XION_CHAIN_ID!,
  treasury:  process.env.NEXT_PUBLIC_XION_TREASURY_ADDRESS!,
  authApp:   process.env.NEXT_PUBLIC_XION_AUTH_APP_URL!,
  gasPrice:  process.env.NEXT_PUBLIC_XION_GAS_PRICE ?? '0.001uxion',
  explorer:  'https://explorer.burnt.com/xion-testnet-2',
  contracts: {
    issuerRegistry:    process.env.NEXT_PUBLIC_XION_ISSUER_REGISTRY!,
    vaccinationRecord: process.env.NEXT_PUBLIC_XION_VACCINATION_RECORD!,
    milestoneChecker:  process.env.NEXT_PUBLIC_XION_MILESTONE_CHECKER!,
    grantEscrow:       process.env.NEXT_PUBLIC_XION_GRANT_ESCROW!,
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



