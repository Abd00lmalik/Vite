'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Program } from '@/types';

interface MilestoneProgressChartProps {
  program?: Program;
}

export function MilestoneProgressChart({ program }: MilestoneProgressChartProps) {
  const data = (program?.milestones ?? []).map((milestone) => ({
    stage: milestone.name,
    completed: milestone.completedCount,
    pending: milestone.pendingCount,
  }));

  if (!data.length) {
    return <p className="text-sm text-gray-500">No milestone data yet.</p>;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          {/* @ts-ignore */}
          <XAxis dataKey="stage" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="completed" fill="#007B83" />
          <Bar dataKey="pending" fill="#F4A124" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}




