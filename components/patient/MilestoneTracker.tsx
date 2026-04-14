import { Timeline } from '@/components/ui/Timeline';
import type { Milestone, VaccinationRecord } from '@/types';

interface MilestoneTrackerProps {
  milestones: Milestone[];
  records: VaccinationRecord[];
}

export function MilestoneTracker({ milestones, records }: MilestoneTrackerProps) {
  if (!milestones.length) {
    return <p className="text-sm text-gray-500">No milestones assigned.</p>;
  }

  const items = milestones.map((milestone) => {
    const completed = records.some(
      (record) =>
        record.vaccineName === milestone.vaccineName && record.doseNumber === milestone.doseNumber
    );

    return {
      id: milestone.id,
      title: milestone.name,
      caption: completed
        ? `Completed • $${milestone.grantAmount}`
        : `Pending • $${milestone.grantAmount}`,
      status: completed ? ('complete' as const) : ('pending' as const),
    };
  });

  return <Timeline items={items} />;
}

