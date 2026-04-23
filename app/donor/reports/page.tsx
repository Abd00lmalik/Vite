'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { db } from '@/lib/db/schema';
import { ReportExporter } from '@/components/donor/ReportExporter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

export default function DonorReportsPage() {
  useAuth('donor');
  const mounted = useMounted();
  const firstProgram = useLiveQuery(() => db.programs.limit(1).first(), []);

  if (!mounted) return <PageSkeleton />;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-4 md:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Program Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {firstProgram ? <ReportExporter programId={firstProgram.id} /> : <p>No programs available yet.</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}





