import { db } from './schema';
import { scopedStorage } from '@/lib/storage/scopedStorage';
import {
  classifyAddress,
  extractAddressFields,
  type AddressFieldMatch,
} from '@/lib/xion/addressTypes';
import { XION } from '@/lib/xion/config';
import type { SyncQueueItem } from '@/types';

// Fields that must NEVER appear in a stored sync record — they indicate a
// previous version of the code baked a contract address into the record at
// write time. The executor now always reads these from xionConfig at runtime.
const CONTRACT_ADDRESS_FIELDS = [
  'contractAddress',
  'vaccinationContract',
  'targetContract',
  'milestoneContract',
  'submittedTo',
  'contract',
  'vaccinationRecordContract',
  'milestoneCheckerContract',
  'issuerContract',
  'grantEscrowAddress',
  'contractTarget',
] as const;

// Identity fields where an xion1 address is expected and safe.
const KNOWN_IDENTITY_FIELDS = [
  'patientIdentityRef',
  'healthWorkerAddress',
  'userId',
  'ownerUserId',
  'administeredBy',
  'registeredBy',
] as const;

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

/**
 * Strips stale contract-address fields from stored sync records and quarantines
 * any record containing unexpected xion1 addresses outside known identity fields.
 *
 * This corrects records written by older app versions that incorrectly stored
 * a contract address (e.g. from a previous Vercel build) inside the queue entry.
 * The sync executor always reads contract addresses from xionConfig at runtime;
 * stored records must contain only health data and identity references.
 *
 * Call this at login and at the start of runSync.
 */
export async function migrateAndCleanSyncQueue(
  userId: string
): Promise<{ cleanedCount: number; quarantinedCount: number; reasons: string[] }> {
  const pending = await db.syncQueue.where('status').equals('pending').toArray();
  const mine = pending.filter(
    (record) => (record.ownerUserId ?? record.userId) === userId
  );

  let cleanedCount = 0;
  let quarantinedCount = 0;
  const reasons: string[] = [];

  for (const record of mine) {
    const stripped = { ...record } as Record<string, unknown>;
    let wasModified = false;

    // Strip known contract-address field names
    for (const field of CONTRACT_ADDRESS_FIELDS) {
      if (field in stripped && stripped[field]) {
        console.warn(
          `[SyncMigration] Stripping contract field "${field}" (value: ${String(stripped[field])}) from record ${record.id}`
        );
        delete stripped[field];
        wasModified = true;
        reasons.push(`Record ${record.id}: removed stale contract field "${field}"`);
      }
    }

    // Also strip from nested data object if present
    if (stripped.data && typeof stripped.data === 'object') {
      const data = { ...(stripped.data as Record<string, unknown>) };
      let dataModified = false;
      for (const field of CONTRACT_ADDRESS_FIELDS) {
        if (field in data && data[field]) {
          console.warn(
            `[SyncMigration] Stripping contract field "data.${field}" from record ${record.id}`
          );
          delete data[field];
          dataModified = true;
          reasons.push(`Record ${record.id}: removed stale contract field "data.${field}"`);
        }
      }
      if (dataModified) {
        stripped.data = data;
        wasModified = true;
      }
    }

    if (wasModified) {
      await db.syncQueue.update(record.id, stripped as Partial<SyncQueueItem>);
      cleanedCount += 1;
    }

    // Flag records with unexpected xion1 addresses outside known identity fields
    const allAddressMatches = extractAddressFields(stripped, 'record');
    const suspiciousMatches = allAddressMatches.filter(({ field }) => {
      const fieldLeaf = field.split('.').pop() ?? field;
      return !(KNOWN_IDENTITY_FIELDS as readonly string[]).includes(fieldLeaf);
    });

    if (suspiciousMatches.length > 0) {
      console.warn(
        `[SyncMigration] Record ${record.id} has unexpected xion1 addresses in non-identity fields:`,
        suspiciousMatches
      );
      // Quarantine — do not delete
      await db.syncQueue.update(record.id, {
        status: 'failed',
        error: `quarantined: unexpected xion1 addresses in fields: ${suspiciousMatches.map((m) => m.field).join(', ')}`,
      });
      appendQuarantineStore(userId, [{
        record,
        reason: `unexpected xion1 addresses: ${suspiciousMatches.map((m) => `${m.field}=${m.address}`).join(', ')}`,
        quarantinedAt: new Date().toISOString(),
      }]);
      quarantinedCount += 1;
      reasons.push(`Record ${record.id}: quarantined for suspicious address fields`);
    }
  }

  return { cleanedCount, quarantinedCount, reasons };
}
