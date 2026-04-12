'use client';

import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
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
  const updateStatus = async (dispute: Dispute, status: Dispute['status']) => {
    await db.disputes.update(dispute.id, { status });

    await db.auditLogs.put({
      id: uuidv4(),
      entityId: dispute.id,
      entityType: 'dispute',
      action: `Dispute ${dispute.id} moved to ${status}`,
      performedBy: 'donor-action',
      timestamp: new Date().toISOString(),
    });

    await SMS.dispute('+2348000000000', dispute.recordId, dispute.reason);
    toast.success(`Dispute updated: ${status}`);
  };

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
              <Badge variant={dispute.status === 'resolved' ? 'synced' : dispute.status === 'under-review' ? 'pending' : 'flagged'}>
                {dispute.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-700">Evidence: {dispute.evidence}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button type="button" className="w-full" onClick={() => updateStatus(dispute, 'resolved')}>
                Approve
              </Button>
              <Button type="button" variant="danger" className="w-full" onClick={() => updateStatus(dispute, 'open')}>
                Reject
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => updateStatus(dispute, 'under-review')}>
                Escalate
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


