'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { ProgramCreateForm } from '@/components/donor/ProgramCreateForm';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

export default function NewProgramPage() {
  useAuth('donor');
  const mounted = useMounted();

  if (!mounted) return <PageSkeleton />;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-4 md:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Create Program</h1>
          <Link href="/donor/programs">
            <Button variant="outline">Back</Button>
          </Link>
        </div>

        <ProgramCreateForm />
      </div>
    </main>
  );
}


