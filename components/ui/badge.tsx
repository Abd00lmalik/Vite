import { cn } from '@/lib/utils/cn';

interface BadgeProps {
  variant?: 'synced' | 'pending' | 'flagged' | 'offline' | 'active' | 'simulated' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'active', children, className }: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    synced: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    flagged: 'bg-red-100 text-red-700',
    offline: 'bg-gray-200 text-gray-700',
    active: 'bg-blue-100 text-blue-700',
    simulated: 'bg-purple-100 text-purple-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}




