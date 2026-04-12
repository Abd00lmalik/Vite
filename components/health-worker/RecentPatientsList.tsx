'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface RecentPatientsListProps {
  workerId: string;
}

export function RecentPatientsList({ workerId }: RecentPatientsListProps) {
  const vaccinations = useLiveQuery(async () => {
    const records = await db.vaccinations
      .where('administeredBy')
      .equals(workerId)
      .reverse()
      .sortBy('createdAt');

    return records.slice(0, 10);
  }, [workerId]);

  if (!vaccinations || vaccinations.length === 0) {
    return <p className="text-sm text-gray-500">No recent patients yet.</p>;
  }

  return (
    <div className="space-y-2">
      {vaccinations.map((record) => (
        <div key={record.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">{record.healthDropId}</p>
            <p className="text-xs text-gray-600">
              {record.vaccineName} dose {record.doseNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={record.syncStatus === 'synced' ? 'synced' : 'pending'}>{record.syncStatus}</Badge>
            <Link href={`/record/${record.healthDropId}`}>
              <Button variant="outline" className="h-10">View</Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}


