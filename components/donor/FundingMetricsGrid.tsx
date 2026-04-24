'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, useReducedMotion } from 'framer-motion';
import { StatCard } from '@/components/ui/StatCard';

interface WeeklyReleasePoint {
  week: string;
  released: number;
}

interface FundingMetricsGridProps {
  totalReleased: number;
  escrowBalance: number;
  enrolledPatients: number;
  milestonesComplete: number;
  weeklySeries: WeeklyReleasePoint[];
  loading?: boolean;
  sampleData?: boolean;
}

const sampleSeries: WeeklyReleasePoint[] = [
  { week: 'W1', released: 15 },
  { week: 'W2', released: 22 },
  { week: 'W3', released: 30 },
  { week: 'W4', released: 41 },
  { week: 'W5', released: 58 },
];

export function FundingMetricsGrid({
  totalReleased,
  escrowBalance,
  enrolledPatients,
  milestonesComplete,
  weeklySeries,
  loading = false,
  sampleData = false,
}: FundingMetricsGridProps) {
  const reduceMotion = useReducedMotion();
  const chartData = weeklySeries.length ? weeklySeries : sampleData ? sampleSeries : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Enrolled" value={enrolledPatients} />
        <StatCard label="Milestones Complete" value={milestonesComplete} color="green" />
        <StatCard label="Funds Released" value={`$${totalReleased.toFixed(0)}`} color="blue" animate={false} />
        <StatCard label="Escrow Balance" value={`$${escrowBalance.toFixed(0)}`} color="amber" animate={false} />
      </div>

      <div className="h-60 rounded-xl border border-gray-200 bg-white p-3">
        {loading ? (
          <p className="flex h-full items-center justify-center text-sm text-gray-500">
            Loading release trend...
          </p>
        ) : chartData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              {/* @ts-ignore */}
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="released" stroke="#007B83" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8, scale: reduceMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.25, type: reduceMotion ? 'tween' : 'spring', bounce: 0.2 }}
            className="flex h-full items-center justify-center text-center text-sm text-gray-500"
          >
            No transaction history yet. Release trend will appear once grants are disbursed.
          </motion.div>
        )}
      </div>
      {sampleData ? <p className="text-xs text-ui-text-muted">Sample data shown for demo account.</p> : null}
    </div>
  );
}
