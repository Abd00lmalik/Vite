const REQUIRED_XION_ENV_VARS = [
  'NEXT_PUBLIC_XION_RPC_URL',
  'NEXT_PUBLIC_XION_REST_URL',
  'NEXT_PUBLIC_XION_CHAIN_ID',
  'NEXT_PUBLIC_XION_ISSUER_REGISTRY',
  'NEXT_PUBLIC_XION_VACCINATION_RECORD',
  'NEXT_PUBLIC_XION_MILESTONE_CHECKER',
  'NEXT_PUBLIC_XION_GRANT_ESCROW',
] as const;

const XION_PUBLIC_ENV: Record<(typeof REQUIRED_XION_ENV_VARS)[number], string | undefined> = {
  NEXT_PUBLIC_XION_RPC_URL: process.env.NEXT_PUBLIC_XION_RPC_URL,
  NEXT_PUBLIC_XION_REST_URL: process.env.NEXT_PUBLIC_XION_REST_URL,
  NEXT_PUBLIC_XION_CHAIN_ID: process.env.NEXT_PUBLIC_XION_CHAIN_ID,
  NEXT_PUBLIC_XION_ISSUER_REGISTRY: process.env.NEXT_PUBLIC_XION_ISSUER_REGISTRY,
  NEXT_PUBLIC_XION_VACCINATION_RECORD: process.env.NEXT_PUBLIC_XION_VACCINATION_RECORD,
  NEXT_PUBLIC_XION_MILESTONE_CHECKER: process.env.NEXT_PUBLIC_XION_MILESTONE_CHECKER,
  NEXT_PUBLIC_XION_GRANT_ESCROW: process.env.NEXT_PUBLIC_XION_GRANT_ESCROW,
};

export interface XionConfigStatus {
  configReady: boolean;
  missingVars: string[];
}

export function getXionConfigStatus(): XionConfigStatus {
  const missingVars = REQUIRED_XION_ENV_VARS.filter((key) => {
    const value = XION_PUBLIC_ENV[key];
    return !value || !value.trim() || value.trim().startsWith('@');
  });

  return {
    configReady: missingVars.length === 0,
    missingVars: [...missingVars],
  };
}
