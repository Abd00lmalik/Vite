import {
  xionConfig,
  XION_ENV_NAME_BY_FIELD,
  SYNC_OPTIONAL_XION_FIELDS,
  SYNC_REQUIRED_XION_FIELDS,
} from './config';

export interface XionConfigStatus {
  configReady: boolean;
  missingVars: string[];
  missingOptionalVars: string[];
}

export type ContractFailureReason = 'not_found' | 'not_a_contract' | 'empty' | 'invalid_format';

export interface ContractValidationFailure {
  envVar: string;
  address: string;
  reason: ContractFailureReason;
}

export interface ContractValidationResult {
  valid: boolean;
  failures: ContractValidationFailure[];
}

export function getXionConfigStatus(): XionConfigStatus {
  const missingVars = SYNC_REQUIRED_XION_FIELDS
    .filter((key) => !xionConfig[key])
    .map((key) => XION_ENV_NAME_BY_FIELD[key as keyof typeof XION_ENV_NAME_BY_FIELD] ?? String(key));

  const missingOptionalVars = SYNC_OPTIONAL_XION_FIELDS
    .filter((key) => !xionConfig[key])
    .map((key) => XION_ENV_NAME_BY_FIELD[key as keyof typeof XION_ENV_NAME_BY_FIELD] ?? String(key));

  return {
    configReady: missingVars.length === 0,
    missingVars,
    missingOptionalVars,
  };
}

function isLikelyXionAddress(address: string): boolean {
  return address.startsWith('xion1') && address.length >= 40;
}

async function parseJsonSafe(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

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

    if (!isLikelyXionAddress(address)) {
      failures.push({ envVar, address, reason: 'invalid_format' });
      continue;
    }

    try {
      const response = await fetch(`${restUrl}/cosmwasm/wasm/v1/contract/${address}`, {
        method: 'GET',
        cache: 'no-store',
      });
      const payload = await parseJsonSafe(response);

      if (response.status === 404) {
        failures.push({ envVar, address, reason: 'not_found' });
        continue;
      }

      if (!response.ok) {
        const message = `${payload?.message ?? ''}`.toLowerCase();
        if (message.includes('no such contract') || message.includes('not found')) {
          failures.push({ envVar, address, reason: 'not_found' });
          continue;
        }
        failures.push({ envVar, address, reason: 'not_a_contract' });
        continue;
      }

      if (!payload?.contract_info?.code_id) {
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
  switch (failure.reason) {
    case 'empty':
      return `${failure.envVar} is not set. Add the deployed contract address to your environment.`;
    case 'invalid_format':
      return `${failure.envVar} contains an invalid address format ("${failure.address}"). It must be a valid xion1... address.`;
    case 'not_found':
      return `${failure.envVar} points to an address (${failure.address}) that was not found on XION Testnet-2. Deploy the contract or update this variable.`;
    case 'not_a_contract':
      return `${failure.envVar} points to an address (${failure.address}) that exists on-chain but is not a deployed contract.`;
    default:
      return `${failure.envVar} is invalid.`;
  }
}
