'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { db } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

export default function RecordsPage() {
  const mounted = useMounted();
  const { session } = useAuth('health-worker');

  const records = useLiveQuery(async () => {
    if (!session) return [];
    return db.vaccinations.where('clinicId').equals(session.clinicId ?? 'clinic-001').toArray();
  }, [session?.clinicId]);

  if (!mounted || !session) return <PageSkeleton />;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-4 md:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Clinic Records</h1>
          <Link href="/health-worker">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Vaccination Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(records ?? []).map((record) => (
              <div key={record.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{record.healthDropId}</p>
                  <p className="text-xs text-gray-600">{record.vaccineName} Dose {record.doseNumber}</p>
                </div>
                <Badge variant={record.syncStatus === 'synced' ? 'synced' : 'pending'}>{record.syncStatus}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


