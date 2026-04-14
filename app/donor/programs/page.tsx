'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { db } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { FundingModal } from '@/components/donor/FundingModal';
import { ProgramCard } from '@/components/donor/ProgramCard';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import type { Program } from '@/types';

export default function DonorProgramsPage() {
  useAuth('donor');
  const mounted = useMounted();
  const [fundingProgram, setFundingProgram] = useState<Program | null>(null);

  const programs = useLiveQuery(() => db.programs.toArray(), []);
  const patients = useLiveQuery(() => db.patients.toArray(), []);

  if (!mounted) return <PageSkeleton />;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 md:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Programs</h1>
          <Link href="/donor/programs/new">
            <Button>Create New Program</Button>
          </Link>
        </div>

        {(programs ?? []).map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            enrolledPatients={(patients ?? []).filter((patient) => patient.programId === program.id).length}
            onFund={setFundingProgram}
            onToggleStatus={async (item) => {
              await db.programs.update(item.id, {
                status: item.status === 'active' ? 'paused' : 'active',
              });
            }}
          />
        ))}
      </div>

      {fundingProgram ? (
        <FundingModal
          program={fundingProgram}
          onClose={() => setFundingProgram(null)}
          onSuccess={() => {
            setFundingProgram(null);
            toast.success('Escrow funded!');
          }}
        />
      ) : null}
    </main>
  );
}


