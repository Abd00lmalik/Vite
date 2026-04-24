'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { CircleHelp } from 'lucide-react';
import { useAbstraxionClient } from '@burnt-labs/abstraxion';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/db/schema';
import { UNSPLASH_IMAGES } from '@/lib/content/unsplash';
import { useXion } from '@/hooks/useXion';
import { isDemoAccount } from '@/lib/auth/demo';
import { queryProgramBalance } from '@/lib/xion/contracts';
import { shortTxHash } from '@/lib/utils/format';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { XionConnectButton } from '@/components/shared/XionConnectButton';
import { Card, StatCard } from '@/components/ui/card';
import { ProgramCard } from './ProgramCard';
import { FundingMetricsGrid } from './FundingMetricsGrid';
import { CoverageHeatmap } from './CoverageHeatmap';
import { TransactionTable } from './TransactionTable';
import { DisputePanel } from './DisputePanel';
import { ReportExporter } from './ReportExporter';
import { AuditLogTable } from './AuditLogTable';
import { FundingModal } from './FundingModal';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { PageTransition } from '@/components/shared/PageTransition';
import type { Program } from '@/types';
import type { CoverageHeatmapItem } from './CoverageHeatmap';

const MilestoneProgressChart = dynamic(
  () => import('./MilestoneProgressChart').then((mod) => mod.MilestoneProgressChart),
  { ssr: false }
);

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'programs', label: 'Programs' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'disputes', label: 'Disputes' },
  { id: 'reports', label: 'Reports' },
  { id: 'sms', label: 'SMS Log' },
] as const;

export function DonorDashboard() {
  const mounted = useMounted();
  const { session } = useAuth('donor');
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const { isConnected, disconnect } = useXion();
  const { client: queryClient } = useAbstraxionClient();

  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('overview');
  const [fundingProgram, setFundingProgram] = useState<Program | null>(null);
  const demoAccount = isDemoAccount({ userId: session?.userId, demo: session?.demo });

  const programs =
    useLiveQuery<Program[]>(
      () => (session ? db.programs.where('donorId').equals(session.userId).toArray() : Promise.resolve<Program[]>([])),
    [session?.userId]
  ) ?? [];

  const clinics = useLiveQuery(() => db.clinics.toArray(), []);

  const patients = useLiveQuery(async () => {
    const programIds = programs.map((program) => program.id);
    if (!programIds.length) return [];
    return db.patients.where('programId').anyOf(programIds).toArray();
  }, [programs.map((program) => program.id).join('|')]);

  const vaccinations = useLiveQuery(async () => {
    const patientIds = (patients ?? []).map((patient) => patient.id);
    if (!patientIds.length) return [];
    return db.vaccinations.where('patientId').anyOf(patientIds).toArray();
  }, [patients?.map((patient) => patient.id).join('|')]);

  const grants = useLiveQuery(async () => {
    const patientIds = (patients ?? []).map((patient) => patient.id);
    if (!patientIds.length) return [];
    return db.grantReleases.where('patientId').anyOf(patientIds).toArray();
  }, [patients?.map((patient) => patient.id).join('|')]);

  const disputes = useLiveQuery(async () => {
    const patientIds = (patients ?? []).map((patient) => patient.id);
    if (!patientIds.length) return [];
    return db.disputes.where('patientId').anyOf(patientIds).toArray();
  }, [patients?.map((patient) => patient.id).join('|')]);

  const smsLogs = useLiveQuery(async () => {
    const phones = Array.from(new Set((patients ?? []).map((patient) => patient.parentPhone)));
    if (!phones.length) return [];
    return db.smsLogs.where('to').anyOf(phones).reverse().sortBy('timestamp');
  }, [patients?.map((patient) => patient.parentPhone).join('|')]);

  const auditLogs = useLiveQuery(async () => {
    if (!session) return [];
    return db.auditLogs.where('performedBy').equals(session.userId).reverse().sortBy('timestamp');
  }, [session?.userId]);

  const syncBatches = useLiveQuery(async () => {
    if (!programs.length) return [];
    const clinicIds = Array.from(new Set((patients ?? []).map((patient) => patient.clinicId)));
    const all = await db.syncBatches.reverse().sortBy('submittedAt');
    if (!clinicIds.length) return [];
    return all.filter((batch) => batch.records.some((record) => clinicIds.includes(record.clinicId)));
  }, [programs.length, patients?.map((patient) => patient.clinicId).join('|')]);

  const totalEscrow = useMemo(() => programs.reduce((sum, program) => sum + (program.escrowBalance ?? 0), 0), [programs]);
  const totalReleased = useMemo(() => programs.reduce((sum, program) => sum + (program.totalReleased ?? 0), 0), [programs]);

  useEffect(() => {
    if (!isConnected || !queryClient || programs.length === 0) return;

    const syncBalances = async () => {
      for (const program of programs) {
        try {
          const balance = await queryProgramBalance(queryClient, program.id);
          const xionAmount = parseInt(balance, 10) / 1_000_000;
          if (xionAmount !== program.escrowBalance) {
            await db.programs.update(program.id, { escrowBalance: xionAmount });
          }
        } catch {
          // Non-blocking sync failure.
        }
      }
    };

    void syncBalances();
  }, [isConnected, programs, queryClient]);

  const metrics = useMemo(
    () => ({
      enrolled: patients?.length ?? 0,
      milestonesComplete: programs.reduce(
        (sum, program) => sum + program.milestones.reduce((milestoneSum, milestone) => milestoneSum + milestone.completedCount, 0),
        0
      ),
      fundsReleased: totalReleased,
      escrowBalance: totalEscrow,
    }),
    [patients, programs, totalEscrow, totalReleased]
  );

  const weeklyReleaseSeries = useMemo(() => {
    const rows = grants ?? [];
    const grouped = new Map<string, number>();
    for (const item of rows) {
      if (!item.releasedAt) continue;
      const date = new Date(item.releasedAt);
      const key = `${date.getUTCFullYear()}-W${Math.ceil((date.getUTCDate() + 6 - date.getUTCDay()) / 7)}`;
      grouped.set(key, (grouped.get(key) ?? 0) + item.amount);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, released]) => ({ week, released }));
  }, [grants]);

  const regionalCoverage: CoverageHeatmapItem[] = useMemo(() => {
    if (!patients?.length || !vaccinations?.length) return [];
    const clinicById = new Map((clinics ?? []).map((clinic) => [clinic.id, clinic]));
    const grouped = new Map<string, { vaccinated: number; total: number }>();

    for (const patient of patients) {
      const clinic = clinicById.get(patient.clinicId);
      const region =
        clinic?.state ??
        clinic?.location?.split(',')[0]?.trim() ??
        patient.clinicName ??
        patient.clinicId;
      const patientRecords = vaccinations.filter((record) => record.patientId === patient.id);
      const syncedRecords = patientRecords.filter((record) => record.syncStatus === 'synced').length;
      const current = grouped.get(region) ?? { vaccinated: 0, total: 0 };
      current.vaccinated += syncedRecords;
      current.total += patientRecords.length;
      grouped.set(region, current);
    }

    return Array.from(grouped.entries()).map(([state, value]) => ({
      state,
      vaccinated: value.vaccinated,
      total: value.total,
      coverage: value.total > 0 ? Math.round((value.vaccinated / value.total) * 100) : 0,
    }));
  }, [clinics, patients, vaccinations]);

  const demoRegionalSample: CoverageHeatmapItem[] = useMemo(
    () => [
      { state: 'Kano', coverage: 74, vaccinated: 74, total: 100 },
      { state: 'Oyo', coverage: 68, vaccinated: 68, total: 100 },
      { state: 'Lagos', coverage: 71, vaccinated: 71, total: 100 },
      { state: 'Abuja', coverage: 66, vaccinated: 66, total: 100 },
      { state: 'Kaduna', coverage: 62, vaccinated: 62, total: 100 },
      { state: 'Enugu', coverage: 59, vaccinated: 59, total: 100 },
    ],
    []
  );

  if (!mounted || !session) return <PageSkeleton />;

  const firstProgram = programs[0];

  return (
    <main className="min-h-screen bg-ui-bg pb-24 font-sans">
      <header className="sticky top-0 z-40 border-b border-ui-border bg-white/90 shadow-sm backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Vite logo" width={32} height={32} className="rounded" />
            <div>
              <p className="text-base font-bold leading-tight text-ui-text">{session.organizationName ?? session.name}</p>
              <p className="text-xs text-ui-text-muted">Donor Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/how-it-works" className="hidden items-center gap-1 text-sm font-medium text-ui-text-light transition-colors hover:text-who-blue sm:inline-flex">
              <CircleHelp className="h-4 w-4" />
              Guide
            </Link>
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

      <PageTransition className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Enrolled" value={metrics.enrolled} color="blue" />
          <StatCard label="Milestones Met" value={metrics.milestonesComplete} color="green" />
          <StatCard label="Funds Released" value={`$${metrics.fundsReleased.toLocaleString()}`} color="blue" />
          <StatCard label="Escrow Balance" value={`$${metrics.escrowBalance.toLocaleString()}`} color="orange" />
        </div>

        <div className="sticky top-16 z-30 -mx-4 border-b border-ui-border bg-white/85 px-4 backdrop-blur sm:mx-0 sm:px-0">
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            {TABS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`whitespace-nowrap border-b-2 pb-4 text-sm font-medium transition-colors ${
                  tab === item.id ? 'border-who-blue text-who-blue' : 'border-transparent text-ui-text-light hover:text-ui-text'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {tab === 'overview' ? (
            <div className="space-y-6">
              <Card className="overflow-hidden p-0">
                <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
                  <div className="space-y-3 p-6">
                    <span className="badge-green">Funding confidence</span>
                    <h2 className="text-2xl font-bold text-ui-text">Track verified milestones and disburse with confidence.</h2>
                    <p className="text-sm text-ui-text-light">
                      Fund active programs, monitor progress in real time, and export donor-ready reporting without manual reconciliation.
                    </p>
                  </div>
                  <div className="relative min-h-56 md:min-h-full">
                    <Image src={UNSPLASH_IMAGES.dashboard.donor} alt="Healthcare funding analytics" fill className="object-cover" />
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ui-text">Active Programs</h2>
                <Link href="/donor/programs/new" className="text-sm font-semibold text-who-blue hover:underline">
                  + Create New Program
                </Link>
              </div>

              {programs.length === 0 ? (
                <Card className="overflow-hidden p-0">
                  <div className="grid gap-0 md:grid-cols-[1fr_280px]">
                    <div className="space-y-4 p-8 text-center md:text-left">
                      <p className="text-sm text-ui-text-muted">No active programs yet.</p>
                      <Link href="/donor/programs/new" className="btn-primary h-11 px-5 text-sm">
                        Create Your First Program
                      </Link>
                    </div>
                    <div className="relative min-h-44">
                      <Image src={UNSPLASH_IMAGES.landing.system} alt="Healthcare planning visual" fill className="object-cover" />
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {programs.map((program) => (
                    <ProgramCard
                      key={program.id}
                      program={program}
                      enrolledPatients={(patients ?? []).filter((patient) => patient.programId === program.id).length}
                      onFund={() => setFundingProgram(program)}
                    />
                  ))}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <p className="mb-6 text-sm font-semibold text-ui-text-light">Milestone Completion Trends</p>
                  <MilestoneProgressChart program={firstProgram} />
                </Card>
                <Card>
                  <p className="mb-6 text-sm font-semibold text-ui-text-light">Donor Fund Distribution</p>
                  <FundingMetricsGrid
                    totalReleased={metrics.fundsReleased}
                    escrowBalance={metrics.escrowBalance}
                    enrolledPatients={metrics.enrolled}
                    milestonesComplete={metrics.milestonesComplete}
                    weeklySeries={weeklyReleaseSeries}
                    loading={grants === undefined}
                    sampleData={demoAccount && weeklyReleaseSeries.length === 0}
                  />
                </Card>
              </div>

              <Card>
                <p className="mb-6 text-sm font-semibold text-ui-text-light">Regional Coverage Insight</p>
                <CoverageHeatmap
                  data={regionalCoverage.length ? regionalCoverage : demoAccount ? demoRegionalSample : []}
                  loading={patients === undefined || vaccinations === undefined}
                  sampleData={demoAccount && regionalCoverage.length === 0}
                />
              </Card>
            </div>
          ) : null}

          {tab === 'programs' ? (
            <div className="space-y-4">
              <div className="flex justify-start">
                <Link href="/donor/programs/new" className="btn-accent h-11 px-5 text-sm">
                  + Create New Program
                </Link>
              </div>
              <div className="grid gap-6">
                {programs.map((program) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    enrolledPatients={(patients ?? []).filter((patient) => patient.programId === program.id).length}
                    onFund={() => setFundingProgram(program)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {tab === 'transactions' ? (
            <Card padding="none" className="overflow-hidden">
              <TransactionTable transactions={grants ?? []} />
            </Card>
          ) : null}

          {tab === 'disputes' ? <DisputePanel disputes={(disputes ?? []).filter((dispute) => dispute.status !== 'resolved')} /> : null}

          {tab === 'reports' ? (
            <div className="space-y-6">
              {firstProgram ? <ReportExporter programId={firstProgram.id} /> : null}
              <Card>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ui-text">XION Synchronization Log</h3>
                <div className="-mx-6 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-y border-ui-border bg-ui-bg text-left">
                      <tr>
                        {['Batch ID', 'Records', 'Merkle Root', 'XION Tx Hash', 'Sync Time'].map((header) => (
                          <th key={header} className="px-6 py-3 font-semibold text-ui-text-muted">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ui-border">
                      {(syncBatches ?? []).map((batch) => (
                        <tr key={batch.id} className="transition-colors hover:bg-ui-bg/50">
                          <td className="px-6 py-4 font-medium text-who-blue">{batch.id.slice(0, 8)}</td>
                          <td className="px-6 py-4">{batch.recordCount}</td>
                          <td className="px-6 py-4 font-mono text-xs text-ui-text-muted">
                            {batch.merkleRoot.slice(0, 12)}...{batch.merkleRoot.slice(-8)}
                          </td>
                          <td className="px-6 py-4">
                            {batch.xionTxHash ? (
                              <a
                                href={`https://explorer.burnt.com/xion-testnet-2/transactions/${batch.xionTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-xs text-who-blue hover:underline"
                              >
                                {shortTxHash(batch.xionTxHash)}
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 text-ui-text-light">
                            {batch.submittedAt ? new Date(batch.submittedAt).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              <AuditLogTable logs={auditLogs ?? []} />
            </div>
          ) : null}

          {tab === 'sms' ? (
            <Card>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ui-text">SMS Communication Log</h3>
              <div className="-mx-6 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-y border-ui-border bg-ui-bg text-left">
                    <tr>
                      {['Recipient', 'Type', 'Message', 'Timestamp'].map((header) => (
                        <th key={header} className="px-6 py-3 font-semibold text-ui-text-muted">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ui-border">
                    {(smsLogs ?? []).map((log) => (
                      <tr key={log.id} className="transition-colors hover:bg-ui-bg/50">
                        <td className="px-6 py-4 font-medium">{log.to}</td>
                        <td className="px-6 py-4">
                          <span className={log.type === 'milestone-payment' ? 'badge-blue' : 'badge-orange'}>{log.type}</span>
                        </td>
                        <td className="max-w-sm truncate px-6 py-4 text-ui-text-light">{log.message}</td>
                        <td className="px-6 py-4 text-xs text-ui-text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
        </div>
      </PageTransition>

      {fundingProgram ? (
        <FundingModal
          program={fundingProgram}
          onClose={() => setFundingProgram(null)}
          onSuccess={() => {
            toast.success('Escrow funded successfully!');
          }}
        />
      ) : null}
    </main>
  );
}
