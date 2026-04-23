import { Badge } from '@/components/ui/badge';
import type { VaccinationRecord } from '@/types';

interface VaccinationTimelineProps {
  records: VaccinationRecord[];
}

export function VaccinationTimeline({ records }: VaccinationTimelineProps) {
  if (records.length === 0) {
    return <p className="text-sm text-gray-500">No vaccinations recorded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div key={record.id} className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">
              {record.vaccineName} Dose {record.doseNumber}
            </p>
            <Badge variant={record.syncStatus === 'synced' ? 'synced' : record.syncStatus === 'flagged' ? 'flagged' : 'pending'}>
              {record.syncStatus === 'synced' ? 'Verified on XION' : record.syncStatus === 'flagged' ? 'Flagged' : 'Pending Sync'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-gray-600">{new Date(record.dateAdministered).toLocaleDateString()}</p>
          <p className="text-xs text-gray-500">Clinic: {record.clinicName ?? record.clinicId}</p>
        </div>
      ))}
    </div>
  );
}





