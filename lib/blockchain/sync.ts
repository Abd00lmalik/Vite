import { v4 as uuidv4 } from 'uuid';
import { buildMerkleTree } from '@/lib/utils/merkle';
import { db } from '@/lib/db/schema';
import { explorerTxUrl } from '@/lib/xion/config';
import { txCheckAndRelease, txSubmitBatch } from '@/lib/xion/contracts';
import { getPendingPatients, getPendingVaccinations, markPatientSynced, markVaccinationSynced } from '@/lib/db/db';
import { SMS } from '@/lib/notifications/sms';
import { scheduleReminder } from '@/lib/notifications/reminders';
import { INITIAL_VACCINE_LOTS } from '@/lib/seed/initialData';
import type { SyncResult } from '@/types';

export interface SyncProgressUpdate {
  step: 1 | 2 | 3 | 4 | 5;
  message: string;
}

function mockTxHash(seed: string): string {
  const raw = `${seed.replace(/[^a-zA-Z0-9]/g, '')}${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  return `0x${raw.padEnd(64, 'a').slice(0, 64)}`;
}

function canUseOnChain(signingClient: any, senderAddress: string): boolean {
  return Boolean(signingClient && senderAddress);
}

export async function runSync(
  session: { userId: string; role: string; clinicId?: string },
  signingClient: any,
  senderAddress: string,
  onProgress?: (update: SyncProgressUpdate) => void
): Promise<SyncResult> {
  const errors: string[] = [];
  let grantsReleased = 0;
  let flaggedCount = 0;

  const clinicId = session.clinicId ?? `clinic-${session.userId.slice(0, 6)}`;
  const onChain = canUseOnChain(signingClient, senderAddress);

  onProgress?.({ step: 1, message: 'Gathering pending records...' });
  const [pendingVaccinations, pendingPatients] = await Promise.all([
    getPendingVaccinations(clinicId),
    getPendingPatients(clinicId),
  ]);

  if (pendingVaccinations.length === 0 && pendingPatients.length === 0) {
    return {
      success: true,
      batchId: 'no-op',
      recordCount: 0,
      merkleRoot: '0x0',
      grantsReleased: 0,
      errors: [],
      flaggedCount: 0,
      mode: onChain ? 'onchain' : 'simulated',
    };
  }

  const lotRegistry = new Set(INITIAL_VACCINE_LOTS.map((lot) => lot.lotNumber));
  const validVaccinations = pendingVaccinations.filter((record) => {
    const isKnownLot = lotRegistry.has(record.lotNumber);
    if (!isKnownLot) {
      flaggedCount += 1;
      errors.push(`Unknown lot number flagged: ${record.lotNumber} (${record.id})`);
    }
    return isKnownLot;
  });

  if (validVaccinations.length === 0) {
    return {
      success: false,
      batchId: 'all-flagged',
      recordCount: 0,
      merkleRoot: '0x0',
      grantsReleased: 0,
      errors,
      flaggedCount,
      mode: onChain ? 'onchain' : 'simulated',
    };
  }

  onProgress?.({ step: 2, message: 'Building cryptographic proof...' });
  const { root } = buildMerkleTree(validVaccinations);
  const batchId = uuidv4();

  onProgress?.({ step: 3, message: onChain ? 'Broadcasting to XION...' : 'Running simulated sync...' });

  let txHash = mockTxHash(batchId);
  let explorerUrl: string | undefined;

  if (onChain) {
    try {
      const tx = await txSubmitBatch(
        signingClient,
        senderAddress,
        batchId,
        root,
        validVaccinations.length,
        clinicId
      );
      txHash = tx.txHash;
      explorerUrl = tx.explorerUrl;
    } catch (error: any) {
      errors.push(`Batch submission failed: ${error?.message ?? 'Unknown on-chain error'}`);
      return {
        success: false,
        batchId,
        recordCount: validVaccinations.length,
        txHash,
        merkleRoot: root,
        grantsReleased: 0,
        errors,
        flaggedCount,
        mode: 'onchain',
      };
    }
  }

  for (const record of validVaccinations) {
    await markVaccinationSynced(record.id, txHash);
  }

  for (const patient of pendingPatients) {
    await markPatientSynced(patient.id);
  }

  await db.syncBatches.put({
    id: batchId,
    records: validVaccinations,
    merkleRoot: root,
    proof: [],
    status: onChain ? 'confirmed' : 'submitted',
    submittedAt: new Date().toISOString(),
    xionTxHash: txHash,
    recordCount: validVaccinations.length,
  });

  onProgress?.({ step: 4, message: 'Verifying milestones and releasing grants...' });

  for (const record of validVaccinations) {
    try {
      const patient = await db.patients.get(record.patientId);
      if (!patient?.programId) continue;

      const program = await db.programs.get(patient.programId);
      if (!program || program.status !== 'active') continue;

      const milestone = program.milestones.find(
        (item) => item.vaccineName === record.vaccineName && item.doseNumber === record.doseNumber
      );
      if (!milestone) continue;

      const alreadyReleased = await db.grantReleases
        .where('patientId')
        .equals(patient.id)
        .filter((grant) => grant.milestoneId === milestone.id)
        .count();
      if (alreadyReleased > 0) continue;

      let grantTxHash = mockTxHash(`${patient.id}-${milestone.id}`);

      if (onChain) {
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
        grantTxHash = grantTx.txHash;
      }

      await db.grantReleases.put({
        id: uuidv4(),
        patientId: patient.id,
        patientName: patient.name,
        milestoneId: milestone.id,
        milestoneName: milestone.name,
        amount: milestone.grantAmount,
        status: 'released',
        xionTxHash: grantTxHash,
        releasedAt: new Date().toISOString(),
      });

      grantsReleased += milestone.grantAmount;

      await db.programs.update(patient.programId, {
        milestones: program.milestones.map((item) =>
          item.id === milestone.id
            ? { ...item, completedCount: item.completedCount + 1, pendingCount: Math.max(0, item.pendingCount - 1) }
            : item
        ),
        totalReleased: (program.totalReleased ?? 0) + milestone.grantAmount,
      });

      await SMS.payment(patient.parentPhone, patient.name, milestone.grantAmount, milestone.name);

      const nextMilestone = program.milestones
        .filter((item) => item.vaccineName === record.vaccineName && item.doseNumber > record.doseNumber)
        .sort((a, b) => a.doseNumber - b.doseNumber)[0];

      if (nextMilestone) {
        const dueDate = new Date(record.dateAdministered);
        dueDate.setDate(dueDate.getDate() + 42);
        await scheduleReminder(patient, nextMilestone, dueDate.toISOString());
      }
    } catch (error: any) {
      errors.push(`Milestone processing failed for ${record.id}: ${error?.message ?? 'Unknown error'}`);
    }
  }

  onProgress?.({ step: 5, message: 'Finalizing audit trail...' });

  await db.auditLogs.put({
    id: uuidv4(),
    entityId: batchId,
    entityType: 'sync-batch',
    action: `Synced ${validVaccinations.length} records (${onChain ? 'on-chain' : 'simulated'}). Root: ${root}. Tx: ${txHash}. Grants: $${grantsReleased}`,
    performedBy: onChain ? senderAddress : session.userId,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    batchId,
    recordCount: validVaccinations.length,
    txHash,
    explorerUrl: explorerUrl ?? explorerTxUrl(txHash),
    merkleRoot: root,
    grantsReleased,
    errors,
    flaggedCount,
    mode: onChain ? 'onchain' : 'simulated',
  };
}
