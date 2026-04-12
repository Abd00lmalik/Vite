import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  variant?: 'text' | 'card' | 'table-row' | 'stat-card';
  className?: string;
}

export function Skeleton({ variant = 'text', className }: SkeletonProps) {
  if (variant === 'card') {
    return <div className={cn('h-36 w-full animate-pulse rounded-xl bg-gray-200', className)} />;
  }

  if (variant === 'table-row') {
    return (
      <div className={cn('grid h-10 w-full grid-cols-4 animate-pulse gap-3', className)}>
        <div className="rounded bg-gray-200" />
        <div className="rounded bg-gray-200" />
        <div className="rounded bg-gray-200" />
        <div className="rounded bg-gray-200" />
      </div>
    );
  }

  if (variant === 'stat-card') {
    return <div className={cn('h-28 w-full animate-pulse rounded-xl border border-gray-200 bg-gray-100', className)} />;
  }

  return <div className={cn('h-4 w-32 animate-pulse rounded bg-gray-200', className)} />;
}

