'use client';

import { useEffect } from 'react';
import { seedInitialData } from '@/lib/seed/initialData';

export function AppBootstrap() {
  useEffect(() => {
    seedInitialData().catch(() => undefined);
  }, []);

  return null;
}




