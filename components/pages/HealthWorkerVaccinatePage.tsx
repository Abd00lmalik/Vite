'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { VaccinationForm } from '@/components/health-worker/VaccinationForm';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { Button } from '@/components/ui/button';

export default function HealthWorkerVaccinatePage() {
  const mounted = useMounted();
  useAuth('health-worker');

  if (!mounted) return <PageSkeleton />;

  return (
    <main className="min-h-screen bg-ui-bg pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ui-text">Record Vaccination</h1>
            <p className="text-sm text-ui-text-muted mt-1">Submit immunization data for verification on XION</p>
          </div>
          <Link href="/health-worker">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
        </div>
        <VaccinationForm />
      </div>
    </main>
  );
}



