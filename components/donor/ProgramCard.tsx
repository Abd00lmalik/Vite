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
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{program.name}</h3>
          <p className="mt-0.5 text-xs text-gray-400">{program.donorName}</p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            program.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {program.status}
        </span>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>Milestone completion</span>
          <span>{completionPct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-teal-primary transition-all"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-teal-pale p-3">
          <p className="text-xs text-gray-500">Escrow Balance</p>
          <p className="text-lg font-bold text-teal-dark">${(program.escrowBalance ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Released</p>
          <p className="text-lg font-bold text-gray-700">${(program.totalReleased ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <p className="mb-4 text-xs text-gray-400">{programEnrolled} patients enrolled</p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onFund}
          className="flex-1 rounded-lg bg-teal-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-dark"
        >
          + Fund Program
        </button>
        <Link
          href={`/donor/programs/${program.id}`}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
        >
          Details
        </Link>
      </div>

      {onToggleStatus ? (
        <button
          type="button"
          onClick={() => onToggleStatus(program)}
          className="mt-2 w-full rounded-lg border border-gray-200 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50"
        >
          {program.status === 'active' ? 'Pause Program' : 'Resume Program'}
        </button>
      ) : null}
    </div>
  );
}
