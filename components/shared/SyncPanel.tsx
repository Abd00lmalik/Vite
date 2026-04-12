'use client';

import { useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useSync } from '@/hooks/useSync';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function SyncPanel() {
  const { sync, isSyncing, lastResult, lastSyncTime, pendingCount } = useSync();
  const isOnline = useOfflineStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      if (wasOffline.current && pendingCount > 0) {
        sync();
      }
      wasOffline.current = false;
    };

    const handleOffline = () => {
      wasOffline.current = true;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingCount, sync]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? 'active' : 'offline'}>{isOnline ? 'Online' : 'Offline'}</Badge>
          <Badge variant={pendingCount > 0 ? 'pending' : 'synced'}>{pendingCount} pending</Badge>
        </div>
        <Button type="button" onClick={sync} loading={isSyncing} className="w-full sm:w-auto">
          <RefreshCw className={isSyncing ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Last sync: {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Not synced yet'}
      </div>
      {lastResult ? (
        <div className="mt-2 text-sm text-gray-700">
          {lastResult.recordCount} record(s) synced | ${lastResult.grantsReleased} grant(s) released
          {lastResult.txHash ? ` | Tx ${lastResult.txHash.slice(0, 8)}...` : ''}
        </div>
      ) : null}
    </div>
  );
}


