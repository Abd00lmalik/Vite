// lib/xion/clearLegacyContractCache.ts

const LEGACY_CONTRACT_KEYS = [
  'xion_config',
  'contractConfig',
  'deploymentConfig',
  'xionContracts',
  'syncConfig',
  'contractAddresses',
  'vite_xion_config',
];

/**
 * Clears legacy contract configuration keys from localStorage.
 * This prevents stale addresses from being injected into the runtime config
 * if an older version of the app used persistent storage for these values.
 */
export function clearLegacyContractCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    LEGACY_CONTRACT_KEYS.forEach((key) => {
      if (localStorage.getItem(key)) {
        console.warn(`[ConfigAudit] Removing legacy contract cache key: ${key}`);
        localStorage.removeItem(key);
      }
    });

    // Also scan for any key containing 'xion' and 'contract' as a safety measure
    Object.keys(localStorage).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('xion') && (lowerKey.includes('contract') || lowerKey.includes('addr'))) {
        // Only remove if it's not a known safe key like wallet state
        if (!lowerKey.includes('wallet') && !lowerKey.includes('session')) {
          console.warn(`[ConfigAudit] Removing suspicious legacy key: ${key}`);
          localStorage.removeItem(key);
        }
      }
    });
  } catch (e) {
    console.error('[ConfigAudit] Failed to clear legacy cache:', e);
  }
}
