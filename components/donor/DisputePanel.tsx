'use client';

import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { db } from '@/lib/db/schema';
import { SMS } from '@/lib/notifications/sms';
import type { Dispute } from '@/types';

interface DisputePanelProps {
  disputes: Dispute[];
}

export function DisputePanel({ disputes }: DisputePanelProps) {
  const session = useAuthStore((state) => state.session);

  async function resolveDispute(disputeId: string, resolution: 'approved' | 'rejected') {
    await db.disputes.update(disputeId, {
      status: 'resolved',
      resolution:
        resolution === 'approved'
          ? 'Record approved - payment released'
          : 'Record rejected - payment withheld',
    });

    await db.auditLogs.put({
      id: uuidv4(),
      entityId: disputeId,
      entityType: 'dispute',
      action: `Dispute ${resolution} by program manager`,
      performedBy: session?.userId ?? 'donor',
      timestamp: new Date().toISOString(),
    });

    await SMS.dispute('+2348000000000', disputeId, resolution === 'approved' ? 'Approved' : 'Rejected');
    toast.success(`Dispute ${resolution}`);
  }

  async function escalateDispute(disputeId: string) {
    await db.disputes.update(disputeId, { status: 'under-review' });
    await db.auditLogs.put({
      id: uuidv4(),
      entityId: disputeId,
      entityType: 'dispute',
      action: 'Dispute escalated for further review',
      performedBy: session?.userId ?? 'donor',
      timestamp: new Date().toISOString(),
    });
    toast.success('Dispute escalated');
  }

  if (!disputes.length) {
    return <p className="text-sm text-gray-500">No open disputes.</p>;
  }

  return (
    <div className="space-y-3">
      {disputes.map((dispute) => (
        <Card key={dispute.id}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Record {dispute.recordId}</p>
                <p className="text-xs text-gray-600">{dispute.reason}</p>
              </div>
              <Badge
                variant={
                  dispute.status === 'resolved'
                    ? 'synced'
                    : dispute.status === 'under-review'
                      ? 'pending'
                      : 'flagged'
                }
              >
                {dispute.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-700">Evidence: {dispute.evidence}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button type="button" className="w-full" onClick={() => resolveDispute(dispute.id, 'approved')}>
                Approve
              </Button>
              <Button
                type="button"
                variant="danger"
                className="w-full"
                onClick={() => resolveDispute(dispute.id, 'rejected')}
              >
                Reject
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => escalateDispute(dispute.id)}>
                Escalate
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}



