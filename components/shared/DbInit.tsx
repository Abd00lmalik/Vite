'use client';

import { useEffect } from 'react';
import { wipeDatabaseIfCorrupt } from '@/lib/db/reset';
import { seedInitialData } from '@/lib/seed/initialData';

export function DbInit() {
  useEffect(() => {
    (async () => {
      await wipeDatabaseIfCorrupt();
      await seedInitialData();
    })();
  }, []);

  return null;
}




