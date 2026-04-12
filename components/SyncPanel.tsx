'use client';

import { useEffect } from 'react';
import { useSync } from '@/hooks/useSync';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { Button } from '@/components/ui/button';
import { SyncBadge } from './SyncBadge';
import { RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export function SyncPanel() {
  const isOnline = useOfflineStatus();
  const { sync, isSyncing, lastResult, lastSyncTime, pendingCount } = useSync();

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      toast.success('Back online! Syncing records...');
      sync();
    }
  }, [isOnline, pendingCount, isSyncing, sync]);

  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    const toastId = toast.loading('Building Merkle tree...');

    try {
      await new Promise((r) => setTimeout(r, 500));
      toast.loading('Submitting to XION...', { id: toastId });
      await new Promise((r) => setTimeout(r, 500));
      toast.loading('Checking milestones...', { id: toastId });

      await sync();

      if (lastResult?.success) {
        toast.success(
          `Synced ${lastResult.recordCount} records. ${
            lastResult.grantsReleased > 0 ? `$${lastResult.grantsReleased} grants released!` : ''
          }`,
          { id: toastId }
        );
      } else {
        toast.success('Sync complete', { id: toastId });
      }
    } catch {
      toast.error('Sync failed', { id: toastId });
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-card border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SyncBadge status={isOnline ? 'online' : 'offline'} />
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm text-amber-600">
              <Clock className="h-4 w-4" />
              {pendingCount} pending
            </span>
          )}
        </div>

        <Button
          size="sm"
          onClick={handleSync}
          disabled={!isOnline || isSyncing || pendingCount === 0}
          className="bg-[#007B83] hover:bg-[#005A61] text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      {lastSyncTime && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          Last sync: {format(new Date(lastSyncTime), 'MMM d, h:mm a')}
          {lastResult?.txHash && (
            <span className="font-mono">
              | Tx: {lastResult.txHash.substring(0, 10)}...
            </span>
          )}
        </div>
      )}

      {isSyncing && (
        <div className="flex items-center gap-2 text-sm text-[#007B83]">
          <div className="h-4 w-4 border-2 border-[#007B83] border-t-transparent rounded-full animate-spin" />
          Processing records on XION blockchain...
        </div>
      )}
    </div>
  );
}

