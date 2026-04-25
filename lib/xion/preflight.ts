import { XION } from './config';

const MIN_SYNC_GAS_UXION = 75_000;
export const ACCOUNT_NOT_INITIALIZED_MESSAGE =
  'Your XION wallet account has not been initialized on-chain. Please send a small amount of UXION to your wallet address to activate it before syncing.';

export interface AccountPreflightResult {
  address: string;
  accountFound: boolean;
  balanceUxion: number;
}

export interface SyncPreflightResult {
  address: string;
  accountExists: boolean;
  balanceAmount: number;
  hasMinimumBalance: boolean;
}

async function parseJsonSafe(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isNotFoundPayload(payload: any): boolean {
  return `${payload?.message ?? ''}`.toLowerCase().includes('not found');
}

export function formatAccountNotInitializedMessage(address?: string): string {
  return address ? `${ACCOUNT_NOT_INITIALIZED_MESSAGE}\nWallet: ${address}` : ACCOUNT_NOT_INITIALIZED_MESSAGE;
}

export function isAccountNotInitializedMessage(message?: string | null): boolean {
  if (!message) return false;
  return message.includes(ACCOUNT_NOT_INITIALIZED_MESSAGE);
}

export async function runSyncPreflight(
  address: string,
  restUrl: string = XION.rest
): Promise<SyncPreflightResult> {
  const accountUrl = `${restUrl}/cosmos/auth/v1beta1/accounts/${address}`;
  const accountResponse = await fetch(accountUrl, { method: 'GET', cache: 'no-store' });
  const accountPayload = await parseJsonSafe(accountResponse);

  if (accountResponse.status === 404 || (!accountResponse.ok && isNotFoundPayload(accountPayload))) {
    return {
      address,
      accountExists: false,
      balanceAmount: 0,
      hasMinimumBalance: false,
    };
  }

  if (!accountResponse.ok) {
    throw new Error(accountPayload?.message ?? `Account query failed with status ${accountResponse.status}`);
  }

  const accountExists = Boolean(accountPayload?.account);
  if (!accountExists) {
    return {
      address,
      accountExists: false,
      balanceAmount: 0,
      hasMinimumBalance: false,
    };
  }

  const balanceUrl = `${restUrl}/cosmos/bank/v1beta1/balances/${address}`;
  const balanceResponse = await fetch(balanceUrl, { method: 'GET', cache: 'no-store' });
  const balancePayload = await parseJsonSafe(balanceResponse);

  if (!balanceResponse.ok) {
    throw new Error(balancePayload?.message ?? `Balance query failed with status ${balanceResponse.status}`);
  }

  const uxionEntry = (balancePayload?.balances ?? []).find((item: any) => item?.denom === 'uxion');
  const parsed = Number.parseInt(String(uxionEntry?.amount ?? '0'), 10);
  const balanceAmount = Number.isFinite(parsed) ? parsed : 0;

  return {
    address,
    accountExists: true,
    balanceAmount,
    hasMinimumBalance: hasEnoughSyncGas(balanceAmount),
  };
}

export async function checkXionAccountPreflight(address: string): Promise<AccountPreflightResult> {
  const result = await runSyncPreflight(address, XION.rest);
  return {
    address: result.address,
    accountFound: result.accountExists,
    balanceUxion: result.balanceAmount,
  };
}

export function hasEnoughSyncGas(balanceUxion: number): boolean {
  return balanceUxion >= MIN_SYNC_GAS_UXION;
}

export function requiredSyncGasUxion(): number {
  return MIN_SYNC_GAS_UXION;
}
