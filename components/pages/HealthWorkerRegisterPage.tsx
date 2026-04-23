'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { PatientForm } from '@/components/health-worker/PatientForm';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { Button } from '@/components/ui/button';

export default function HealthWorkerRegisterPage() {
  const mounted = useMounted();
  useAuth('health-worker');

  if (!mounted) return <PageSkeleton />;

  return (
    <main className="min-h-screen bg-ui-bg pb-24 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ui-text">Register New Patient</h1>
            <p className="text-sm text-ui-text-muted mt-1">Enroll a family into the Vite protocol</p>
          </div>
          <Link href="/health-worker">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
        </div>
        <PatientForm />
      </div>
    </main>
  );
}



