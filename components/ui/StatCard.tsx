'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  color?: 'teal' | 'green' | 'amber' | 'blue' | 'red';
  animate?: boolean;
}

const colorMap: Record<NonNullable<StatCardProps['color']>, string> = {
  teal: 'border-t-teal-primary',
  green: 'border-t-green-500',
  amber: 'border-t-amber-500',
  blue: 'border-t-blue-500',
  red: 'border-t-red-500',
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  color = 'teal',
  animate = true,
}: StatCardProps) {
  const card = (
    <div className={cn('rounded-xl border border-gray-200 border-t-4 bg-white p-4 shadow-sm', colorMap[color])}>
      <div className="mb-2 flex items-start justify-between">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        {icon ? <div className="text-teal-dark">{icon}</div> : null}
      </div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      {sub ? <div className="text-xs text-gray-500">{sub}</div> : null}
    </div>
  );

  if (!animate || typeof value === 'string') {
    return card;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      {card}
    </motion.div>
  );
}

