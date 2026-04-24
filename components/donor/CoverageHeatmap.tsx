import { motion, useReducedMotion } from 'framer-motion';

export interface CoverageHeatmapItem {
  state: string;
  coverage: number;
  vaccinated: number;
  total: number;
}

function coverageColor(pct: number) {
  if (pct >= 70) return 'bg-who-green';
  if (pct >= 50) return 'bg-who-blue';
  return 'bg-who-orange';
}

interface CoverageHeatmapProps {
  data: CoverageHeatmapItem[];
  loading?: boolean;
  sampleData?: boolean;
}

export function CoverageHeatmap({ data, loading = false, sampleData = false }: CoverageHeatmapProps) {
  const reduceMotion = useReducedMotion();
  if (loading) {
    return <p className="text-sm text-ui-text-muted">Loading regional coverage...</p>;
  }

  if (!data.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 8, scale: reduceMotion ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.25, type: reduceMotion ? 'tween' : 'spring', bounce: 0.2 }}
        className="rounded-lg border border-dashed border-ui-border bg-ui-bg p-5 text-center text-sm text-ui-text-muted"
      >
        No regional data yet. Stats will appear once health workers begin recording under your programs.
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <div key={item.state} className="rounded-lg border border-ui-border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ui-text">{item.state}</span>
              <span className="font-semibold text-ui-text-muted">{item.coverage}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-100">
              <div
                className={`h-2 rounded-full ${coverageColor(item.coverage)} transition-all`}
                style={{ width: `${item.coverage}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-ui-text-muted">
              {item.vaccinated} synced of {item.total} records
            </p>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-ui-text-muted">
        Regional DTP3 coverage rates · Source: VITE field data{sampleData ? ' (Sample data)' : ''}
      </p>
    </div>
  );
}
