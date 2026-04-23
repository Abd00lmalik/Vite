'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { isSessionExpired } from '@/lib/auth/session';
import { roleHome } from '@/lib/auth/guards';
import type { UserRole } from '@/types';

export function useAuth(requiredRole?: UserRole) {
  const { session, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !session || isSessionExpired(session)) {
      logout();
      router.replace('/auth/signin');
      return;
    }

    if (requiredRole && session.role !== requiredRole) {
      router.replace(roleHome[session.role]);
    }
  }, [isAuthenticated, logout, requiredRole, router, session]);

  return { session, isAuthenticated };
}




