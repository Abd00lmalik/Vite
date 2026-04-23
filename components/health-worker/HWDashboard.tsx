'use client';

import Image from 'next/image';
import Link from 'next/link';
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
  const mounted     = useMounted();
  const { session } = useAuth('health-worker');
  const logout      = useAuthStore((s) => s.logout);
  const router      = useRouter();
  const isOnline    = useOfflineStatus();

  const stats = useLiveQuery(async () => {
    if (!session) return { todayPatients: 0, pendingSync: 0, totalRecords: 0 };
    const today = new Date().toISOString().slice(0, 10);
    const todayPatients = (
      await db.patients.where('registeredBy').equals(session.userId).toArray()
    ).filter((p) => p.registeredAt.slice(0, 10) === today).length;
    const pendingSync =
      (await db.vaccinations.where('syncStatus').equals('pending').count()) +
      (await db.patients.where('syncStatus').equals('pending').count());
    const totalRecords = await db.vaccinations
      .where('administeredBy').equals(session.userId).count();
    return { todayPatients, pendingSync, totalRecords };
  }, [session?.userId]);

  if (!mounted || !session) return <PageSkeleton />;

  return (
    <main className="min-h-screen bg-ui-bg pb-24 font-sans">

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ HEADER Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <header className="bg-who-blue text-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Vite" width={32} height={32} className="rounded" />
              <div>
                <p className="text-base font-bold leading-tight">{session.name}</p>
                <p className="text-xs text-white/70">
                  Health Worker Ã‚Â· {session.clinicId ?? 'clinic-001'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded text-xs">
                <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-who-green' : 'bg-who-orange'}`} />
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </div>
              <XionConnectButton compact />
              <NotificationBell />
              <button
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
                onClick={() => { logout(); router.push('/'); }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {!isOnline && <OfflineBanner />}
        <SyncPanel />

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ QUICK ACTIONS Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/health-worker/register">
            <button className="w-full bg-who-blue text-white py-6 rounded-lg font-bold text-lg shadow-sm hover:bg-who-blue-dark transition-all flex flex-col items-center justify-center gap-1">
              <span>+ Register Patient</span>
              <span className="text-xs font-normal opacity-80 uppercase tracking-widest">New Enrollment</span>
            </button>
          </Link>
          <Link href="/health-worker/vaccinate">
            <button className="w-full bg-who-green text-white py-6 rounded-lg font-bold text-lg shadow-sm hover:opacity-90 transition-all flex flex-col items-center justify-center gap-1">
              <span>Record Vaccination</span>
              <span className="text-xs font-normal opacity-80 uppercase tracking-widest">Submit Dose</span>
            </button>
          </Link>
        </div>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ STATS Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Today's Patients" value={stats?.todayPatients ?? 0} color="blue" />
          <StatCard label="Pending Sync" value={stats?.pendingSync ?? 0} color="orange" />
          <StatCard label="Total Records" value={stats?.totalRecords ?? 0} color="green" />
        </div>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ CLINIC STATS Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <Card>
          <h3 className="text-sm font-semibold text-ui-text mb-4 uppercase tracking-wider">Weekly Vaccination Performance</h3>
          <ClinicStatsBar clinicId={session.clinicId ?? 'clinic-001'} />
        </Card>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ RECENT PATIENTS Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <Card>
          <h3 className="text-sm font-semibold text-ui-text mb-4 uppercase tracking-wider">Recent Patient Registrations</h3>
          <RecentPatientsList workerId={session.userId} />
        </Card>
      </section>
    </main>
  );
}



