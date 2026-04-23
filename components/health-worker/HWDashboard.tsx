'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CircleHelp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/db/schema';
import { SyncPanel } from '@/components/shared/SyncPanel';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { XionConnectButton } from '@/components/shared/XionConnectButton';
import { Card, StatCard } from '@/components/ui/card';
import { ClinicStatsBar } from './ClinicStatsBar';
import { RecentPatientsList } from './RecentPatientsList';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

export function HWDashboard() {
  const mounted = useMounted();
  const { session } = useAuth('health-worker');
  const logout = useAuthStore((state) => state.logout);
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
      <header className="sticky top-0 z-40 bg-who-blue text-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Vite" width={32} height={32} className="rounded" />
            <div>
              <p className="text-base font-bold leading-tight">{session.name}</p>
              <p className="text-xs text-white/70">Health Worker - {clinicId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/how-it-works"
              className="hidden items-center gap-1 text-sm font-medium text-white/80 transition-colors hover:text-white sm:inline-flex"
            >
              <CircleHelp className="h-4 w-4" />
              Guide
            </Link>
            <div className="hidden items-center gap-1.5 rounded bg-white/10 px-2 py-1 text-xs sm:flex">
              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-who-green' : 'bg-who-orange'}`} />
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
            <XionConnectButton compact />
            <NotificationBell />
            <button
              className="text-sm font-medium text-white/80 transition-colors hover:text-white"
              onClick={() => {
                logout();
                router.push('/');
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {!isOnline && <OfflineBanner />}
        <SyncPanel />

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/health-worker/register">
            <button className="flex w-full flex-col items-center justify-center gap-1 rounded-lg bg-who-blue py-6 text-lg font-bold text-white shadow-sm transition-all hover:bg-who-blue-dark">
              <span>+ Register Patient</span>
              <span className="text-xs font-normal uppercase tracking-widest opacity-80">New Enrollment</span>
            </button>
          </Link>
          <Link href="/health-worker/vaccinate">
            <button className="flex w-full flex-col items-center justify-center gap-1 rounded-lg bg-who-green py-6 text-lg font-bold text-white shadow-sm transition-all hover:opacity-90">
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
      </section>
    </main>
  );
}
