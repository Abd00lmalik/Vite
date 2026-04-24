'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CircleHelp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useXion } from '@/hooks/useXion';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/db/schema';
import { UNSPLASH_IMAGES } from '@/lib/content/unsplash';
import { SyncPanel } from '@/components/shared/SyncPanel';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { XionConnectButton } from '@/components/shared/XionConnectButton';
import { Card, StatCard } from '@/components/ui/card';
import { PageTransition } from '@/components/shared/PageTransition';
import { ClinicStatsBar } from './ClinicStatsBar';
import { RecentPatientsList } from './RecentPatientsList';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

export function HWDashboard() {
  const mounted = useMounted();
  const { session } = useAuth('health-worker');
  const logout = useAuthStore((state) => state.logout);
  const { disconnect } = useXion();
  const router = useRouter();
  const isOnline = useOfflineStatus();

  const clinicId = session?.clinicId ?? (session ? `clinic-${session.userId.slice(0, 6)}` : 'clinic-unknown');

  const stats = useLiveQuery(async () => {
    if (!session) return { todayPatients: 0, pendingSync: 0, totalRecords: 0 };

    const today = new Date().toISOString().slice(0, 10);
    const todayPatients = (
      await db.patients.where('registeredBy').equals(session.userId).toArray()
    ).filter((patient) => patient.registeredAt.slice(0, 10) === today).length;

    const pendingVaccinations = await db.vaccinations
      .where('clinicId')
      .equals(clinicId)
      .filter((record) => record.syncStatus === 'pending')
      .count();

    const pendingPatients = await db.patients
      .where('clinicId')
      .equals(clinicId)
      .filter((patient) => patient.syncStatus === 'pending')
      .count();

    const totalRecords = await db.vaccinations
      .where('administeredBy')
      .equals(session.userId)
      .count();

    return {
      todayPatients,
      pendingSync: pendingVaccinations + pendingPatients,
      totalRecords,
    };
  }, [clinicId, session?.userId]);

  if (!mounted || !session) return <PageSkeleton />;

  return (
    <main className="min-h-screen bg-ui-bg pb-24 font-sans">
      <header className="sticky top-0 z-40 border-b border-ui-border bg-white/90 shadow-sm backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Vite" width={32} height={32} className="rounded" />
            <div>
              <p className="text-base font-bold leading-tight text-ui-text">{session.name}</p>
              <p className="text-xs text-ui-text-muted">Health Worker | {clinicId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/how-it-works"
              className="hidden items-center gap-1 text-sm font-medium text-ui-text-light transition-colors hover:text-who-blue sm:inline-flex"
            >
              <CircleHelp className="h-4 w-4" />
              Guide
            </Link>
            <div className="hidden items-center gap-1.5 rounded-full border border-ui-border bg-ui-surface px-2.5 py-1 text-xs text-ui-text-light sm:flex">
              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-who-green' : 'bg-who-orange'}`} />
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
            <XionConnectButton compact />
            <NotificationBell />
            <button
              className="text-sm font-medium text-ui-text-light transition-colors hover:text-who-blue"
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
      </header>

      <PageTransition className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {!isOnline && <OfflineBanner />}

        <Card className="overflow-hidden p-0">
          <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3 p-6">
              <span className="badge-blue">Care delivery console</span>
              <h2 className="text-2xl font-bold text-ui-text">Keep records accurate, even when connectivity is weak.</h2>
              <p className="text-sm text-ui-text-light">
                Register patients, capture vaccinations offline, and sync verified records when your device reconnects.
              </p>
            </div>
            <div className="relative min-h-52 md:min-h-full">
              <Image
                src={UNSPLASH_IMAGES.dashboard.healthWorker}
                alt="Nurse working in a modern clinic"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </Card>

        <SyncPanel />

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/health-worker/register">
            <button className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl bg-who-blue py-6 text-lg font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-who-blue-dark">
              <span>+ Register Patient</span>
              <span className="text-xs font-normal uppercase tracking-widest opacity-80">New Enrollment</span>
            </button>
          </Link>
          <Link href="/health-worker/vaccinate">
            <button className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl bg-who-green py-6 text-lg font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:opacity-95">
              <span>Record Vaccination</span>
              <span className="text-xs font-normal uppercase tracking-widest opacity-80">Submit Dose</span>
            </button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Today's Patients" value={stats?.todayPatients ?? 0} color="blue" />
          <StatCard label="Pending Sync" value={stats?.pendingSync ?? 0} color="orange" />
          <StatCard label="Total Records" value={stats?.totalRecords ?? 0} color="green" />
        </div>

        <Card>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ui-text">Weekly Vaccination Performance</h3>
          <ClinicStatsBar clinicId={clinicId} />
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ui-text">Recent Patient Registrations</h3>
          <RecentPatientsList workerId={session.userId} />
        </Card>
      </PageTransition>
    </main>
  );
}
