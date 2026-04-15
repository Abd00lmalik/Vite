export async function wipeDatabaseIfCorrupt(): Promise<void> {
  if (typeof window === 'undefined') return;

  const CURRENT_VERSION = 3;
  const storedVersion = localStorage.getItem('vite_db_version');

  if (storedVersion !== String(CURRENT_VERSION)) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase('ViteHealthDrop');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => resolve();
      });
    } catch (error) {
      console.warn('[VITE] DB wipe warning:', error);
    }

    Object.keys(localStorage)
      .filter((key) => key.startsWith('vite_'))
      .forEach((key) => localStorage.removeItem(key));

    localStorage.setItem('vite_db_version', String(CURRENT_VERSION));
  }
}

