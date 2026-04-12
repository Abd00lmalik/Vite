'use client';

import { cn } from '@/lib/utils';

interface StatusDotProps {
  status: 'online' | 'offline' | 'synced' | 'pending' | 'flagged';
  className?: string;
  showLabel?: boolean;
}

const statusConfig = {
  online: { color: 'bg-green-500', label: 'Online' },
  offline: { color: 'bg-gray-400', label: 'Offline' },
  synced: { color: 'bg-green-500', label: 'Synced' },
  pending: { color: 'bg-amber-500', label: 'Pending' },
  flagged: { color: 'bg-red-500', label: 'Flagged' },
};

export function StatusDot({ status, className, showLabel = false }: StatusDotProps) {
  const config = statusConfig[status];

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn('h-2.5 w-2.5 rounded-full', config.color, {
          'animate-pulse': status === 'pending',
        })}
      />
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground">{config.label}</span>
      )}
    </span>
  );
}

