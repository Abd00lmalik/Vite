'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { useAuthStore } from '@/store/authStore';
import { isDemoAccount, isDemoProgram } from '@/lib/auth/demo';

export function usePrograms() {
  const session = useAuthStore((state) => state.session);
  const programs = useLiveQuery(async () => {
    if (!session?.userId) return [];
    const active = await db.programs.where('status').equals('active').toArray();
    if (isDemoAccount({ userId: session.userId, demo: session.demo })) {
      return active;
    }
    return active.filter((program) => !isDemoProgram(program));
  }, [session?.userId, session?.demo]);

  return {
    programs: programs ?? [],
    loading: programs === undefined,
  };
}




