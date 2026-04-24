import { XION } from './config';

const MIN_SYNC_GAS_UXION = 75_000;

export interface AccountPreflightResult {
  address: string;
  accountFound: boolean;
  balanceUxion: number;
}

async function parseJsonSafe(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function checkXionAccountPreflight(address: string): Promise<AccountPreflightResult> {
  const accountUrl = `${XION.rest}/cosmos/auth/v1beta1/accounts/${address}`;
  const accountResponse = await fetch(accountUrl, { method: 'GET', cache: 'no-store' });
  const accountPayload = await parseJsonSafe(accountResponse);

  if (
    accountResponse.status === 404 ||
    `${accountPayload?.message ?? ''}`.toLowerCase().includes('not found')
  ) {
    return {
      address,
      accountFound: false,
      balanceUxion: 0,
    };
  }

  if (!accountResponse.ok) {
    throw new Error(accountPayload?.message ?? `Account query failed with status ${accountResponse.status}`);
  }

  const balanceUrl = `${XION.rest}/cosmos/bank/v1beta1/balances/${address}`;
  const balanceResponse = await fetch(balanceUrl, { method: 'GET', cache: 'no-store' });
  const balancePayload = await parseJsonSafe(balanceResponse);

  if (!balanceResponse.ok) {
    throw new Error(balancePayload?.message ?? `Balance query failed with status ${balanceResponse.status}`);
  }

  const uxionEntry = (balancePayload?.balances ?? []).find((item: any) => item?.denom === 'uxion');
  const parsed = Number.parseInt(String(uxionEntry?.amount ?? '0'), 10);
  const balanceUxion = Number.isFinite(parsed) ? parsed : 0;

  return {
    address,
    accountFound: true,
    balanceUxion,
  };
}

export function hasEnoughSyncGas(balanceUxion: number): boolean {
  return balanceUxion >= MIN_SYNC_GAS_UXION;
}

export function requiredSyncGasUxion(): number {
  return MIN_SYNC_GAS_UXION;
}
