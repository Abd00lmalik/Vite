'use client';

import { useEffect } from 'react';
import { wipeDatabaseIfCorrupt } from '@/lib/db/reset';
import { seedDemoData } from '@/lib/seed/demo';

export function DbInit() {
  useEffect(() => {
    (async () => {
      await wipeDatabaseIfCorrupt();
      await seedDemoData();
    })();
  }, []);

  return null;
}

