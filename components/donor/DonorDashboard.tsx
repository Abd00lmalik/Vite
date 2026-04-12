'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import { Bell, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { ProgramCard } from './ProgramCard';
import { MilestoneProgressChart } from './MilestoneProgressChart';
import { FundingMetricsGrid } from './FundingMetricsGrid';
import { CoverageHeatmap } from './CoverageHeatmap';
import { TransactionTable } from './TransactionTable';
import { DisputePanel } from './DisputePanel';
import { ReportExporter } from './ReportExporter';
import { AuditLogTable } from './AuditLogTable';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

export function DonorDashboard() {
  const mounted = useMounted();
  const { session } = useAuth('donor');
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [tab, setTab] = useState('overview');

  const programs = useLiveQuery(() => db.programs.toArray(), []);
  const grants = useLiveQuery(() => db.grantReleases.toArray(), []);
  const disputes = useLiveQuery(() => db.disputes.toArray(), []);
  const smsLogs = useLiveQuery(() => db.smsLogs.reverse().sortBy('timestamp'), []);
  const auditLogs = useLiveQuery(() => db.auditLogs.reverse().sortBy('timestamp'), []);
  const patients = useLiveQuery(() => db.patients.toArray(), []);

  const metrics = useMemo(() => {
    const enrolled = patients?.length ?? 0;
    const milestonesComplete = (programs ?? []).reduce(
      (sum, program) => sum + program.milestones.reduce((acc, item) => acc + item.completedCount, 0),
      0
    );
    const fundsReleased = (grants ?? []).reduce((sum, grant) => sum + grant.amount, 0);
    const escrowBalance = (programs ?? []).reduce((sum, program) => sum + program.escrowBalance - program.totalReleased, 0);

    return {
      enrolled,
      milestonesComplete,
      fundsReleased,
      escrowBalance,
    };
  }, [grants, patients, programs]);

  if (!mounted || !session) {
    return <PageSkeleton />;
  }

  const firstProgram = programs?.[0];

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="border-b border-gray-200 bg-white px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="VITE logo" width={38} height={38} className="rounded-md" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{session.organizationName ?? session.name}</p>
              <p className="text-xs text-gray-600">Donor Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

      <section className="mx-auto max-w-6xl space-y-4 px-4 py-4 md:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Enrolled" value={metrics.enrolled} />
          <StatCard label="Milestones Complete" value={metrics.milestonesComplete} color="green" />
          <StatCard label="Funds Released" value={`$${metrics.fundsReleased.toFixed(0)}`} color="blue" animate={false} />
          <StatCard label="Escrow Balance" value={`$${metrics.escrowBalance.toFixed(0)}`} color="amber" animate={false} />
        </div>

        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'overview', label: 'Overview' },
            { id: 'programs', label: 'Programs' },
            { id: 'transactions', label: 'Transactions' },
            { id: 'disputes', label: 'Disputes' },
            { id: 'reports', label: 'Reports' },
            { id: 'sms', label: 'SMS Log' },
          ]}
        />

        {tab === 'overview' ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Milestone Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <MilestoneProgressChart program={firstProgram} />
              </CardContent>
            </Card>
            <FundingMetricsGrid
              totalReleased={metrics.fundsReleased}
              escrowBalance={metrics.escrowBalance}
              enrolledPatients={metrics.enrolled}
              milestonesComplete={metrics.milestonesComplete}
            />
            <CoverageHeatmap />
          </div>
        ) : null}

        {tab === 'programs' ? (
          <div className="space-y-3">
            <Link href="/donor/programs/new">
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create New Program
              </Button>
            </Link>

            {(programs ?? []).map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                enrolledPatients={(patients ?? []).filter((patient) => patient.programId === program.id).length}
                onToggleStatus={async (item) => {
                  await db.programs.update(item.id, {
                    status: item.status === 'active' ? 'paused' : 'active',
                  });
                }}
              />
            ))}
          </div>
        ) : null}

        {tab === 'transactions' ? <TransactionTable transactions={grants ?? []} /> : null}

        {tab === 'disputes' ? <DisputePanel disputes={(disputes ?? []).filter((item) => item.status !== 'resolved')} /> : null}

        {tab === 'reports' ? (
          <div className="space-y-4">
            {firstProgram ? <ReportExporter programId={firstProgram.id} /> : null}
            <AuditLogTable logs={auditLogs ?? []} />
          </div>
        ) : null}

        {tab === 'sms' ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-3 py-2">Recipient</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Message</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {(smsLogs ?? []).map((log) => (
                  <tr key={log.id} className="border-t border-gray-200">
                    <td className="px-3 py-2">{log.to}</td>
                    <td className="px-3 py-2">{log.type}</td>
                    <td className="px-3 py-2">{log.message.slice(0, 80)}...</td>
                    <td className="px-3 py-2">{log.status}</td>
                    <td className="px-3 py-2">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}


