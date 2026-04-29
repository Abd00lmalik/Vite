export type XionAddressRole =
  | 'connected_wallet'
  | 'contract'
  | 'patient_identity'
  | 'health_worker'
  | 'demo'
  | 'unknown';

export interface ClassifiedAddress {
  address: string;
  role: XionAddressRole;
  requiresOnChainAccount: boolean;
  requiresContractQuery: boolean;
}

export interface AddressClassificationContext {
  connectedWallet?: string;
  contractAddresses?: Record<string, string>;
  isDemoRecord?: boolean;
  healthWorkerWallets?: string[];
}

export interface AddressFieldMatch {
  field: string;
  address: string;
}

function isXionAddressLike(value: string): boolean {
  return value.startsWith('xion1');
}

export function classifyAddress(
  address: string,
  context: AddressClassificationContext
): ClassifiedAddress {
  if (!address || !isXionAddressLike(address)) {
    return {
      address,
      role: 'unknown',
      requiresOnChainAccount: false,
      requiresContractQuery: false,
    };
  }

  if (context.connectedWallet && address === context.connectedWallet) {
    return {
      address,
      role: 'connected_wallet',
      requiresOnChainAccount: true,
      requiresContractQuery: false,
    };
  }

  if (context.healthWorkerWallets?.includes(address)) {
    return {
      address,
      role: 'health_worker',
      requiresOnChainAccount: true,
      requiresContractQuery: false,
    };
  }

  if (context.contractAddresses) {
    const isContract = Object.values(context.contractAddresses).includes(address);
    if (isContract) {
      return {
        address,
        role: 'contract',
        requiresOnChainAccount: false,
        requiresContractQuery: true,
      };
    }
  }

  if (context.isDemoRecord) {
    return {
      address,
      role: 'demo',
      requiresOnChainAccount: false,
      requiresContractQuery: false,
    };
  }

  return {
    address,
    role: 'patient_identity',
    requiresOnChainAccount: false,
    requiresContractQuery: false,
  };
}

export function extractAddressFields(input: unknown, path = 'record'): AddressFieldMatch[] {
  const matches: AddressFieldMatch[] = [];

  if (typeof input === 'string') {
    const value = input.trim();
    if (isXionAddressLike(value)) {
      matches.push({ field: path, address: value });
    }
    return matches;
  }

  if (!input || typeof input !== 'object') {
    return matches;
  }

  if (Array.isArray(input)) {
    input.forEach((value, index) => {
      matches.push(...extractAddressFields(value, `${path}[${index}]`));
    });
    return matches;
  }

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    matches.push(...extractAddressFields(value, `${path}.${key}`));
  }

  return matches;
}

export function formatAddressError(address: string, role: XionAddressRole, rawError: string): string {
  switch (role) {
    case 'connected_wallet':
      return `Your connected wallet (${address}) is not initialized on XION Testnet-2. Fund it using the faucet before syncing.`;
    case 'contract':
      return `A contract address (${address}) could not be found on-chain. Verify your XION contract environment variables.`;
    case 'patient_identity':
      return `Patient identity reference (${address}) is stored as metadata and does not require an on-chain account. Payout or validation skipped.`;
    case 'demo':
      return `A demo address (${address}) was found in your sync queue. It has been excluded automatically.`;
    case 'unknown':
      return `An unrecognized address (${address}) was encountered during sync and was not submitted. Check your pending records for stale data.`;
    case 'health_worker':
      return `Health worker wallet ${address} is unavailable on-chain. Reconnect and re-initialize before syncing.`;
    default:
      return `Sync encountered an address error: ${rawError}`;
  }
}
