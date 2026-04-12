import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db/schema';
import { buildMerkleTree } from '@/lib/utils/merkle';
import { VaccinationRecordContract, GrantEscrow } from '@/lib/blockchain/contracts';
import { DEMO_VACCINE_LOTS } from '@/lib/seed/demo';
import { sendSMS } from '@/lib/notifications/sms';
import { scheduleReminder } from '@/lib/notifications/reminders';
import type { AuthSession, SyncResult } from '@/types';

export async function runSync(session: AuthSession): Promise<SyncResult> {
  const errors: string[] = [];
  let grantsReleased = 0;
  const notifications: string[] = [];

  const pendingVaccinations = await db.vaccinations.where('syncStatus').equals('pending').toArray();
  const pendingPatients = await db.patients.where('syncStatus').equals('pending').toArray();

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

  const flagged: string[] = [];
  for (const record of pendingVaccinations) {
    const lot = DEMO_VACCINE_LOTS.find((item) => item.lotNumber === record.lotNumber);
    if (!lot) {
      flagged.push(record.id);
      await db.vaccinations.update(record.id, { syncStatus: 'flagged' });
      errors.push(`Lot ${record.lotNumber} not in registry - record ${record.id} flagged`);
    }
  }

  const validRecords = pendingVaccinations.filter((record) => !flagged.includes(record.id));

  if (validRecords.length === 0 && pendingPatients.length === 0) {
    return {
      success: false,
      batchId: 'flagged-all',
      recordCount: 0,
      merkleRoot: '0x0',
      grantsReleased: 0,
      errors,
    };
  }

  const { root, leaves } = buildMerkleTree(validRecords);
  const batchId = uuidv4();

  const { txHash } = await VaccinationRecordContract.submitBatch(
    root,
    validRecords.length,
    batchId,
    session.userId
  );

  for (const record of validRecords) {
    await db.vaccinations.update(record.id, {
      syncStatus: 'synced',
      xionTxHash: txHash,
    });
  }

  await db.patients.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });

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

  for (const record of validRecords) {
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

    const { txHash: grantTx } = await GrantEscrow.releaseTranche(
      patient.programId,
      patient.id,
      milestone.id,
      milestone.grantAmount
    );

    const releaseId = uuidv4();
    await db.grantReleases.put({
      id: releaseId,
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

    const updatedMilestones = program.milestones.map((item) =>
      item.id === milestone.id
        ? { ...item, completedCount: item.completedCount + 1 }
        : item
    );

    await db.programs.update(patient.programId, {
      milestones: updatedMilestones,
      totalReleased: (program.totalReleased || 0) + milestone.grantAmount,
    });

    await sendSMS(
      patient.parentPhone,
      `VITE Health: $${milestone.grantAmount} has been added to your account for ${patient.name}'s ${milestone.name} vaccination. Reply REDEEM to transfer to your OPay account.`,
      'milestone-payment'
    );

    const nextMilestone = program.milestones.find(
      (item) =>
        item.vaccineName === record.vaccineName &&
        item.doseNumber === record.doseNumber + 1
    );

    if (nextMilestone) {
      const dueDate = new Date(record.dateAdministered);
      dueDate.setDate(dueDate.getDate() + 42);
      await scheduleReminder(patient, nextMilestone, dueDate.toISOString());
    }

    notifications.push(`Grant $${milestone.grantAmount} released to ${patient.name}`);
  }

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

