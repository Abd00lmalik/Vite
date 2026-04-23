'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { CircleHelp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMounted } from '@/hooks/useMounted';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/db/schema';
import { useXion } from '@/hooks/useXion';
import { useAbstraxionClient } from '@burnt-labs/abstraxion';
import { queryProgramBalance } from '@/lib/xion/contracts';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { XionConnectButton } from '@/components/shared/XionConnectButton';
import { Card, StatCard } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { ProgramCard } from './ProgramCard';
const MilestoneProgressChart = dynamic(
  () => import('./MilestoneProgressChart').then((mod) => mod.MilestoneProgressChart),
  { ssr: false }
);
import { FundingMetricsGrid } from './FundingMetricsGrid';
import { CoverageHeatmap } from './CoverageHeatmap';
import { TransactionTable } from './TransactionTable';
import { DisputePanel } from './DisputePanel';
import { ReportExporter } from './ReportExporter';
import { AuditLogTable } from './AuditLogTable';
import { FundingModal } from './FundingModal';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { shortTxHash } from '@/lib/utils/format';
import type { Program } from '@/types';

const TABS = [
  { id: 'overview',      label: 'Overview' },
  { id: 'programs',      label: 'Programs' },
  { id: 'transactions',  label: 'Transactions' },
  { id: 'disputes',      label: 'Disputes' },
  { id: 'reports',       label: 'Reports' },
  { id: 'sms',           label: 'SMS Log' },
];

export function DonorDashboard() {
  const mounted     = useMounted();
  const { session } = useAuth('donor');
  const logout      = useAuthStore((s) => s.logout);
  const router      = useRouter();
  const { address, isConnected } = useXion();
  const { client: queryClient } = useAbstraxionClient();
  
  const [tab, setTab]                   = useState('overview');
  const [fundingProgram, setFundingProgram] = useState<Program | null>(null);

  const programs = useLiveQuery<Program[]>(
    () =>
      session
        ? db.programs.where('donorId').equals(session.userId).toArray()
        : Promise.resolve<Program[]>([]),
    [session?.userId]
  ) ?? [];

  const patients = useLiveQuery(async () => {
    const programIds = programs.map((program) => program.id);
    if (!programIds.length) return [];
    return db.patients.where('programId').anyOf(programIds).toArray();
  }, [programs.map((program) => program.id).join('|')]);

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
  
  const totalEscrow = useMemo(() => programs.reduce((sum, p) => sum + (p.escrowBalance ?? 0), 0), [programs]);
  const totalReleased = useMemo(() => programs.reduce((sum, p) => sum + (p.totalReleased ?? 0), 0), [programs]);

  // Real XION sync for balances
  useEffect(() => {
    if (!isConnected || !queryClient || programs.length === 0) return;
    
    const syncBalances = async () => {
      for (const p of programs) {
        try {
          const bal = await queryProgramBalance(queryClient, p.id);
          const xionAmount = parseInt(bal) / 1_000_000;
          if (xionAmount !== p.escrowBalance) {
            await db.programs.update(p.id, { escrowBalance: xionAmount });
          }
        } catch (e) {
          // Silent failure for balance sync is acceptable during poll
        }
      }
    };
    
    syncBalances();
  }, [isConnected, programs, queryClient]);

  const metrics = useMemo(() => ({
    enrolled:          patients?.length ?? 0,
    milestonesComplete: programs.reduce(
      (sum, p) => sum + p.milestones.reduce((a, m) => a + m.completedCount, 0), 0
    ),
    fundsReleased:  totalReleased,
    escrowBalance:  totalEscrow,
  }), [patients, programs, totalEscrow, totalReleased]);

  if (!mounted || !session) return <PageSkeleton />;

  const firstProgram = programs[0];

  return (
    <main className="min-h-screen bg-ui-bg pb-24 font-sans">

      {/* ── HEADER ── */}
      <header className="bg-who-blue text-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Vite" width={32} height={32} className="rounded" />
              <div>
                <p className="text-base font-bold leading-tight">
                  {session.organizationName ?? session.name}
                </p>
                <p className="text-xs text-white/70">Health Donor Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/how-it-works" className="hidden sm:inline-flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm font-medium">
                <CircleHelp className="h-4 w-4" />
                Guide
              </Link>
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

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── STAT CARDS ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Enrolled" value={metrics.enrolled} color="blue" />
          <StatCard label="Milestones Met" value={metrics.milestonesComplete} color="green" />
          <StatCard label="Funds Released" value={`$${metrics.fundsReleased.toLocaleString()}`} color="blue" />
          <StatCard label="Escrow Balance" value={`$${metrics.escrowBalance.toLocaleString()}`} color="orange" />
        </div>

        {/* ── TABS ── */}
        <div className="bg-white border-b border-ui-border sticky top-16 z-30 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`pb-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2
                            ${tab === t.id
                              ? 'border-who-blue text-who-blue'
                              : 'border-transparent text-ui-text-light hover:text-ui-text'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="space-y-6">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ui-text">Active Programs</h2>
                <Link href="/donor/programs/new" className="text-sm font-semibold text-who-blue hover:underline">
                  + Create New Program
                </Link>
              </div>

              {programs.length === 0 ? (
                <Card className="text-center py-12">
                  <p className="text-ui-text-muted mb-6 text-sm">No active humanitarian programs found.</p>
                  <Link href="/donor/programs/new">
                    <button className="btn-primary">Create Your First Program</button>
                  </Link>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {programs.map((program) => (
                    <ProgramCard
                      key={program.id}
                      program={program}
                      enrolledPatients={(patients ?? []).filter((p) => p.programId === program.id).length}
                      onFund={() => setFundingProgram(program)}
                    />
                  ))}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <p className="text-sm font-semibold text-ui-text-light mb-6">Milestone Completion Trends</p>
                  <MilestoneProgressChart program={firstProgram} />
                </Card>
                <Card>
                  <p className="text-sm font-semibold text-ui-text-light mb-6">Donor Fund Distribution</p>
                  <FundingMetricsGrid
                    totalReleased={metrics.fundsReleased}
                    escrowBalance={metrics.escrowBalance}
                    enrolledPatients={metrics.enrolled}
                    milestonesComplete={metrics.milestonesComplete}
                  />
                </Card>
              </div>
              
              <Card>
                <p className="text-sm font-semibold text-ui-text-light mb-6">Regional Coverage Insight</p>
                <CoverageHeatmap />
              </Card>
            </div>
          )}

          {tab === 'programs' && (
            <div className="space-y-4">
              <div className="flex justify-start">
                <Link href="/donor/programs/new">
                  <button className="btn-accent">+ Create New Program</button>
                </Link>
              </div>
              <div className="grid gap-6">
                {programs.map((program) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    enrolledPatients={(patients ?? []).filter((p) => p.programId === program.id).length}
                    onFund={() => setFundingProgram(program)}
                  />
                ))}
              </div>
            </div>
          )}

          {tab === 'transactions' && (
            <Card padding="none" className="overflow-hidden">
              <TransactionTable transactions={grants ?? []} />
            </Card>
          )}

          {tab === 'disputes' && (
            <DisputePanel disputes={(disputes ?? []).filter((d) => d.status !== 'resolved')} />
          )}

          {tab === 'reports' && (
            <div className="space-y-6">
              {firstProgram && <ReportExporter programId={firstProgram.id} />}
              <Card>
                <h3 className="text-sm font-semibold text-ui-text mb-4 uppercase tracking-wider">XION Synchronization Log</h3>
                <div className="overflow-x-auto -mx-6">
                  <table className="min-w-full text-sm">
                    <thead className="bg-ui-bg border-y border-ui-border text-left">
                      <tr>
                        {['Batch ID', 'Records', 'Merkle Root', 'XION Tx Hash', 'Sync Time'].map((h) => (
                          <th key={h} className="px-6 py-3 font-semibold text-ui-text-muted">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ui-border">
                  {(syncBatches ?? []).map((batch) => (
                        <tr key={batch.id} className="hover:bg-ui-bg/50 transition-colors">
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
                                className="text-who-blue hover:underline font-mono text-xs"
                              >
                                {shortTxHash(batch.xionTxHash)}
                              </a>
                            ) : '-'}
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
          )}

          {tab === 'sms' && (
            <Card>
              <h3 className="text-sm font-semibold text-ui-text mb-4 uppercase tracking-wider">SMS Communication Log</h3>
              <div className="overflow-x-auto -mx-6">
                <table className="min-w-full text-sm">
                  <thead className="bg-ui-bg border-y border-ui-border text-left">
                    <tr>
                      {['Recipient', 'Type', 'Message', 'Timestamp'].map((h) => (
                        <th key={h} className="px-6 py-3 font-semibold text-ui-text-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ui-border">
                    {(smsLogs ?? []).map((log) => (
                      <tr key={log.id} className="hover:bg-ui-bg/50 transition-colors">
                        <td className="px-6 py-4 font-medium">{log.to}</td>
                        <td className="px-6 py-4">
                          <span className={log.type === 'milestone-payment' ? 'badge-blue' : 'badge-orange'}>
                            {log.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-ui-text-light max-w-sm truncate">{log.message}</td>
                        <td className="px-6 py-4 text-xs text-ui-text-muted">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* ── FUNDING MODAL ── */}
      {fundingProgram && (
        <FundingModal
          program={fundingProgram}
          onClose={() => setFundingProgram(null)}
          onSuccess={() => {
            toast.success('Escrow funded successfully!');
          }}
        />
      )}
    </main>
  );
}



