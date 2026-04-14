import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Program } from '@/types';

interface ProgramCardProps {
  program: Program;
  enrolledPatients: number;
  onToggleStatus: (program: Program) => void;
  onFund: (program: Program) => void;
}

export function ProgramCard({ program, enrolledPatients, onToggleStatus, onFund }: ProgramCardProps) {
  const milestoneTotal = program.milestones.reduce((sum, milestone) => sum + milestone.completedCount + milestone.pendingCount, 0);
  const milestoneCompleted = program.milestones.reduce((sum, milestone) => sum + milestone.completedCount, 0);
  const progress = milestoneTotal > 0 ? (milestoneCompleted / milestoneTotal) * 100 : 0;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm text-gray-500">{program.donorName}</p>
            <h3 className="text-lg font-semibold text-gray-900">{program.name}</h3>
          </div>
          <Badge variant={program.status === 'active' ? 'active' : 'pending'}>{program.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
          <p>Enrolled: {enrolledPatients}</p>
          <p>Escrow: ${program.escrowBalance.toFixed(2)}</p>
          <p>Released: ${program.totalReleased.toFixed(2)}</p>
          <p>Balance: ${(program.escrowBalance - program.totalReleased).toFixed(2)}</p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Escrow Balance</p>
            <p className="text-xl font-bold text-teal-primary">${program.escrowBalance.toLocaleString()}</p>
          </div>
          <button
            type="button"
            onClick={() => onFund(program)}
            className="rounded-lg bg-teal-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-dark"
          >
            + Fund Program
          </button>
        </div>

        <div>
          <p className="mb-1 text-xs text-gray-500">Milestone completion</p>
          <ProgressBar value={progress} />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Link href={`/donor/programs/${program.id}`}>
            <Button variant="outline" className="w-full">View Details</Button>
          </Link>
          <Button variant="ghost" className="w-full" onClick={() => onToggleStatus(program)}>
            {program.status === 'active' ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


