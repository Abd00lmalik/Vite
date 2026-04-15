'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { CircleHelp, Syringe, UserPlus, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SyncPanel } from '@/components/shared/SyncPanel';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { ClinicStatsBar } from './ClinicStatsBar';
import { RecentPatientsList } from './RecentPatientsList';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

export function HWDashboard() {
  const mounted = useMounted();
  const { session } = useAuth('health-worker');
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const isOnline = useOfflineStatus();

  const stats = useLiveQuery(async () => {
    if (!session) return { todayPatients: 0, pendingSync: 0, totalRecords: 0 };

    const today = new Date().toISOString().slice(0, 10);
    const todayPatients = (await db.patients.where('registeredBy').equals(session.userId).toArray()).filter(
      (patient) => patient.registeredAt.slice(0, 10) === today
    ).length;

    const pendingSync =
      (await db.vaccinations.where('syncStatus').equals('pending').count()) +
      (await db.patients.where('syncStatus').equals('pending').count());

    const totalRecords = await db.vaccinations.where('administeredBy').equals(session.userId).count();

    return { todayPatients, pendingSync, totalRecords };
  }, [session?.userId]);

  if (!mounted || !session) {
    return <PageSkeleton />;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="border-b border-gray-200 bg-white px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="VITE logo" width={38} height={38} className="rounded-md" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{session.name}</p>
              <p className="text-xs text-gray-600">Health Worker - Clinic: {session.clinicId ?? 'clinic-001'}</p>
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
                router.push('/');
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-4 px-4 py-4 md:px-8">
        {!isOnline ? <OfflineBanner /> : null}
        <SyncPanel />

        <div className="grid gap-3 md:grid-cols-2">
          <Link href="/health-worker/register">
            <Button className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              Register New Patient
            </Button>
          </Link>
          <Link href="/health-worker/vaccinate">
            <Button variant="secondary" className="w-full">
              <Syringe className="mr-2 h-4 w-4" />
              Record Vaccination
            </Button>
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Today's patients" value={stats?.todayPatients ?? 0} icon={<Users className="h-4 w-4" />} />
          <StatCard label="Pending sync" value={stats?.pendingSync ?? 0} color="amber" />
          <StatCard label="Records total" value={stats?.totalRecords ?? 0} color="blue" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>This Week's Vaccinations</CardTitle>
          </CardHeader>
          <CardContent>
            <ClinicStatsBar clinicId={session.clinicId ?? 'clinic-001'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentPatientsList workerId={session.userId} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}


