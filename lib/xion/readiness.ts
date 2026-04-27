import { xionConfig } from './config';

export interface EnvVarDef {
  key: keyof typeof xionConfig;
  envName: string;
  description: string;
}

export const REQUIRED_ENV_VARS: EnvVarDef[] = [
  { key: 'rpcUrl',            envName: 'NEXT_PUBLIC_XION_RPC_URL',             description: 'XION RPC endpoint' },
  { key: 'restUrl',           envName: 'NEXT_PUBLIC_XION_REST_URL',            description: 'XION REST endpoint' },
  { key: 'chainId',           envName: 'NEXT_PUBLIC_XION_CHAIN_ID',            description: 'XION chain identifier' },
  { key: 'vaccinationRecord', envName: 'NEXT_PUBLIC_XION_VACCINATION_RECORD',   description: 'VaccinationRecord contract' },
  { key: 'milestoneChecker',  envName: 'NEXT_PUBLIC_XION_MILESTONE_CHECKER',    description: 'MilestoneChecker contract' },
];

export const OPTIONAL_ENV_VARS: EnvVarDef[] = [
  { key: 'issuerRegistry',    envName: 'NEXT_PUBLIC_XION_ISSUER_REGISTRY',     description: 'IssuerRegistry contract' },
  { key: 'grantEscrow',       envName: 'NEXT_PUBLIC_XION_GRANT_ESCROW',        description: 'GrantEscrow contract' },
  { key: 'gasPrice',          envName: 'NEXT_PUBLIC_XION_GAS_PRICE',           description: 'Gas price (defaults to 0.001uxion)' },
  { key: 'authAppUrl',        envName: 'NEXT_PUBLIC_XION_AUTH_APP_URL',        description: 'Abstraxion auth app URL' },
  { key: 'treasuryAddress',   envName: 'NEXT_PUBLIC_XION_TREASURY_ADDRESS',    description: 'Treasury address' },
];

export interface ContractValidationFailure {
  envVar: string;
  address: string;
  reason: 'not_found' | 'not_a_contract' | 'empty' | 'invalid_format';
}

export interface ContractValidationResult {
  valid: boolean;
  failures: ContractValidationFailure[];
}

/**
 * Robust check for missing environment variables.
 * Handles undefined, null, empty strings, whitespace, and placeholder sentinels.
 */
export function isMissing(value: any): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'string') return false; // Handles booleans or other types
  const trimmed = value.trim();
  if (trimmed === '') return true;
  if (trimmed.startsWith('REQUIRED_INPUT_')) return true;
  if (trimmed === 'undefined') return true;
  return false;
}

/**
 * Evaluates the current configuration state.
 * Returns exactly which required and optional variables are missing.
 */
export function getXionConfigStatus() {
  const missingVars = REQUIRED_ENV_VARS
    .filter(({ key }) => isMissing(xionConfig[key]))
    .map(({ envName }) => envName);

  const missingOptionalVars = OPTIONAL_ENV_VARS
    .filter(({ key }) => isMissing(xionConfig[key]))
    .map(({ envName }) => envName);
    
  return { 
    configReady: missingVars.length === 0, 
    missingVars,
    missingOptionalVars
  };
}

/**
 * Validates provided contract addresses on-chain.
 */
export async function validateContractsOnChain(
  contracts: {
    vaccinationRecord: string;
    milestoneChecker: string;
  },
  restUrl: string
): Promise<ContractValidationResult> {
  const required = [
    {
      envVar: 'NEXT_PUBLIC_XION_VACCINATION_RECORD',
      address: contracts.vaccinationRecord?.trim() ?? '',
    },
    {
      envVar: 'NEXT_PUBLIC_XION_MILESTONE_CHECKER',
      address: contracts.milestoneChecker?.trim() ?? '',
    },
  ];

  const failures: ContractValidationFailure[] = [];

  for (const { envVar, address } of required) {
    if (!address) {
      failures.push({ envVar, address: '', reason: 'empty' });
      continue;
    }

    if (!address.startsWith('xion1') || address.length < 40) {
      failures.push({ envVar, address, reason: 'invalid_format' });
      continue;
    }

    try {
      const response = await fetch(`${restUrl}/cosmwasm/wasm/v1/contract/${address}`, {
        method: 'GET',
        cache: 'no-store',
      });
      
      if (response.status === 404) {
        failures.push({ envVar, address, reason: 'not_found' });
        continue;
      }

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.contract_info?.code_id) {
        failures.push({ envVar, address, reason: 'not_a_contract' });
      }
    } catch {
      failures.push({ envVar, address, reason: 'not_found' });
    }
  }

  return {
    valid: failures.length === 0,
    failures,
  };
}

export function formatContractFailure(failure: ContractValidationFailure): string {
  const redeployNote = 'If you recently updated this variable in Vercel, you must redeploy with cleared cache.';

  switch (failure.reason) {
    case 'empty':
      return `${failure.envVar} is not set. Add it in Vercel and redeploy.`;
    case 'invalid_format':
      return `${failure.envVar} ("${failure.address}") is not a valid xion1... address. ${redeployNote}`;
    case 'not_found':
      return `${failure.envVar} ("${failure.address}") was not found on XION Testnet-2. ${redeployNote}`;
    case 'not_a_contract':
      return `${failure.envVar} ("${failure.address}") is not a valid contract. ${redeployNote}`;
    default:
      return `${failure.envVar} is invalid.`;
  }
}
