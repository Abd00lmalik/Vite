'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { usePatient } from '@/hooks/usePatient';
import { useXion } from '@/hooks/useXion';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/db/schema';
import { UNSPLASH_IMAGES } from '@/lib/content/unsplash';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { PageTransition } from '@/components/shared/PageTransition';
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
  const { disconnect } = useXion();
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
    <main className="min-h-screen bg-ui-bg pb-24 font-sans">
      <header className="sticky top-0 z-40 border-b border-ui-border bg-white/90 shadow-sm backdrop-blur-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Vite" width={32} height={32} className="rounded" />
              <div>
                <p className="text-base font-bold leading-tight text-ui-text">Hello, {session.name}</p>
                <p className="text-xs text-ui-text-muted">Patient Record Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/how-it-works">
                <button className="text-ui-text-light hover:text-who-blue transition-colors text-sm font-medium flex items-center gap-1">
                  <CircleHelp className="h-4 w-4" />
                  Guide
                </button>
              </Link>
              <NotificationBell />
              <button
                className="text-ui-text-light hover:text-who-blue transition-colors text-sm font-medium"
                onClick={() => {
                  disconnect();
                  logout();
                  router.push('/');
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <PageTransition className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card className="overflow-hidden p-0">
          <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3 p-6">
              <span className="badge-green">Your child&apos;s records</span>
              <h2 className="text-2xl font-bold text-ui-text">Keep vaccination history portable and easy to verify.</h2>
              <p className="text-sm text-ui-text-light">
                Search by phone number or scan a QR card to instantly access timelines, milestones, and grant updates.
              </p>
            </div>
            <div className="relative min-h-52 md:min-h-full">
              <Image
                src={UNSPLASH_IMAGES.dashboard.patient}
                alt="Parent and child receiving healthcare support"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-ui-text mb-4 uppercase tracking-wider">Find Digital Health Record</h3>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                placeholder="Enter phone number or Health ID"
                value={lookupValue}
                onChange={(event) => setLookupValue(event.target.value)}
                className="input"
              />
              <Button
                variant="primary"
                onClick={() => lookup(lookupValue)}
                className="whitespace-nowrap"
              >
                Find Record
              </Button>
            </div>
            <div className="border-t border-ui-border pt-4">
              <p className="text-xs text-ui-text-muted mb-3 text-center uppercase tracking-widest">Or Scan QR Card</p>
              <QRScanner
                onScan={(value) => {
                  void lookup(value);
                }}
                onManualPhoneLookup={(phone) => {
                  void lookup(phone);
                }}
              />
            </div>
            {error ? <p className="text-sm text-who-red font-medium text-center">{error}</p> : null}
          </div>
        </Card>

        {patient ? (
          <Card className="overflow-hidden border-none bg-card-gradient">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div className="space-y-2">
                <div className="badge-blue mb-2">Verified Patient Card</div>
                <h2 className="text-3xl font-bold text-ui-text">{patient.name}</h2>
                <div className="inline-block rounded-lg bg-white px-3 py-2 font-mono text-sm text-ui-text shadow-sm">
                  {patient.healthDropId}
                </div>
                <p className="pt-2 text-sm text-ui-text-light flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-who-green animate-pulse" />
                  Active in {program?.name ?? 'National Program'}
                </p>
              </div>
              <div className="bg-white p-2 rounded-lg flex justify-center">
                <QRDisplay healthDropId={patient.healthDropId} patientName={patient.name} size={140} />
              </div>
            </div>
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
          <h3 className="text-sm font-semibold text-ui-text mb-4 uppercase tracking-wider">Vaccination History</h3>
          <VaccinationTimeline records={vaccinations} />
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-ui-text mb-4 uppercase tracking-wider">Health Milestone Status</h3>
          <MilestoneTracker milestones={program?.milestones ?? []} records={vaccinations} />
        </Card>
      </PageTransition>
    </main>
  );
}



