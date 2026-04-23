import type { UserRole } from '@/types';

export const roleHome: Record<UserRole, string> = {
  patient: '/patient',
  'health-worker': '/health-worker',
  donor: '/donor',
  admin: '/donor',
};

export function canAccessRole(requiredRole: UserRole, currentRole?: UserRole): boolean {
  return currentRole === requiredRole;
}




