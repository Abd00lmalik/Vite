import { v4 as uuidv4 } from 'uuid';
import { buildMerkleTree } from '@/lib/utils/merkle';
import { db } from '@/lib/db/schema';
import { XION, explorerTxUrl, isSyncConfigured, XION_RUNTIME } from '@/lib/xion/config';
import { txCheckAndRelease, txSubmitBatch } from '@/lib/xion/contracts';
import {
  ensureSyncQueueEntry,
  getPendingPatients,
  getPendingSyncQueueForUser,
  getPendingVaccinations,
  markPatientSynced,
  markSyncQueueSynced,
  markVaccinationSynced,
} from '@/lib/db/db';
import { SMS } from '@/lib/notifications/sms';
import { scheduleReminder } from '@/lib/notifications/reminders';
import { INITIAL_VACCINE_LOTS } from '@/lib/seed/initialData';
import { isDemoSession } from '@/lib/auth/demo';
import {
  formatAccountNotInitializedMessage,
  runSyncPreflight,
  requiredSyncGasUxion,
} from '@/lib/xion/preflight';
import type { Patient, SyncResult, VaccinationRecord } from '@/types';

export interface SyncProgressUpdate {
  step: 1 | 2 | 3 | 4 | 5;
  message: string;
}

interface SyncAddressValidationResult {
  valid: boolean;
  fatalErrors: string[];
  warnings: string[];
  validRecords: VaccinationRecord[];
  foreignRecords: VaccinationRecord[];
}

function mockTxHash(seed: string): string {
  const raw = `${seed.replace(/[^a-zA-Z0-9]/g, '')}${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  return `0x${raw.padEnd(64, 'a').slice(0, 64)}`;
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return JSON.stringify(error);
}

type SyncErrorStage = 'preflight' | 'submit' | 'milestone' | 'unknown';

function isLikelyXionAddress(value?: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim();
  return /^xion1[0-9a-z]{38,}$/.test(normalized);
}

function classifySyncError(
  rawError: string,
  context: { contractName?: string; address?: string; stage?: SyncErrorStage } = {}
): string {
  const message = rawError.toLowerCase();

  if (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('timeout') ||
    message.includes('econn')
  ) {
    return 'Could not reach XION network. Check your connection.';
  }

  if (context.stage === 'preflight' && message.includes('account') && message.includes('not found')) {
    return formatAccountNotInitializedMessage(context.address);
  }

  if (message.includes('account') && message.includes('not found')) {
    const addressMatch = rawError.match(/account\s+(xion1[0-9a-z]+)/i);
    if (addressMatch?.[1]) {
      return `Account ${addressMatch[1]} does not exist on XION Testnet-2. This address may be stale or uninitialized.`;
    }
    if (context.contractName) {
      return `${context.contractName} contract was not found on-chain. Verify the contract address in your environment configuration.`;
    }
    if (context.address) {
      return `Account ${context.address} does not exist on XION Testnet-2. This address may be stale or uninitialized.`;
    }
    return 'An account required for sync was not found on-chain. Check your contract configuration.';
  }

  if (message.includes('unauthorized')) {
    return 'Sync was rejected by the contract. Your wallet may not be registered as an authorized issuer.';
  }

  if (
    message.includes('insufficient') &&
    (message.includes('uxion') || message.includes('gas') || message.includes('fee') || message.includes('fund'))
  ) {
    return 'Insufficient UXION balance for gas fees.';
  }

  if (message.includes('execute wasm contract failed')) {
    return `Contract execution failed: ${rawError}`;
  }

  if (message.includes('rpc error') || message.includes('contract')) {
    return `Contract error: ${rawError}`;
  }

  return `Sync failed: ${rawError}`;
}

function mapSyncError(
  error: unknown,
  context: { senderAddress?: string; stage?: SyncErrorStage; contractName?: string; address?: string } = {}
): string {
  const raw = normalizeErrorMessage(error);
  return classifySyncError(raw, {
    contractName: context.contractName,
    address: context.address ?? context.senderAddress,
    stage: context.stage,
  });
}

function resolveVaccinationOwner(
  record: Pick<VaccinationRecord, 'ownerUserId' | 'administeredBy'>
): string {
  return record.ownerUserId ?? record.administeredBy;
}

async function resolvePatientPayoutAddress(patient: Patient): Promise<string | null> {
  if (!patient.userId) return null;
  const linkedUser = await db.users.get(patient.userId);
  const walletAddress = linkedUser?.walletAddress?.trim();
  if (!walletAddress || !isLikelyXionAddress(walletAddress)) return null;
  return walletAddress;
}

async function validateSyncAddresses(
  pendingRecords: VaccinationRecord[],
  contracts: typeof XION.contracts,
  currentUserId: string,
  enforceContractChecks: boolean
): Promise<SyncAddressValidationResult> {
  const fatalErrors: string[] = [];
  const warnings: string[] = [];

  if (enforceContractChecks) {
    const contractChecks = [
      { name: 'VaccinationRecord', address: contracts.vaccinationRecord },
      { name: 'MilestoneChecker', address: contracts.milestoneChecker },
      { name: 'IssuerRegistry', address: contracts.issuerRegistry },
      { name: 'GrantEscrow', address: contracts.grantEscrow },
    ];

    for (const { name, address } of contractChecks) {
      if (!isLikelyXionAddress(address)) {
        fatalErrors.push(`${name} contract address is not configured or invalid.`);
      }
    }
  }

  const foreignRecords = pendingRecords.filter((record) => resolveVaccinationOwner(record) !== currentUserId);
  if (foreignRecords.length > 0) {
    warnings.push(
      `One or more pending records contain stale data from a previous session and have been removed from the sync queue (${foreignRecords.length} skipped).`
    );
  }

  const validRecords = pendingRecords.filter((record) => resolveVaccinationOwner(record) === currentUserId);

  return {
    valid: fatalErrors.length === 0,
    fatalErrors,
    warnings,
    validRecords,
    foreignRecords,
  };
}

function failureResult({
  batchId,
  recordCount,
  merkleRoot,
  txHash,
  grantsReleased,
  flaggedCount,
  mode,
  errors,
  blockHeight,
}: {
  batchId: string;
  recordCount: number;
  merkleRoot: string;
  txHash?: string;
  grantsReleased?: number;
  flaggedCount?: number;
  mode: 'onchain' | 'simulated';
  errors: string[];
  blockHeight?: number;
}): SyncResult {
  return {
    success: false,
    batchId,
    recordCount,
    txHash,
    blockHeight,
    merkleRoot,
    grantsReleased: grantsReleased ?? 0,
    errors,
    flaggedCount,
    mode,
  };
}

export async function runSync(
  session: { userId: string; role: string; clinicId?: string; demo?: boolean },
  signingClient: any,
  senderAddress: string,
  onProgress?: (update: SyncProgressUpdate) => void
): Promise<SyncResult> {
  const errors: string[] = [];
  let grantsReleased = 0;
  let flaggedCount = 0;

  const clinicId = session.clinicId ?? `clinic-${session.userId.slice(0, 6)}`;
  const demoAccount = Boolean(session.demo) || isDemoSession({ userId: session.userId } as any);
  const onChain = !demoAccount;

  onProgress?.({ step: 1, message: 'Gathering pending records...' });
  const [pendingQueue, pendingVaccinationsAll, pendingPatients] = await Promise.all([
    getPendingSyncQueueForUser(session.userId),
    getPendingVaccinations({ ownerUserId: session.userId }),
    getPendingPatients({ ownerUserId: session.userId }),
  ]);

  const queuedVaccinationIds = new Set(
    pendingQueue
      .filter((item) => item.type === 'vaccination')
      .map((item) => item.recordId)
  );

  if (pendingVaccinationsAll.length > 0) {
    const missingQueueEntries = pendingVaccinationsAll.filter((record) => !queuedVaccinationIds.has(record.id));
    if (missingQueueEntries.length > 0) {
      await Promise.all(
        missingQueueEntries.map((record) =>
          ensureSyncQueueEntry({
            type: 'vaccination',
            recordId: record.id,
            ownerUserId: session.userId,
            clinicId: record.clinicId,
            patientId: record.patientId,
            data: record,
          })
        )
      );
      for (const record of missingQueueEntries) {
        queuedVaccinationIds.add(record.id);
      }
    }
  }

  const pendingVaccinations =
    queuedVaccinationIds.size > 0
      ? pendingVaccinationsAll.filter((record) => queuedVaccinationIds.has(record.id))
      : pendingVaccinationsAll;

  const addressValidation = await validateSyncAddresses(
    pendingVaccinations,
    XION.contracts,
    session.userId,
    onChain
  );

  if (addressValidation.foreignRecords.length > 0) {
    const staleQueueIds = new Set(addressValidation.foreignRecords.map((record) => record.id));
    const staleQueueItems = pendingQueue.filter(
      (item) => item.type === 'vaccination' && staleQueueIds.has(item.recordId)
    );

    await Promise.all(
      staleQueueItems.map((item) =>
        db.syncQueue.update(item.id, {
          status: 'failed',
          error: 'Stale record from a different session was removed from this sync attempt.',
        })
      )
    );
  }

  if (addressValidation.warnings.length > 0) {
    errors.push(...addressValidation.warnings);
  }

  if (onChain && !addressValidation.valid) {
    return failureResult({
      batchId: 'address-validation-failed',
      recordCount: addressValidation.validRecords.length,
      merkleRoot: '0x0',
      mode: onChain ? 'onchain' : 'simulated',
      errors: [...errors, ...addressValidation.fatalErrors],
    });
  }

  const scopedVaccinations = addressValidation.validRecords;

  if (scopedVaccinations.length === 0 && pendingPatients.length === 0) {
    return {
      success: true,
      batchId: 'no-op',
      recordCount: 0,
      merkleRoot: '0x0',
      grantsReleased: 0,
      errors,
      flaggedCount: 0,
      mode: onChain ? 'onchain' : 'simulated',
    };
  }

  if (onChain) {
    if (!XION_RUNTIME.useRealXion || !isSyncConfigured()) {
      return failureResult({
        batchId: 'config-missing',
        recordCount: scopedVaccinations.length,
        merkleRoot: '0x0',
        mode: 'onchain',
        errors: ['XION configuration is incomplete. Please set all required NEXT_PUBLIC_XION_* variables.'],
      });
    }

    if (!signingClient || !senderAddress) {
      return failureResult({
        batchId: 'wallet-disconnected',
        recordCount: scopedVaccinations.length,
        merkleRoot: '0x0',
        mode: 'onchain',
        errors: ['Wallet is not connected. Connect your XION account before syncing.'],
      });
    }

    onProgress?.({ step: 2, message: 'Checking wallet status on XION...' });
    try {
      const accountPreflight = await runSyncPreflight(senderAddress);
      if (!accountPreflight.accountExists) {
        return failureResult({
          batchId: 'account-not-found',
          recordCount: scopedVaccinations.length,
          merkleRoot: '0x0',
          mode: 'onchain',
          errors: [formatAccountNotInitializedMessage(senderAddress)],
        });
      }

      if (!accountPreflight.hasMinimumBalance) {
        return failureResult({
          batchId: 'insufficient-gas',
          recordCount: scopedVaccinations.length,
          merkleRoot: '0x0',
          mode: 'onchain',
          errors: [
            `Insufficient UXION balance for gas fees. Minimum required: ${requiredSyncGasUxion().toString()} uxion. Current: ${accountPreflight.balanceAmount.toString()} uxion.`,
          ],
        });
      }
    } catch (error) {
      return failureResult({
        batchId: 'preflight-failed',
        recordCount: scopedVaccinations.length,
        merkleRoot: '0x0',
        mode: 'onchain',
        errors: [
          mapSyncError(error, {
            senderAddress,
            stage: 'preflight',
          }),
        ],
      });
    }
  }

  const lotRegistry = new Set(INITIAL_VACCINE_LOTS.map((lot) => lot.lotNumber));
  const validVaccinations = scopedVaccinations.filter((record) => {
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

  onProgress?.({ step: 3, message: 'Building cryptographic proof...' });
  const { root } = buildMerkleTree(validVaccinations);
  const batchId = uuidv4();

  onProgress?.({ step: 4, message: onChain ? 'Broadcasting to XION...' : 'Running demo sync...' });

  let txHash = mockTxHash(batchId);
  let explorerUrl: string | undefined;
  let blockHeight: number | undefined;

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
      blockHeight = tx.height;
    } catch (error: any) {
      errors.push(
        mapSyncError(error, {
          senderAddress,
          stage: 'submit',
          contractName: 'VaccinationRecord',
          address: XION.contracts.vaccinationRecord,
        })
      );
      return failureResult({
        batchId,
        recordCount: validVaccinations.length,
        merkleRoot: root,
        txHash,
        blockHeight,
        errors,
        flaggedCount,
        mode: 'onchain',
      });
    }
  }

  for (const record of validVaccinations) {
    await markVaccinationSynced(record.id, txHash, blockHeight);
  }
  await markSyncQueueSynced(
    session.userId,
    'vaccination',
    validVaccinations.map((record) => record.id)
  );

  for (const patient of pendingPatients) {
    await markPatientSynced(patient.id);
  }
  await markSyncQueueSynced(
    session.userId,
    'patient',
    pendingPatients.map((patient) => patient.id)
  );

  await db.syncBatches.put({
    id: batchId,
    records: validVaccinations,
    merkleRoot: root,
    proof: [],
    status: onChain ? 'confirmed' : 'submitted',
    submittedAt: new Date().toISOString(),
    xionTxHash: txHash,
    blockHeight,
    recordCount: validVaccinations.length,
  });

  onProgress?.({ step: 5, message: 'Verifying milestones and releasing grants...' });
  const payoutAddressReadiness = new Map<string, boolean>();

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
        const patientPayoutAddress = await resolvePatientPayoutAddress(patient);
        if (!patientPayoutAddress) {
          errors.push(
            `Milestone processing skipped for ${record.id}: patient ${patient.healthDropId} has no initialized XION payout wallet linked to this profile.`
          );
          continue;
        }

        if (!payoutAddressReadiness.has(patientPayoutAddress)) {
          try {
            const payoutPreflight = await runSyncPreflight(patientPayoutAddress);
            payoutAddressReadiness.set(patientPayoutAddress, payoutPreflight.accountExists);
          } catch {
            payoutAddressReadiness.set(patientPayoutAddress, false);
          }
        }

        if (!payoutAddressReadiness.get(patientPayoutAddress)) {
          errors.push(
            `Milestone processing skipped for ${record.id}: payout wallet ${patientPayoutAddress} is not initialized on-chain.`
          );
          continue;
        }

        const grantTx = await txCheckAndRelease(
          signingClient,
          senderAddress,
          patientPayoutAddress,
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
      errors.push(
        `Milestone processing failed for ${record.id}: ${mapSyncError(error, {
          senderAddress,
          stage: 'milestone',
          contractName: 'MilestoneChecker',
          address: XION.contracts.milestoneChecker,
        })}`
      );
    }
  }

  await db.auditLogs.put({
    id: uuidv4(),
    entityId: batchId,
    entityType: 'sync-batch',
    action: `Synced ${validVaccinations.length} records (${onChain ? 'on-chain' : 'simulated'}). Root: ${root}. Tx: ${txHash}${blockHeight ? ` @ ${blockHeight}` : ''}. Grants: $${grantsReleased}`,
    performedBy: onChain ? senderAddress : session.userId,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    batchId,
    recordCount: validVaccinations.length,
    txHash,
    blockHeight,
    explorerUrl: explorerUrl ?? explorerTxUrl(txHash),
    merkleRoot: root,
    grantsReleased,
    errors,
    flaggedCount,
    mode: onChain ? 'onchain' : 'simulated',
  };
}
