'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { useAuthStore } from '@/store/authStore';
import type { GrantRelease, Patient, VaccinationRecord } from '@/types';

export function usePatient() {
  const { session } = useAuthStore();
  const [query, setQuery] = useState<string>('');

  const patient = useLiveQuery(async () => {
    if (query) {
      const byHealthId = await db.patients.where('healthDropId').equalsIgnoreCase(query).first();
      if (byHealthId) return byHealthId;
      return db.patients.where('parentPhone').equals(query).first();
    }

    if (!session?.userId) return undefined;
    const user = await db.users.get(session.userId);
    if (!user?.phone) return undefined;
    return db.patients.where('parentPhone').equals(user.phone).first();
  }, [query, session?.userId]);

  const vaccinations = useLiveQuery(async () => {
    if (!patient?.id) return [] as VaccinationRecord[];
    return db.vaccinations.where('patientId').equals(patient.id).sortBy('dateAdministered');
  }, [patient?.id]);

  const grants = useLiveQuery(async () => {
    if (!patient?.id) return [] as GrantRelease[];
    return db.grantReleases.where('patientId').equals(patient.id).toArray();
  }, [patient?.id]);

  const loading = patient === undefined;
  const error = useMemo(() => {
    if (!query) return null;
    if (loading) return null;
    if (!patient) return 'Patient not found. Register them first.';
    return null;
  }, [loading, patient, query]);

  useEffect(() => {
    if (!session?.userId) setQuery('');
  }, [session?.userId]);

  return {
    patient: patient as Patient | null | undefined,
    vaccinations: vaccinations ?? [],
    grants: grants ?? [],
    loading,
    error,
    lookup: async (value: string) => setQuery(value.trim()),
    reset: () => setQuery(''),
  };
}

