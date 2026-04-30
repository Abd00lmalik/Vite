import { XION, xionConfig, explorerTxUrl } from './config';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { toUtf8 } from '@cosmjs/encoding';
import { getXionSubmitter } from './signer-adapter';

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

function findXionLikeValues(obj: unknown, path = ""): Array<{ path: string; value: string }> {
  const found: Array<{ path: string; value: string }> = [];

  if (typeof obj === "string" && obj.startsWith("xion1")) {
    found.push({ path, value: obj });
  } else if (Array.isArray(obj)) {
    obj.forEach((v, i) => found.push(...findXionLikeValues(v, `${path}[${i}]`)));
  } else if (obj && typeof obj === "object") {
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
      found.push(...findXionLikeValues(v, path ? `${path}.${k}` : k));
    });
  }

  return found;
}

const allowedAddressPaths = [
  "submit_batch.submitter",
  "check_and_release.patient_addr",
  "fund_program.sender",
  "worker_addr",
  "sender",
  "submitter"
];

export async function txSubmitBatch({
  signingClient,
  senderAddress,
  batchId,
  merkleRoot,
  recordCount,
  clinicId
}: TxSubmitBatchArgs): Promise<TxResult> {
  assertKnownContractTarget(XION.contracts.vaccinationRecord, 'vaccinationRecord');
  
  const isSession = Boolean(signingClient?.session);
  console.log("[XION TX STAGE]", {
    stage: 'txSubmitBatch',
    senderAddress,
    contractTarget: XION.contracts.vaccinationRecord,
    contractRole: 'vaccinationRecord',
    requiresUserSignature: true,
    signingMode: isSession ? 'abstraxion_session' : 'direct',
    manualPromptExpected: !isSession,
  });

  console.log("[XION EXECUTE START]", {
    role: "vaccinationRecord",
    senderAddress,
    contractAddress: XION.contracts.vaccinationRecord,
    msg: {
      submit_batch: {
        batch_id:     batchId,
        merkle_root:  merkleRoot,
        record_count: recordCount,
        submitter:    senderAddress,
        clinic_id:    clinicId,
      },
    },
  });

  const msg = {
    submit_batch: {
      batch_id:     batchId,
      merkle_root:  merkleRoot,
      record_count: recordCount,
      submitter:    senderAddress,
      clinic_id:    clinicId,
    },
  };

  console.log("[FINAL EXECUTE MSG FULL]", JSON.stringify({
    senderAddress,
    contractAddress: XION.contracts.vaccinationRecord,
    msg,
  }, null, 2));

  // Step 5: Log recursive scan
  console.log("[FINAL XION VALUE SCAN]", findXionLikeValues(msg).map(v => {
    // Basic classification for the scan log
    const lower = v.value.toLowerCase();
    let role = "unknown";
    if (lower === senderAddress.toLowerCase()) role = "sender/submitter";
    else if (lower === XION.contracts.vaccinationRecord.toLowerCase()) role = "contract";
    
    return {
      ...v,
      role,
      allowed: allowedAddressPaths.some(p => v.path.endsWith(p)),
    };
  }));

  // Step 1: Resolve the proper signing adapter
  const adapter = getXionSubmitter(signingClient);
  
  console.log("[XION SIGNING MODE RESOLVED]", {
    adapterMode: adapter.mode,
    signingClientType: signingClient?.constructor?.name ?? typeof signingClient,
    signerAddress: (signingClient as any)?.signer?.address,
  });

  if (adapter.mode === "unsupported" || adapter.mode === "session_requires_feegrant") {
    throw new Error(`XION Sync failed: ${adapter.reason}`);
  }

  // Step 6: Hard guard for sensitive addresses
  const suspicious = findXionLikeValues(msg);
  for (const { path, value } of suspicious) {
    if (!allowedAddressPaths.some(p => path.endsWith(p))) {
      throw new Error(`[FATAL] Unauthorized XION address in payload at ${path}`);
    }
  }

  try {
    const res = await adapter.execute({
      signingClient,
      senderAddress,
      contractAddress: XION.contracts.vaccinationRecord,
      msg,
    });

    console.log("[XION EXECUTE RESULT]", {
      role: "vaccinationRecord",
      result: res,
    });

    return {
      txHash:      res.transactionHash,
      height:      res.height,
      explorerUrl: explorerTxUrl(res.transactionHash),
    };
  } catch (error: any) {
    console.error("[XION EXECUTE ERROR]", error);
    throw error;
  }
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

  const isSession = Boolean(signingClient?.session);
  console.log("[XION TX STAGE]", {
    stage: 'txCheckAndRelease',
    senderAddress,
    contractTarget: XION.contracts.milestoneChecker,
    contractRole: 'milestoneChecker',
    requiresUserSignature: true,
    signingMode: isSession ? 'abstraxion_session' : 'direct',
    manualPromptExpected: !isSession,
  });

  console.log("[XION EXECUTE START]", {
    role: "milestoneChecker",
    senderAddress,
  });

  const msg = {
    check_and_release: {
      patient_addr: patientAddr,
      patient_id:   patientId,
      vaccine_name: vaccineName,
      dose_number:  doseNumber,
      program_id:   programId,
      batch_id:     batchId,
    },
  };

  const adapter = getXionSubmitter(signingClient);

  if (adapter.mode === "unsupported" || adapter.mode === "session_requires_feegrant") {
    throw new Error(`XION Sync failed: ${adapter.reason}`);
  }

  try {
    const res = await adapter.execute({
      signingClient,
      senderAddress,
      contractAddress: XION.contracts.milestoneChecker,
      msg,
    });

    console.log("[XION EXECUTE RESULT]", {
      role: "milestoneChecker",
      result: res,
    });

    return {
      txHash:      res.transactionHash,
      height:      res.height,
      explorerUrl: explorerTxUrl(res.transactionHash),
    };
  } catch (error: any) {
    console.error("[XION EXECUTE ERROR]", error);
    throw error;
  }
}

// ── GrantEscrow ───────────────────────────────────────────────────────────

export async function txFundProgram(
  signingClient: any,
  senderAddress: string,
  programId: string,
  amountUxion: string       // e.g. "1000000" for 1 XION
): Promise<TxResult> {
  assertKnownContractTarget(XION.contracts.grantEscrow, 'grantEscrow');
  const adapter = getXionSubmitter(signingClient);
  if (adapter.mode === "unsupported" || adapter.mode === "session_requires_feegrant") {
    throw new Error(`XION Sync failed: ${adapter.reason}`);
  }

  const res = await adapter.execute({
    signingClient,
    senderAddress,
    contractAddress: XION.contracts.grantEscrow,
    msg: { fund_program: { program_id: programId } },
  });
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



