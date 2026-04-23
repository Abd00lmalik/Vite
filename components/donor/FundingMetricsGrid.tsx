'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/ui/StatCard';

interface FundingMetricsGridProps {
  totalReleased: number;
  escrowBalance: number;
  enrolledPatients: number;
  milestonesComplete: number;
}

const weeklyData = [
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
}: FundingMetricsGridProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Enrolled" value={enrolledPatients} />
        <StatCard label="Milestones Complete" value={milestonesComplete} color="green" />
        <StatCard label="Funds Released" value={`$${totalReleased.toFixed(0)}`} color="blue" animate={false} />
        <StatCard label="Escrow Balance" value={`$${escrowBalance.toFixed(0)}`} color="amber" animate={false} />
      </div>

      <div className="h-60 rounded-xl border border-gray-200 bg-white p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            {/* @ts-ignore */}
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="released" stroke="#007B83" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}




