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
    <main className="min-h-screen bg-ui-bg pb-24 font-sans">
      <header className="bg-who-blue text-white shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Vite" width={32} height={32} className="rounded" />
              <div>
                <p className="text-base font-bold leading-tight">Hello, {session.name}</p>
                <p className="text-xs text-white/70">Health Record Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/how-it-works">
                <button className="text-white/80 hover:text-white transition-colors text-sm font-medium flex items-center gap-1">
                  <CircleHelp className="h-4 w-4" />
                  Guide
                </button>
              </Link>
              <NotificationBell />
              <button
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
                onClick={() => {
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

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
          <Card className="bg-who-blue text-white overflow-hidden border-none shadow-panel">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div className="space-y-2">
                <div className="badge-blue bg-white/20 text-white mb-2">Verified Patient Card</div>
                <h2 className="text-3xl font-bold">{patient.name}</h2>
                <div className="bg-black/10 p-2 rounded font-mono text-sm inline-block">
                  {patient.healthDropId}
                </div>
                <p className="text-sm text-white/80 pt-2 flex items-center gap-2">
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
      </section>
    </main>
  );
}



