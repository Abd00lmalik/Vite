const LEGACY_GLOBAL_KEYS = [
  'patients',
  'vaccinations',
  'sync_queue',
  'sync_history',
  'dashboard_cache',
  'vite_patients',
  'vite_vaccinations',
  'vite_sync_queue',
  'vite_sync_history',
  'vite_dashboard_cache',
];

function getKey(userId: string, collection: string): string {
  return `vite_${collection}_${userId}`;
}

export const scopedStorage = {
  get<T>(userId: string, collection: string): T | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(getKey(userId, collection));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  set<T>(userId: string, collection: string, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(getKey(userId, collection), JSON.stringify(value));
  },
  remove(userId: string, collection: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(getKey(userId, collection));
  },
  clearUser(userId: string, collections: string[]): void {
    collections.forEach((collection) => scopedStorage.remove(userId, collection));
  },
};

export function clearLegacyGlobalDataKeys(): void {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_GLOBAL_KEYS) {
    localStorage.removeItem(key);
  }
}
