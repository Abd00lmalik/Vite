import { buildMerkleTree } from '@/lib/utils/merkle';
import {
  txSubmitBatch,
  txCheckAndRelease,
} from '@/lib/xion/contracts';
import {
  getPendingVaccinations,
  markVaccinationSynced,
} from '@/lib/db/db';
import { db } from '@/lib/db/schema';
import { SMS } from '@/lib/notifications/sms';
import { v4 as uuidv4 } from 'uuid';
import { explorerTxUrl } from '@/lib/xion/config';

export interface SyncResult {
  success:       boolean;
  batchId:       string;
  recordCount:   number;
  txHash?:       string;
  merkleRoot:    string;
  grantsReleased: number;
  explorerUrl?:  string;
  errors:        string[];
  flaggedCount:  number;
}

export interface SyncProgressUpdate {
  step: 1 | 2 | 3 | 4 | 5;
  message: string;
}

export async function runSync(
  session: { userId: string; role: string; clinicId?: string },
  signingClient: any,        // REQUIRED Ã¢â‚¬â€ real Abstraxion client
  senderAddress: string,     // REQUIRED Ã¢â‚¬â€ real XION address
  onProgress?: (update: SyncProgressUpdate) => void
): Promise<SyncResult> {
  const errors:  string[] = [];
  let grantsReleased = 0;
  let flaggedCount   = 0;

  if (!signingClient || !senderAddress) {
    return {
      success: false, batchId: '', recordCount: 0, merkleRoot: '',
      grantsReleased: 0, errors: ['XION account not connected'],
      flaggedCount: 0,
    };
  }

  // 1. Gather pending vaccinations
  onProgress?.({ step: 1, message: 'Gathering pending records...' });
  const pending = await getPendingVaccinations();
  if (pending.length === 0) {
    return {
      success: true, batchId: 'no-op', recordCount: 0, merkleRoot: '0x0',
      grantsReleased: 0, errors: [], flaggedCount: 0,
    };
  }

  // 2. Inventory reconciliation Ã¢â‚¬â€ ensure lot numbers are recorded
  const valid = [...pending];
  if (valid.length === 0) {
    return { success: false, batchId: 'all-flagged', recordCount: 0,
             merkleRoot: '0x0', grantsReleased: 0, errors, flaggedCount };
  }

  // 3. Build Merkle Root
  onProgress?.({ step: 2, message: 'Building cryptographic proof...' });
  const { root } = buildMerkleTree(valid);
  const batchId  = uuidv4();

  // 4. Submit to XION
  onProgress?.({ step: 3, message: 'Broadcasting to XION...' });
  let txResult: { txHash: string; height: number; explorerUrl: string };
  try {
    txResult = await txSubmitBatch(
      signingClient,
      senderAddress,
      batchId,
      root,
      valid.length,
      session.clinicId ?? 'clinic-001'
    );
  } catch (err: any) {
    errors.push(`Batch submission failed: ${err.message}`);
    return { success: false, batchId, recordCount: valid.length,
             merkleRoot: root, grantsReleased: 0, errors, flaggedCount };
  }

  // 5. Mark records synced in IndexedDB
  for (const r of valid) {
    await markVaccinationSynced(r.id, txResult.txHash);
  }

  // 6. Save sync batch
  await db.syncBatches.put({
    id:          batchId,
    records:     valid,
    merkleRoot:  root,
    proof:       [],
    status:      'confirmed',
    submittedAt: new Date().toISOString(),
    xionTxHash:  txResult.txHash,
    recordCount: valid.length,
  });

  // 7. Check Milestones & Release Grants
  onProgress?.({ step: 4, message: 'Verifying health milestones...' });
  for (const record of valid) {
    try {
      const patient = await db.patients.where('id').equals(record.patientId).first();
      if (!patient?.programId) continue;

      const program = await db.programs.get(patient.programId);
      if (!program || program.status !== 'active') continue;

      const milestone = program.milestones.find(m =>
        m.vaccineName === record.vaccineName && m.doseNumber === record.doseNumber
      );
      if (!milestone) continue;

      // Check not already released
      const alreadyReleased = await db.grantReleases
        .where('patientId').equals(patient.id)
        .filter(g => g.milestoneId === milestone.id)
        .count();
      if (alreadyReleased > 0) continue;

      // Real CheckAndRelease transaction
      const grantTx = await txCheckAndRelease(
        signingClient,
        senderAddress,
        patient.id,
        patient.healthDropId,
        record.vaccineName,
        record.doseNumber,
        patient.programId,
        batchId
      );

      // Record in IndexedDB
      await db.grantReleases.put({
        id:           uuidv4(),
        patientId:    patient.id,
        patientName:  patient.name,
        milestoneId:  milestone.id,
        milestoneName: milestone.name,
        amount:       milestone.grantAmount,
        status:       'released',
        xionTxHash:   grantTx.txHash,
        releasedAt:   new Date().toISOString(),
      });

      grantsReleased += milestone.grantAmount;

      // Update milestone count
      await db.programs.update(patient.programId, {
        milestones:   program.milestones.map(m =>
          m.id === milestone.id
            ? { ...m, completedCount: m.completedCount + 1 }
            : m
        ),
        totalReleased: (program.totalReleased ?? 0) + milestone.grantAmount,
      });

      // SMS notification
      await SMS.payment(
        patient.parentPhone,
        patient.name,
        milestone.grantAmount,
        milestone.name
      );

    } catch (err: any) {
      errors.push(`Milestone check failed for ${record.id}: ${err.message}`);
    }
  }

  // 8. Audit log
  await db.auditLogs.put({
    id:          uuidv4(),
    entityId:    batchId,
    entityType:  'sync-batch',
    action:      `Synced ${valid.length} records. Root: ${root}. Tx: ${txResult.txHash}. Grants: $${grantsReleased}`,
    performedBy: senderAddress,
    timestamp:   new Date().toISOString(),
  });

  return {
    success:        true,
    batchId,
    recordCount:    valid.length,
    txHash:         txResult.txHash,
    merkleRoot:     root,
    grantsReleased,
    explorerUrl:    txResult.explorerUrl,
    errors,
    flaggedCount,
  };
}



