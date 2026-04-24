import Link from 'next/link';
import type { Program } from '@/types';

interface ProgramCardProps {
  program: Program;
  onFund: () => void;
  enrolledPatients?: number;
  onToggleStatus?: (program: Program) => void;
}

export function ProgramCard({ program, onFund, enrolledPatients, onToggleStatus }: ProgramCardProps) {
  const completed = program.milestones.reduce((sum, milestone) => sum + milestone.completedCount, 0);
  const total = program.milestones.reduce(
    (sum, milestone) => sum + milestone.completedCount + milestone.pendingCount,
    0
  );
  const completionPct = program.milestones.length > 0 ? Math.round((completed / (total || 1)) * 100) : 0;
  const programEnrolled = enrolledPatients ?? program.enrolledPatients ?? 0;

  return (
    <div className="rounded-2xl border border-ui-border bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-panel">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-ui-text">{program.name}</h3>
          <p className="mt-0.5 text-xs text-ui-text-muted">{program.donorName}</p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            program.status === 'active' ? 'bg-who-green-light text-who-green' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {program.status}
        </span>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs text-ui-text-muted">
          <span>Milestone completion</span>
          <span>{completionPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ui-surface">
          <div
            className="h-full rounded-full bg-teal-primary transition-all"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-who-blue-light p-3">
          <p className="text-xs text-ui-text-muted">Escrow Balance</p>
          <p className="text-lg font-bold text-teal-dark">${(program.escrowBalance ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-ui-surface p-3">
          <p className="text-xs text-ui-text-muted">Released</p>
          <p className="text-lg font-bold text-ui-text">${(program.totalReleased ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <p className="mb-4 text-xs text-ui-text-muted">{programEnrolled} patients enrolled</p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onFund}
          className="flex-1 rounded-xl bg-who-green py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0f9f90]"
        >
          + Fund Program
        </button>
        <Link
          href={`/donor/programs/${program.id}`}
          className="rounded-xl border border-ui-border px-4 py-2.5 text-sm text-ui-text-light transition-colors hover:bg-ui-surface"
        >
          Details
        </Link>
      </div>

      {onToggleStatus ? (
        <button
          type="button"
          onClick={() => onToggleStatus(program)}
          className="mt-2 w-full rounded-xl border border-ui-border py-2 text-xs text-ui-text-light transition-colors hover:bg-ui-surface"
        >
          {program.status === 'active' ? 'Pause Program' : 'Resume Program'}
        </button>
      ) : null}
    </div>
  );
}



