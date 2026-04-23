'use client';

import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  return (
    <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">
      <WifiOff className="h-4 w-4" />
      Offline mode active. Records will sync when connection returns.
    </div>
  );
}




