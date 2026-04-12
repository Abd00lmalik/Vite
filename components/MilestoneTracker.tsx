'use client';

import type { VaccinationRecord, Program } from '@/types';
import { CheckCircle2, Circle, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MilestoneTrackerProps {
  vaccinations: VaccinationRecord[];
  program?: Program;
}

// Default milestones if no program provided
const DEFAULT_MILESTONES = [
  { id: 'dtp1', name: 'DTP Dose 1', vaccineName: 'DTP', doseNumber: 1, grantAmount: 3 },
  { id: 'dtp2', name: 'DTP Dose 2', vaccineName: 'DTP', doseNumber: 2, grantAmount: 3 },
  { id: 'measles', name: 'Measles Dose 1', vaccineName: 'Measles', doseNumber: 1, grantAmount: 5 },
];

export function MilestoneTracker({ vaccinations, program }: MilestoneTrackerProps) {
  const milestones = program?.milestones || DEFAULT_MILESTONES.map(m => ({
    ...m,
    programId: 'default',
    description: '',
    completedCount: 0,
    pendingCount: 0,
  }));

  const isMilestoneComplete = (vaccineName: string, doseNumber: number) => {
    return vaccinations.some(
      (v) => v.vaccineName === vaccineName && v.doseNumber === doseNumber && v.syncStatus === 'synced'
    );
  };

  const isMilestonePending = (vaccineName: string, doseNumber: number) => {
    return vaccinations.some(
      (v) => v.vaccineName === vaccineName && v.doseNumber === doseNumber && v.syncStatus === 'pending'
    );
  };

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-foreground mb-3">Vaccination Progress</h3>
      <div className="space-y-2">
        {milestones.map((milestone, index) => {
          const isComplete = isMilestoneComplete(milestone.vaccineName, milestone.doseNumber);
          const isPending = isMilestonePending(milestone.vaccineName, milestone.doseNumber);

          return (
            <div key={milestone.id} className="relative">
              {/* Connecting line */}
              {index < milestones.length - 1 && (
                <div
                  className={cn(
                    'absolute left-3 top-8 w-0.5 h-6',
                    isComplete ? 'bg-green-500' : 'bg-gray-200'
                  )}
                />
              )}

              <div className="flex items-center gap-3">
                {/* Status icon */}
                <div
                  className={cn(
                    'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                    isComplete && 'bg-green-100',
                    isPending && 'bg-amber-100',
                    !isComplete && !isPending && 'bg-gray-100'
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : isPending ? (
                    <Circle className="h-5 w-5 text-amber-500 fill-amber-200" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                </div>

                {/* Milestone info */}
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span
                    className={cn(
                      'text-sm font-medium truncate',
                      isComplete ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {milestone.name}
                  </span>

                  {/* Grant amount */}
                  <span
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium ml-2',
                      isComplete ? 'text-green-600' : 'text-muted-foreground'
                    )}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    {milestone.grantAmount}
                    {isComplete && (
                      <span className="text-green-600 ml-1">released</span>
                    )}
                    {isPending && (
                      <span className="text-amber-600 ml-1">pending</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

