'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { PatientForm } from '@/components/health-worker/PatientForm';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { Button } from '@/components/ui/button';

export default function RegisterPatientPage() {
  const mounted = useMounted();
  useAuth('health-worker');

  if (!mounted) return <PageSkeleton />;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 md:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Register Patient</h1>
          <Link href="/health-worker">
            <Button variant="outline">Back</Button>
          </Link>
        </div>
        <PatientForm />
      </div>
    </main>
  );
}


