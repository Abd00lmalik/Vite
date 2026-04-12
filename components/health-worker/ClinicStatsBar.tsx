'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';

interface ClinicStatsBarProps {
  clinicId: string;
}

export function ClinicStatsBar({ clinicId }: ClinicStatsBarProps) {
  const vaccinations = useLiveQuery(
    () => db.vaccinations.where('clinicId').equals(clinicId).toArray(),
    [clinicId]
  );

  const data = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const counts: Record<string, number> = {};
    for (const record of vaccinations ?? []) {
      if (new Date(record.dateAdministered) < weekAgo) continue;
      counts[record.vaccineName] = (counts[record.vaccineName] ?? 0) + 1;
    }

    return Object.entries(counts);
  }, [vaccinations]);

  if (!data.length) {
    return <p className="text-sm text-gray-500">No vaccinations recorded this week.</p>;
  }

  const max = Math.max(...data.map(([, value]) => value));

  return (
    <div className="space-y-2">
      {data.map(([name, count]) => (
        <div key={name} className="space-y-1">
          <div className="flex justify-between text-sm text-gray-700">
            <span>{name}</span>
            <span>{count}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200">
            <div className="h-2 rounded-full bg-teal-primary" style={{ width: `${(count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

