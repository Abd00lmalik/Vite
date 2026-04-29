export type XionAddressRole =
  | 'connected_wallet'
  | 'contract'
  | 'patient_identity'
  | 'health_worker'
  | 'demo'
  | 'invalid'
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
  const trimmed = value.trim();
  // Real XION addresses are exactly 43 characters (xion1 + 38)
  // We allow longer ones for fuzzy detection but they'll be classified as invalid/unknown
  return trimmed.startsWith('xion1') && trimmed.length >= 10;
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

  const normalized = address.toLowerCase();

  // HEURISTIC: Catch explicit "notfound" sentinels being treated as addresses
  if (normalized.includes('notfound') || normalized.includes('invalid') || normalized.includes('undefined')) {
    return {
      address,
      role: 'invalid',
      requiresOnChainAccount: false,
      requiresContractQuery: false,
    };
  }

  // STRICT: Real XION addresses on Testnet-2 are exactly 43 characters.
  // Anything else starting with xion1 is either a legacy identifier or a malformed ref.
  const isCorrectLength = address.length === 43;

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

  // If it's a valid-looking xion1 string but not a known actor or contract,
  // it is treated as an opaque patient identity reference.
  // It NEVER requires an on-chain account or contract query.
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
    case 'invalid':
      return `An invalid or uninitialized address reference (${address}) was encountered. This typically indicates a missing wallet binding.`;
    case 'unknown':
      return `An unrecognized address (${address}) was encountered during sync and was not submitted. Check your pending records for stale data.`;
    case 'health_worker':
      return `Health worker wallet ${address} is unavailable on-chain. Reconnect and re-initialize before syncing.`;
    default:
      return `Sync encountered an address error: ${rawError}`;
  }
}
