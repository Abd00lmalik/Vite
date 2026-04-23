'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';

export function usePrograms() {
  const programs = useLiveQuery(() => db.programs.toArray(), []);

  return {
    programs: programs ?? [],
    loading: programs === undefined,
  };
}




