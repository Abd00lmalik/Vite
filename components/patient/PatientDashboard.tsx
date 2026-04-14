'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { usePatient } from '@/hooks/usePatient';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/db/schema';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { QRDisplay } from '@/components/shared/QRDisplay';
import { QRScanner } from '@/components/shared/QRScanner';
import { EarningsCard } from './EarningsCard';
import { VaccinationTimeline } from './VaccinationTimeline';
import { MilestoneTracker } from './MilestoneTracker';
import { RedeemFlow } from './RedeemFlow';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

export function PatientDashboard() {
  const mounted = useMounted();
  const { session } = useAuth('patient');
  const { patient, vaccinations, grants, lookup, error } = usePatient();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [showRedeem, setShowRedeem] = useState(false);
  const [lookupValue, setLookupValue] = useState('');

  const program = useLiveQuery(async () => {
    if (!patient?.programId) return undefined;
    return db.programs.get(patient.programId);
  }, [patient?.programId]);

  const totals = useMemo(() => {
    const totalEarned = grants.reduce((sum, grant) => sum + grant.amount, 0);
    const available = grants.filter((grant) => grant.status === 'released').reduce((sum, grant) => sum + grant.amount, 0);
    const redeemed = grants.filter((grant) => grant.status === 'redeemed').reduce((sum, grant) => sum + grant.amount, 0);
    return { totalEarned, available, redeemed };
  }, [grants]);

  if (!mounted || !session) {
    return <PageSkeleton />;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="border-b border-gray-200 bg-white px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="VITE logo" width={36} height={36} className="rounded-md" />
            <div>
              <p className="text-lg font-semibold text-gray-900">Hello, {session.name}</p>
              <p className="text-sm text-gray-600">Patient Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/how-it-works">
              <Button variant="outline" className="h-10 px-3">
                <CircleHelp className="mr-1 h-4 w-4" />
                Guide
              </Button>
            </Link>
            <NotificationBell />
            <Button
              variant="outline"
              className="h-10"
              onClick={() => {
                logout();
                router.push('/auth/signin');
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-4 px-4 py-4 md:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Find Record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                placeholder="Enter phone number or Health ID"
                value={lookupValue}
                onChange={(event) => setLookupValue(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => lookup(lookupValue)}
                className="w-full sm:w-auto"
              >
                Find
              </Button>
            </div>
            <QRScanner
              onScan={(value) => {
                void lookup(value);
              }}
              onManualPhoneLookup={(phone) => {
                void lookup(phone);
              }}
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </CardContent>
        </Card>

        {patient ? (
          <Card className="bg-teal-primary text-white">
            <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-sm text-white/80">Child summary</p>
                <h2 className="text-2xl font-bold">{patient.name}</h2>
                <p className="font-mono text-sm">{patient.healthDropId}</p>
                <p className="mt-2 text-sm text-white/85">Show this at any clinic.</p>
              </div>
              <QRDisplay healthDropId={patient.healthDropId} patientName={patient.name} size={130} />
            </CardContent>
          </Card>
        ) : null}

        <EarningsCard
          totalEarned={totals.totalEarned}
          available={totals.available}
          redeemed={totals.redeemed}
          onRedeem={() => setShowRedeem(true)}
        />

        {showRedeem && patient ? (
          <RedeemFlow
            patient={patient}
            grants={grants}
            onComplete={() => {
              setShowRedeem(false);
            }}
          />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Vaccination Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <VaccinationTimeline records={vaccinations} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milestone Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <MilestoneTracker milestones={program?.milestones ?? []} records={vaccinations} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}


