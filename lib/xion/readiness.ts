// lib/xion/readiness.ts
import { xionConfig } from './config';

// Metadata about variables for documentation/UI purposes
export const REQUIRED_XION_VARS = [
  { envName: 'NEXT_PUBLIC_XION_RPC_URL',            description: 'XION RPC endpoint' },
  { envName: 'NEXT_PUBLIC_XION_REST_URL',           description: 'XION REST endpoint' },
  { envName: 'NEXT_PUBLIC_XION_CHAIN_ID',           description: 'XION chain identifier' },
  { envName: 'NEXT_PUBLIC_XION_VACCINATION_RECORD', description: 'VaccinationRecord contract address' },
  { envName: 'NEXT_PUBLIC_XION_MILESTONE_CHECKER',  description: 'MilestoneChecker contract address' },
] as const;

export const OPTIONAL_XION_VARS = [
  { envName: 'NEXT_PUBLIC_XION_ISSUER_REGISTRY',   description: 'IssuerRegistry contract' },
  { envName: 'NEXT_PUBLIC_XION_GRANT_ESCROW',      description: 'GrantEscrow contract' },
  { envName: 'NEXT_PUBLIC_XION_GAS_PRICE',         description: 'Gas price override' },
  { envName: 'NEXT_PUBLIC_XION_AUTH_APP_URL',      description: 'Abstraxion auth app URL' },
  { envName: 'NEXT_PUBLIC_XION_TREASURY_ADDRESS',  description: 'Treasury address' },
] as const;

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
  if (typeof value !== 'string') return false; 
  const trimmed = value.trim();
  if (trimmed === '') return true;
  if (trimmed.startsWith('REQUIRED_INPUT_')) return true;
  if (trimmed === 'undefined') return true;
  return false;
}

/**
 * Checks config values from the canonical xionConfig object.
 * xionConfig was built from static process.env literals at build time,
 * so these values are correct in both server and browser contexts.
 * This function avoids dynamic process.env[envName] access.
 */
export function isSyncConfigured(): boolean {
  return (
    !!xionConfig.rpcUrl &&
    !!xionConfig.restUrl &&
    !!xionConfig.chainId &&
    !!xionConfig.contracts.vaccinationRecord &&
    !!xionConfig.contracts.milestoneChecker
  );
}

export function getMissingXionVars(): string[] {
  const missing: string[] = [];
  if (!xionConfig.rpcUrl)                      missing.push('NEXT_PUBLIC_XION_RPC_URL');
  if (!xionConfig.restUrl)                     missing.push('NEXT_PUBLIC_XION_REST_URL');
  if (!xionConfig.chainId)                     missing.push('NEXT_PUBLIC_XION_CHAIN_ID');
  if (!xionConfig.contracts.vaccinationRecord) missing.push('NEXT_PUBLIC_XION_VACCINATION_RECORD');
  if (!xionConfig.contracts.milestoneChecker)  missing.push('NEXT_PUBLIC_XION_MILESTONE_CHECKER');
  return missing;
}

export function getXionConfigStatus(): { configReady: boolean; missingVars: string[] } {
  const missingVars = getMissingXionVars();
  return { configReady: missingVars.length === 0, missingVars };
}

export function getOptionalXionVarStatus(): Array<{
  envName: string;
  present: boolean;
  description: string;
}> {
  return [
    { envName: 'NEXT_PUBLIC_XION_ISSUER_REGISTRY',   present: !!xionConfig.contracts.issuerRegistry,    description: 'IssuerRegistry contract' },
    { envName: 'NEXT_PUBLIC_XION_GRANT_ESCROW',      present: !!xionConfig.contracts.grantEscrow,       description: 'GrantEscrow contract' },
    { envName: 'NEXT_PUBLIC_XION_GAS_PRICE',         present: !!xionConfig.gasPrice !== false,          description: 'Gas price override' },
    { envName: 'NEXT_PUBLIC_XION_AUTH_APP_URL',      present: !!xionConfig.authAppUrl,                  description: 'Abstraxion auth app URL' },
    { envName: 'NEXT_PUBLIC_XION_TREASURY_ADDRESS',  present: !!xionConfig.treasuryAddress,             description: 'Treasury address' },
  ];
}

export interface ContractPreflightResult {
  valid: boolean;
  failures: Array<{
    role: 'VaccinationRecord' | 'MilestoneChecker';
    envVar: string;
    address: string;
    reason: 'empty' | 'not_found' | 'not_a_contract';
  }>;
}

export async function validateRequiredContracts(restUrl: string): Promise<ContractPreflightResult> {
  // STRICT: only these two addresses from xionConfig are validated as contracts.
  // No other address source is permitted.
  const targets = [
    {
      role: 'VaccinationRecord' as const,
      envVar: 'NEXT_PUBLIC_XION_VACCINATION_RECORD',
      address: xionConfig.contracts.vaccinationRecord,
    },
    {
      role: 'MilestoneChecker' as const,
      envVar: 'NEXT_PUBLIC_XION_MILESTONE_CHECKER',
      address: xionConfig.contracts.milestoneChecker,
    },
  ];

  const failures: ContractPreflightResult['failures'] = [];

  for (const { role, envVar, address } of targets) {
    if (!address || address.trim() === '') {
      failures.push({ role, envVar, address: '', reason: 'empty' });
      continue;
    }
    try {
      const res = await fetch(`${restUrl}/cosmwasm/wasm/v1/contract/${address}`);
      if (res.status === 404) {
        failures.push({ role, envVar, address, reason: 'not_found' });
        continue;
      }
      const data = await res.json();
      if (!data?.contract_info?.code_id) {
        failures.push({ role, envVar, address, reason: 'not_a_contract' });
      }
    } catch {
      failures.push({ role, envVar, address, reason: 'not_found' });
    }
  }

  return { valid: failures.length === 0, failures };
}

export function formatContractFailure(f: ContractPreflightResult['failures'][number]): string {
  switch (f.reason) {
    case 'empty':
      return `${f.role} contract address is not set. Check ${f.envVar} in your Vercel environment.`;
    case 'not_found':
      return `${f.role} contract (${f.envVar} = ${f.address}) was not found on XION Testnet-2. This contract may not be deployed.`;
    case 'not_a_contract':
      return `${f.role}: address ${f.address} exists on-chain but is not a CosmWasm contract.`;
  }
}
