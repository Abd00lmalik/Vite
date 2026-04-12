'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SyncBadge } from './SyncBadge';
import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { db } from '@/lib/db/schema';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import type { Dispute } from '@/types';

interface DisputePanelProps {
  dispute: Dispute;
  onUpdate?: () => void;
}

export function DisputePanel({ dispute, onUpdate }: DisputePanelProps) {
  const [resolution, setResolution] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async () => {
    if (!resolution.trim()) {
      toast.error('Please enter a resolution');
      return;
    }

    setIsResolving(true);
    try {
      await db.disputes.update(dispute.id, {
        status: 'resolved',
        resolution: resolution.trim(),
      });
      toast.success('Dispute resolved');
      onUpdate?.();
    } catch {
      toast.error('Failed to resolve dispute');
    } finally {
      setIsResolving(false);
    }
  };

  const statusConfig = {
    open: { badge: 'flagged' as const, color: 'text-red-600' },
    'under-review': { badge: 'pending' as const, color: 'text-amber-600' },
    resolved: { badge: 'synced' as const, color: 'text-green-600' },
  };

  const config = statusConfig[dispute.status];

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">Dispute Alert</CardTitle>
          </div>
          <SyncBadge status={config.badge} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dispute details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Record ID:</span>
            <span className="font-mono text-xs">{dispute.recordId}</span>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-1">Reason:</p>
            <p className="text-sm text-muted-foreground">{dispute.reason}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-1">Evidence:</p>
            <p className="text-sm text-muted-foreground bg-white/50 p-2 rounded border">
              {dispute.evidence}
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Raised: {format(new Date(dispute.createdAt), 'MMM d, yyyy')}
          </p>
        </div>

        {/* Resolution section */}
        {dispute.status === 'resolved' ? (
          <div className="flex items-start gap-2 p-3 bg-green-100 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Resolved</p>
              <p className="text-sm text-green-700">{dispute.resolution}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              placeholder="Enter resolution details..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={2}
              className="bg-white"
            />
            <Button
              onClick={handleResolve}
              disabled={isResolving}
              className="w-full bg-[#007B83] hover:bg-[#005A61] text-white"
            >
              {isResolving ? 'Resolving...' : 'Resolve Dispute'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

