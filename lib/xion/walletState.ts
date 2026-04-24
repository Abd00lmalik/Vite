export interface ScopedWalletState {
  userId: string;
  walletAddress: string;
  connectedAt: string;
}

const LEGACY_KEYS = ['wallet_state', 'walletAddress', 'connectedWallet'];

export function walletStateKey(userId: string): string {
  return `wallet_state_${userId}`;
}

export function readScopedWalletState(userId?: string | null): ScopedWalletState | null {
  if (typeof window === 'undefined' || !userId) return null;

  try {
    const raw = localStorage.getItem(walletStateKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScopedWalletState;
    if (!parsed?.walletAddress || parsed.userId !== userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeScopedWalletState(state: ScopedWalletState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(walletStateKey(state.userId), JSON.stringify(state));
}

export function clearScopedWalletState(userId?: string | null): void {
  if (typeof window === 'undefined' || !userId) return;
  localStorage.removeItem(walletStateKey(userId));
}

export function clearLegacyWalletStateKeys(): void {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key);
  }
}
