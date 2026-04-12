'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

type BadgeStatus = 'synced' | 'pending' | 'flagged' | 'online' | 'offline';

interface SyncBadgeProps {
  status: BadgeStatus;
  className?: string;
}

const badgeConfig: Record<
  BadgeStatus,
  { bg: string; text: string; label: string; Icon: typeof CheckCircle2 }
> = {
  synced: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Synced',
    Icon: CheckCircle2,
  },
  pending: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    label: 'Pending Sync',
    Icon: Clock,
  },
  flagged: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Flagged',
    Icon: AlertTriangle,
  },
  online: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Online',
    Icon: Wifi,
  },
  offline: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    label: 'Offline',
    Icon: WifiOff,
  },
};

export function SyncBadge({ status, className }: SyncBadgeProps) {
  const config = badgeConfig[status];
  const { Icon } = config;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

