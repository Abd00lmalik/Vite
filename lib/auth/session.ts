import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db/schema';
import type { AuthSession, User, UserRole } from '@/types';

export async function registerUser(data: {
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  clinicId?: string;
  clinicName?: string;
  organizationName?: string;
  idVerificationField?: string;
  roleTitle?: string;
  programPreferences?: string[];
}): Promise<{ user: User | null; error?: string }> {
  if (data.email) {
    const existing = await db.users.where('email').equals(data.email).first();
    if (existing) return { user: null, error: 'Email already registered' };
  }

  if (data.phone) {
    const existing = await db.users.where('phone').equals(data.phone).first();
    if (existing) return { user: null, error: 'Phone already registered' };
  }

  const now = new Date().toISOString();
  const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;

  const user: User = {
    id: uuidv4(),
    role: data.role,
    name: data.name,
    email: data.email,
    phone: data.phone,
    passwordHash,
    clinicId: data.clinicId,
    clinicName: data.clinicName,
    organizationName: data.organizationName,
    idVerificationField: data.idVerificationField,
    roleTitle: data.roleTitle,
    programPreferences: data.programPreferences,
    createdAt: now,
    lastLoginAt: now,
  };

  await db.users.put(user);
  return { user };
}

export async function loginWithPhone(phone: string): Promise<AuthSession | null> {
  const user = await db.users.where('phone').equals(phone).first();
  if (!user || user.role !== 'patient') {
    return null;
  }

  await db.users.update(user.id, { lastLoginAt: new Date().toISOString() });
  return buildSession(user);
}

export async function loginWithEmail(email: string, password: string): Promise<AuthSession | null> {
  const user = await db.users.where('email').equals(email).first();
  if (!user || !user.passwordHash) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  await db.users.update(user.id, { lastLoginAt: new Date().toISOString() });
  return buildSession(user);
}

export function buildSession(user: User): AuthSession {
  return {
    userId: user.id,
    role: user.role,
    name: user.name,
    clinicId: user.clinicId,
    organizationName: user.organizationName,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function isSessionExpired(session: AuthSession | null): boolean {
  if (!session) return true;
  return new Date(session.expiresAt).getTime() <= Date.now();
}

