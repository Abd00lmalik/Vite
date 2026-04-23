import { XION, explorerTxUrl } from './config';

// Ã¢â€â‚¬Ã¢â€â‚¬ Types Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export interface TxResult {
  txHash:    string;
  height:    number;
  explorerUrl: string;
}

// Ã¢â€â‚¬Ã¢â€â‚¬ IssuerRegistry Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export async function queryIsCredentialed(
  queryClient: any,
  address: string
): Promise<boolean> {
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

// Ã¢â€â‚¬Ã¢â€â‚¬ VaccinationRecord Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export async function txSubmitBatch(
  signingClient: any,
  senderAddress: string,
  batchId: string,
  merkleRoot: string,
  recordCount: number,
  clinicId: string
): Promise<TxResult> {
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
  return queryClient.queryContractSmart(
    XION.contracts.vaccinationRecord,
    { get_batch: { batch_id: batchId } }
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ MilestoneChecker Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export async function txCheckAndRelease(
  signingClient: any,
  senderAddress: string,
  patientAddr: string,
  patientId: string,
  vaccineName: string,
  doseNumber: number,
  programId: string,
  batchId: string
): Promise<TxResult> {
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

// Ã¢â€â‚¬Ã¢â€â‚¬ GrantEscrow Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export async function txFundProgram(
  signingClient: any,
  senderAddress: string,
  programId: string,
  amountUxion: string       // e.g. "1000000" for 1 XION
): Promise<TxResult> {
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
  const res = await queryClient.queryContractSmart(
    XION.contracts.grantEscrow,
    { grant_history: { program_id: programId, limit: 50 } }
  );
  return res.grants as any[];
}



