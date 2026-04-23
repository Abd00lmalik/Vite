'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton variant="text" className="h-8 w-56" />
      <Skeleton variant="stat-card" />
      <Skeleton variant="card" />
      <Skeleton variant="table-row" />
      <Skeleton variant="table-row" />
    </div>
  );
}





