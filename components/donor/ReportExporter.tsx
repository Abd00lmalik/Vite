'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateReport, exportToCSV, exportToPrintableHTML } from '@/lib/programs/reporting';

interface ReportExporterProps {
  programId: string;
}

export function ReportExporter({ programId }: ReportExporterProps) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-600">Auto-generated program report from IndexedDB records.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          loading={loading}
          onClick={async () => {
            setLoading(true);
            const report = await generateReport(programId);
            exportToCSV(report);
            setLoading(false);
          }}
        >
          Export CSV
        </Button>
        <Button
          type="button"
          variant="ghost"
          loading={loading}
          onClick={async () => {
            setLoading(true);
            const report = await generateReport(programId);
            exportToPrintableHTML(report);
            setLoading(false);
          }}
        >
          Export PDF Summary
        </Button>
      </div>
      <p className="text-xs text-gray-500">GAVI-format export available in Phase 2.</p>
    </div>
  );
}


