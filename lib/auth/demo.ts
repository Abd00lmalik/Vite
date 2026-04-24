import type { AuthSession, User } from '@/types';

export const DEMO_USER_IDS = new Set([
  'user-patient-001',
  'user-patient-002',
  'hw-001',
  'hw-002',
  'donor-001',
]);

export const DEMO_EMAILS = new Set([
  'amara@clinic-kano.ng',
  'fatima@clinic-ibadan.ng',
  'donor@unicef-ng.org',
]);

export const DEMO_PHONES = new Set(['+2348012345001', '+2348012345002']);
export const DEMO_CLINIC_IDS = new Set(['clinic-001', 'clinic-002']);

interface DemoUserLike {
  id?: string;
  userId?: string;
  email?: string;
  phone?: string;
  isDemoUser?: boolean;
  demo?: boolean;
}

export function isDemoUser(user?: DemoUserLike | null): boolean {
  if (!user) return false;
  if (user.isDemoUser) return true;
  if (user.id && DEMO_USER_IDS.has(user.id)) return true;
  if (user.userId && DEMO_USER_IDS.has(user.userId)) return true;
  if (user.email && DEMO_EMAILS.has(user.email.toLowerCase())) return true;
  if (user.phone && DEMO_PHONES.has(user.phone)) return true;
  return false;
}

export function isDemoAccount(account?: DemoUserLike | null): boolean {
  if (!account) return false;
  if (account.demo) return true;
  return isDemoUser(account);
}

export function isDemoSession(session?: AuthSession | null): boolean {
  if (!session) return false;
  if (session.demo) return true;
  return DEMO_USER_IDS.has(session.userId);
}

export function isDemoCredential(input: string): boolean {
  const value = input.trim().toLowerCase();
  return DEMO_EMAILS.has(value) || DEMO_PHONES.has(input.trim());
}

export function tagUserAsDemo<T extends User>(user: T): T {
  return { ...user, isDemoUser: true };
}

export function isDemoProgram(program?: { donorId?: string | null } | null): boolean {
  if (!program?.donorId) return false;
  return DEMO_USER_IDS.has(program.donorId);
}

export function isDemoClinic(clinic?: { id?: string | null } | null): boolean {
  if (!clinic?.id) return false;
  return DEMO_CLINIC_IDS.has(clinic.id);
}
