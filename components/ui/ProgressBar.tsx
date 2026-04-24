'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const reduceMotion = useReducedMotion();
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-gray-200', className)}>
      <motion.div
        className="h-full rounded-full bg-teal-primary"
        initial={{ width: 0 }}
        animate={{ width: `${safeValue}%` }}
        transition={{ duration: reduceMotion ? 0.01 : 0.35, ease: 'easeOut' }}
      />
    </div>
  );
}




