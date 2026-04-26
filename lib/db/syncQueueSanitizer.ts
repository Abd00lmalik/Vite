import { db } from './schema';
import { scopedStorage } from '@/lib/storage/scopedStorage';
import {
  classifyAddress,
  extractAddressFields,
  type AddressFieldMatch,
} from '@/lib/xion/addressTypes';
import { XION } from '@/lib/xion/config';
import type { SyncQueueItem } from '@/types';

export interface QuarantinedSyncRecord {
  record: SyncQueueItem;
  reason: string;
  quarantinedAt: string;
}

const QUARANTINE_COLLECTION = 'sync_queue_quarantine';

function resolveQueueOwner(record: SyncQueueItem): string | undefined {
  return record.ownerUserId ?? record.userId;
}

function resolveEmbeddedOwner(record: SyncQueueItem): string | undefined {
  if (!record.data || typeof record.data !== 'object') return undefined;
  const data = record.data as Record<string, unknown>;
  const ownerUserId =
    typeof data.ownerUserId === 'string'
      ? data.ownerUserId
      : typeof data.administeredBy === 'string'
      ? data.administeredBy
      : typeof data.registeredBy === 'string'
      ? data.registeredBy
      : undefined;
  return ownerUserId;
}

function readQuarantineStore(userId: string): QuarantinedSyncRecord[] {
  return scopedStorage.get<QuarantinedSyncRecord[]>(userId, QUARANTINE_COLLECTION) ?? [];
}

function appendQuarantineStore(userId: string, records: QuarantinedSyncRecord[]): void {
  if (!records.length) return;
  const existing = readQuarantineStore(userId);
  scopedStorage.set(userId, QUARANTINE_COLLECTION, [...existing, ...records]);
}

function isDemoQueueRecord(record: SyncQueueItem): boolean {
  if (record.isDemo) return true;
  if (!record.data || typeof record.data !== 'object') return false;
  const data = record.data as Record<string, unknown>;
  return data.isDemo === true;
}

function getAddressMatches(record: SyncQueueItem): AddressFieldMatch[] {
  const rootPayload = {
    ...record,
    data: record.data ?? {},
  };
  return extractAddressFields(rootPayload, 'queueItem');
}

export async function sanitizeSyncQueue(
  userId: string,
  options: { isDemoUser: boolean }
): Promise<{ safeCount: number; quarantinedCount: number; reasons: string[] }> {
  const pending = await db.syncQueue.where('status').equals('pending').toArray();
  const mine = pending.filter((record) => resolveQueueOwner(record) === userId);

  const quarantined: QuarantinedSyncRecord[] = [];
  const reasons: string[] = [];
  let safeCount = 0;

  for (const record of mine) {
    let reason: string | null = null;
    const embeddedOwner = resolveEmbeddedOwner(record);

    if (embeddedOwner && embeddedOwner !== userId) {
      reason = 'belongs to different account';
    } else if (!options.isDemoUser && isDemoQueueRecord(record)) {
      reason = 'demo record in real sync queue';
    } else if (!options.isDemoUser) {
      const addressMatches = getAddressMatches(record);
      for (const match of addressMatches) {
        const classified = classifyAddress(match.address, {
          connectedWallet: undefined,
          contractAddresses: XION.contracts,
          isDemoRecord: record.isDemo,
        });
        if (classified.role === 'demo') {
          reason = `demo address in ${match.field}`;
          break;
        }
      }
    }

    if (reason) {
      quarantined.push({
        record,
        reason,
        quarantinedAt: new Date().toISOString(),
      });
      reasons.push(`Record ${record.id}: ${reason}`);
      continue;
    }

    safeCount += 1;
  }

  if (quarantined.length > 0) {
    await Promise.all(
      quarantined.map((item) =>
        db.syncQueue.update(item.record.id, {
          status: 'failed',
          error: `quarantined: ${item.reason}`,
        })
      )
    );
    appendQuarantineStore(userId, quarantined);
    console.warn(`[SyncQueue] Quarantined ${quarantined.length} invalid records for user ${userId}`);
  }

  return {
    safeCount,
    quarantinedCount: quarantined.length,
    reasons,
  };
}

export function getSyncQueueQuarantine(userId: string): QuarantinedSyncRecord[] {
  return readQuarantineStore(userId);
}

export function clearSyncQueueQuarantine(userId: string): void {
  scopedStorage.set(userId, QUARANTINE_COLLECTION, []);
}

