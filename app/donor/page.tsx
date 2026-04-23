'use client';

import dynamic from 'next/dynamic';
import { FullPageSkeleton } from '@/components/shared/FullPageSkeleton';

export default dynamic(() => import('@/components/pages/DonorPage'), {
  ssr: false,
  loading: () => <FullPageSkeleton role="donor" />,
});





