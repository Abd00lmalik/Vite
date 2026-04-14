import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db/schema';
import { getPendingPatients, getPendingVaccinations } from '@/lib/db/db';
import { buildMerkleTree } from '@/lib/utils/merkle';
import { GrantEscrow, MilestoneChecker, VaccinationRecordContract } from '@/lib/blockchain/contracts';
import { DEMO_VACCINE_LOTS } from '@/lib/seed/demo';
import { sendSMS } from '@/lib/notifications/sms';
import { scheduleReminder } from '@/lib/notifications/reminders';
import type { AuthSession, SyncResult } from '@/types';

export type SyncProgressUpdate =
  | 'Gathering pending records...'
  | 'Running stock reconciliation...'
  | 'Building Merkle tree...'
  | 'Submitting batch to XION...'
  | 'Marking records as synced...'
  | 'Checking milestones...'
  | 'Releasing grants...'
  | 'Sending SMS notifications...'
  | 'Writing audit log...'
  | 'Sync complete.';

export async function runSync(
  session: AuthSession,
  onProgress?: (step: SyncProgressUpdate) => void
): Promise<SyncResult> {
  const errors: string[] = [];
  let grantsReleased = 0;
  const notifications: string[] = [];
  const progress = (step: SyncProgressUpdate) => onProgress?.(step);

  // PHASE 1: Gather all pending records from IndexedDB
  progress('Gathering pending records...');
  const pendingVaccinations = await getPendingVaccinations();
  const pendingPatients = await getPendingPatients();

  if (pendingVaccinations.length === 0 && pendingPatients.length === 0) {
    return {
      success: true,
      batchId: 'no-op',
      recordCount: 0,
      merkleRoot: '0x0',
      grantsReleased: 0,
      errors: [],
    };
  }

  // PHASE 2: Stock reconciliation check
  progress('Running stock reconciliation...');
  const flagged: string[] = [];
  for (const record of pendingVaccinations) {
    const lot = DEMO_VACCINE_LOTS.find((item) => item.lotNumber === record.lotNumber);
    if (!lot) {
      flagged.push(record.id);
      await db.vaccinations.update(record.id, { syncStatus: 'flagged' });
      errors.push(`Lot ${record.lotNumber} not in registry - record ${record.id} flagged`);
    }
  }

  // PHASE 3: Build Merkle tree for unflagged records
  progress('Building Merkle tree...');
  const validRecords = pendingVaccinations.filter((record) => !flagged.includes(record.id));
  if (validRecords.length === 0 && pendingPatients.length === 0) {
    return {
      success: false,
      batchId: 'flagged-all',
      recordCount: 0,
      merkleRoot: '0x0',
      grantsReleased: 0,
      errors,
      flaggedCount: flagged.length,
    };
  }

  const { root, leaves } = buildMerkleTree(validRecords);
  const batchId = uuidv4();

  // PHASE 4: Submit batch
  progress('Submitting batch to XION...');
  const { txHash } = await VaccinationRecordContract.submitBatch(
    root,
    validRecords.length,
    batchId,
    session.userId
  );

  // PHASE 5: Mark records as synced
  progress('Marking records as synced...');
  for (const record of validRecords) {
    await db.vaccinations.update(record.id, {
      syncStatus: 'synced',
      xionTxHash: txHash,
    });
  }
  await db.patients.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });

  // PHASE 6: Save sync batch
  await db.syncBatches.put({
    id: batchId,
    records: validRecords,
    merkleRoot: root,
    proof: leaves,
    status: 'confirmed',
    submittedAt: new Date().toISOString(),
    xionTxHash: txHash,
    recordCount: validRecords.length,
  });

  // PHASE 7+: Milestone + release pipeline per record
  progress('Checking milestones...');
  for (const record of validRecords) {
    const patient = await db.patients.get(record.patientId);
    if (!patient?.programId) continue;

    const program = await db.programs.get(patient.programId);
    if (!program || program.status !== 'active') continue;

    const milestoneCheck = await MilestoneChecker.checkMilestone(
      patient.id,
      record.vaccineName,
      record.doseNumber,
      program.id
    );
    if (!milestoneCheck.satisfied) continue;

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

    progress('Releasing grants...');
    const { txHash: grantTx } = await GrantEscrow.releaseTranche(
      patient.programId,
      patient.id,
      milestone.id,
      milestone.grantAmount
    );

    await db.grantReleases.put({
      id: uuidv4(),
      patientId: patient.id,
      patientName: patient.name,
      milestoneId: milestone.id,
      milestoneName: milestone.name,
      amount: milestone.grantAmount,
      status: 'released',
      xionTxHash: grantTx,
      releasedAt: new Date().toISOString(),
    });

    grantsReleased += milestone.grantAmount;

    await db.programs.update(patient.programId, {
      milestones: program.milestones.map((item) =>
        item.id === milestone.id
          ? { ...item, completedCount: item.completedCount + 1 }
          : item
      ),
      totalReleased: (program.totalReleased || 0) + milestone.grantAmount,
    });

    progress('Sending SMS notifications...');
    await sendSMS(
      patient.parentPhone,
      `VITE Health: $${milestone.grantAmount} has been added to your account for ${patient.name}'s ${milestone.name} vaccination. Reply REDEEM to transfer to your OPay account.`,
      'milestone-payment'
    );

    const nextMilestone = program.milestones.find(
      (item) => item.vaccineName === record.vaccineName && item.doseNumber === record.doseNumber + 1
    );
    if (nextMilestone) {
      const dueDate = new Date(record.dateAdministered);
      dueDate.setDate(dueDate.getDate() + 42);
      await scheduleReminder(patient, nextMilestone, dueDate.toISOString());
    }

    notifications.push(`Grant $${milestone.grantAmount} released to ${patient.name}`);
  }

  // PHASE 13: Audit log
  progress('Writing audit log...');
  await db.auditLogs.put({
    id: uuidv4(),
    entityId: batchId,
    entityType: 'sync-batch',
    action: `Synced ${validRecords.length} records. Merkle root: ${root}. Grants released: $${grantsReleased}`,
    performedBy: session.userId,
    timestamp: new Date().toISOString(),
  });

  if (notifications.length > 0) {
    await db.notifications.put({
      id: uuidv4(),
      userId: session.userId,
      type: 'sync',
      read: false,
      message: notifications.join(' | '),
      createdAt: new Date().toISOString(),
    });
  }

  progress('Sync complete.');
  return {
    success: true,
    batchId,
    recordCount: validRecords.length,
    txHash,
    merkleRoot: root,
    grantsReleased,
    errors,
    flaggedCount: flagged.length,
  };
}
