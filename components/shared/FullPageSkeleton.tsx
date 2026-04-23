'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface FullPageSkeletonProps {
  role?: 'health-worker' | 'donor' | 'patient';
}

export function FullPageSkeleton({ role = 'health-worker' }: FullPageSkeletonProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton variant="card" className="h-20" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Skeleton variant="stat-card" />
          <Skeleton variant="stat-card" />
          <Skeleton variant="stat-card" />
          <Skeleton variant="stat-card" />
        </div>
        <Skeleton variant="card" className={role === 'donor' ? 'h-72' : 'h-56'} />
        <Skeleton variant="card" className="h-72" />
      </div>
    </div>
  );
}





