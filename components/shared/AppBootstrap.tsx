'use client';

import { useEffect } from 'react';
import { seedDemoData } from '@/lib/seed/demo';

export function AppBootstrap() {
  useEffect(() => {
    seedDemoData().catch(() => undefined);
  }, []);

  return null;
}

