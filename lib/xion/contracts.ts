import { XION, xionConfig, explorerTxUrl } from './config';

function assertKnownContractTarget(address: string, role: string) {
  const knownContracts = {
    vaccinationRecord: xionConfig.contracts.vaccinationRecord,
    milestoneChecker: xionConfig.contracts.milestoneChecker,
    issuerRegistry: xionConfig.contracts.issuerRegistry,
    grantEscrow: xionConfig.contracts.grantEscrow,
  };

  const expected = knownContracts[role as keyof typeof knownContracts];

  if (!expected) {
    throw new Error(`[XION CONTRACT BUG] Unknown contract role: ${role}`);
  }

  if (address !== expected) {
    throw new Error(
      `[XION CONTRACT BUG] ${role} contract target mismatch. ` +
      `Expected ${expected}, received ${address}. ` +
      `This means a non-contract address was passed into a contract call.`
    );
  }
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface TxResult {
  txHash:    string;
  height:    number;
  explorerUrl: string;
}

// ── IssuerRegistry ────────────────────────────────────────────────────────

export async function queryIsCredentialed(
  queryClient: any,
  address: string
): Promise<boolean> {
  assertKnownContractTarget(XION.contracts.issuerRegistry, 'issuerRegistry');
  const res = await queryClient.queryContractSmart(
    XION.contracts.issuerRegistry,
    { is_credentialed: { address } }
  );
  return res.credentialed as boolean;
}

export async function txCredentialWorker(
  signingClient: any,
  senderAddress: string,
  workerAddr: string,
  clinicId: string,
  clinicName: string
): Promise<TxResult> {
  assertKnownContractTarget(XION.contracts.issuerRegistry, 'issuerRegistry');
  const res = await signingClient.execute(
    senderAddress,
    XION.contracts.issuerRegistry,
    {
      credential_worker: {
        worker_addr: workerAddr,
        clinic_id:   clinicId,
        clinic_name: clinicName,
      },
    },
    'auto'
  );
  return {
    txHash:      res.transactionHash,
    height:      res.height,
    explorerUrl: explorerTxUrl(res.transactionHash),
  };
}

export async function txRevokeWorker(
  signingClient: any,
  senderAddress: string,
  workerAddr: string
): Promise<TxResult> {
  assertKnownContractTarget(XION.contracts.issuerRegistry, 'issuerRegistry');
  const res = await signingClient.execute(
    senderAddress,
    XION.contracts.issuerRegistry,
    { revoke_worker: { worker_addr: workerAddr } },
    'auto'
  );
  return {
    txHash:      res.transactionHash,
    height:      res.height,
    explorerUrl: explorerTxUrl(res.transactionHash),
  };
}

// ── VaccinationRecord ─────────────────────────────────────────────────────

export interface TxSubmitBatchArgs {
  signingClient: any;
  senderAddress: string;
  batchId: string;
  merkleRoot: string;
  recordCount: number;
  clinicId: string;
}

export async function txSubmitBatch({
  signingClient,
  senderAddress,
  batchId,
  merkleRoot,
  recordCount,
  clinicId
}: TxSubmitBatchArgs): Promise<TxResult> {
  assertKnownContractTarget(XION.contracts.vaccinationRecord, 'vaccinationRecord');
  
  console.log("[XION TX STAGE]", {
    stage: 'txSubmitBatch',
    senderAddress,
    contractTarget: XION.contracts.vaccinationRecord,
    contractRole: 'vaccinationRecord',
    requiresUserSignature: typeof signingClient?.signAndBroadcast === 'function',
    signingMode: signingClient?.session ? 'abstraxion_session' : 'direct',
  });

  const res = await signingClient.execute(
    senderAddress,
    XION.contracts.vaccinationRecord,
    {
      submit_batch: {
        batch_id:     batchId,
        merkle_root:  merkleRoot,
        record_count: recordCount,
        submitter:    senderAddress,
        clinic_id:    clinicId,
      },
    },
    'auto'
  );
  return {
    txHash:      res.transactionHash,
    height:      res.height,
    explorerUrl: explorerTxUrl(res.transactionHash),
  };
}

export async function queryBatch(
  queryClient: any,
  batchId: string
): Promise<any> {
  assertKnownContractTarget(XION.contracts.vaccinationRecord, 'vaccinationRecord');
  return queryClient.queryContractSmart(
    XION.contracts.vaccinationRecord,
    { get_batch: { batch_id: batchId } }
  );
}

// ── MilestoneChecker ──────────────────────────────────────────────────────

export interface TxCheckAndReleaseArgs {
  signingClient: any;
  senderAddress: string;
  patientAddr: string;
  patientId: string;
  vaccineName: string;
  doseNumber: number;
  programId: string;
  batchId: string;
}

export async function txCheckAndRelease({
  signingClient,
  senderAddress,
  patientAddr,
  patientId,
  vaccineName,
  doseNumber,
  programId,
  batchId
}: TxCheckAndReleaseArgs): Promise<TxResult> {
  assertKnownContractTarget(XION.contracts.milestoneChecker, 'milestoneChecker');

  console.log("[XION TX STAGE]", {
    stage: 'txCheckAndRelease',
    senderAddress,
    contractTarget: XION.contracts.milestoneChecker,
    contractRole: 'milestoneChecker',
    requiresUserSignature: typeof signingClient?.signAndBroadcast === 'function',
    signingMode: signingClient?.session ? 'abstraxion_session' : 'direct',
  });

  const res = await signingClient.execute(
    senderAddress,
    XION.contracts.milestoneChecker,
    {
      check_and_release: {
        patient_addr: patientAddr,
        patient_id:   patientId,
        vaccine_name: vaccineName,
        dose_number:  doseNumber,
        program_id:   programId,
        batch_id:     batchId,
      },
    },
    'auto'
  );
  return {
    txHash:      res.transactionHash,
    height:      res.height,
    explorerUrl: explorerTxUrl(res.transactionHash),
  };
}

// ── GrantEscrow ───────────────────────────────────────────────────────────

export async function txFundProgram(
  signingClient: any,
  senderAddress: string,
  programId: string,
  amountUxion: string       // e.g. "1000000" for 1 XION
): Promise<TxResult> {
  assertKnownContractTarget(XION.contracts.grantEscrow, 'grantEscrow');
  const res = await signingClient.execute(
    senderAddress,
    XION.contracts.grantEscrow,
    { fund_program: { program_id: programId } },
    'auto',
    undefined,
    [{ denom: 'uxion', amount: amountUxion }]
  );
  return {
    txHash:      res.transactionHash,
    height:      res.height,
    explorerUrl: explorerTxUrl(res.transactionHash),
  };
}

export async function queryProgramBalance(
  queryClient: any,
  programId: string
): Promise<string> {
  assertKnownContractTarget(XION.contracts.grantEscrow, 'grantEscrow');
  const res = await queryClient.queryContractSmart(
    XION.contracts.grantEscrow,
    { program_balance: { program_id: programId } }
  );
  return res.balance as string;
}

export async function queryGrantHistory(
  queryClient: any,
  programId: string
): Promise<any[]> {
  assertKnownContractTarget(XION.contracts.grantEscrow, 'grantEscrow');
  const res = await queryClient.queryContractSmart(
    XION.contracts.grantEscrow,
    { grant_history: { program_id: programId, limit: 50 } }
  );
  return res.grants as any[];
}



