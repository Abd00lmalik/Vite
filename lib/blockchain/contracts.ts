import { v4 as uuidv4 } from 'uuid';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function makeTxHash(): string {
  const raw = `${uuidv4().replace(/-/g, '')}${uuidv4().replace(/-/g, '')}`;
  return `0x${raw.slice(0, 64)}`;
}

// XION TESTNET INTEGRATION NOTE:
// These are mock interfaces for demo purposes.
// In Phase 2, replace each function body with real CosmWasm calls using:
//   @cosmjs/cosmwasm-stargate - for contract execution
//   RPC endpoint: https://rpc.xion-testnet-1.burnt.com
//   Contract addresses will be deployed to XION testnet
//   Each mock function signature matches the real contract ABI exactly
export const XION_TESTNET_RPC = 'https://rpc.xion-testnet-1.burnt.com';
export const XION_CONTRACTS = {
  IssuerRegistry: 'xion1issuerregistry000000000000000000demo',
  VaccinationRecord: 'xion1vaccinationrecord00000000000000demo',
  MilestoneChecker: 'xion1milestonechecker0000000000000000demo',
  GrantEscrow: 'xion1grantescrow000000000000000000000demo',
};

const credentialedWorkers = new Map<string, { clinicId: string; credentialedAt: string }>();
const escrowBalances = new Map<string, number>();
const totalReleasedByProgram = new Map<string, number>();

export const IssuerRegistry = {
  async isCredentialed(address: string): Promise<boolean> {
    await delay(300);
    return credentialedWorkers.has(address);
  },

  async credentialWorker(
    workerAddress: string,
    clinicId: string,
    _adminAddress: string
  ): Promise<{ txHash: string }> {
    await delay(900);
    credentialedWorkers.set(workerAddress, {
      clinicId,
      credentialedAt: new Date().toISOString(),
    });
    return { txHash: makeTxHash() };
  },

  async revokeWorker(workerAddress: string): Promise<{ txHash: string }> {
    await delay(900);
    credentialedWorkers.delete(workerAddress);
    return { txHash: makeTxHash() };
  },
};

export const VaccinationRecordContract = {
  async submitBatch(
    _merkleRoot: string,
    _recordCount: number,
    _batchId: string,
    _submitterAddress: string
  ): Promise<{ txHash: string; blockHeight: number }> {
    await delay(1200);
    return {
      txHash: makeTxHash(),
      blockHeight: 5_000_000 + Math.floor(Math.random() * 20000),
    };
  },

  async verifyRecord(
    merkleRoot: string,
    recordHash: string,
    proof: string[]
  ): Promise<boolean> {
    await delay(550);
    return Boolean(merkleRoot && merkleRoot.startsWith('0x')) &&
      Boolean(recordHash && recordHash.startsWith('0x')) &&
      Array.isArray(proof);
  },
};

export const MilestoneChecker = {
  async checkMilestone(
    _patientId: string,
    vaccineName: string,
    doseNumber: number,
    programId: string
  ): Promise<{ satisfied: boolean; milestoneId?: string; grantAmount?: number }> {
    await delay(700);
    if (!programId || !vaccineName || doseNumber < 1) {
      return { satisfied: false };
    }

    const normalized = vaccineName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return {
      satisfied: true,
      milestoneId: `milestone-${normalized}-${doseNumber}`,
      grantAmount: doseNumber >= 3 ? 5 : 3,
    };
  },
};

export const GrantEscrow = {
  async getBalance(programId: string): Promise<number> {
    await delay(350);
    return escrowBalances.get(programId) ?? 0;
  },

  async releaseTranche(
    programId: string,
    _patientAddress: string,
    _milestoneId: string,
    amount: number
  ): Promise<{ txHash: string; released: number }> {
    await delay(850);

    const currentBalance = escrowBalances.get(programId) ?? 0;
    escrowBalances.set(programId, Math.max(0, currentBalance - amount));
    totalReleasedByProgram.set(
      programId,
      (totalReleasedByProgram.get(programId) ?? 0) + amount
    );

    return {
      txHash: makeTxHash(),
      released: amount,
    };
  },

  async getTotalReleased(programId: string): Promise<number> {
    await delay(350);
    return totalReleasedByProgram.get(programId) ?? 0;
  },

  async fundEscrow(
    programId: string,
    amount: number,
    _donorAddress: string
  ): Promise<{ txHash: string }> {
    await delay(2000);
    escrowBalances.set(programId, (escrowBalances.get(programId) ?? 0) + amount);
    return { txHash: makeTxHash() };
  },
};

// Backward-compatible aliases used across the codebase.
export const IssuerRegistryContract = IssuerRegistry;

export const MilestoneCheckerContract = {
  async evaluateMilestones(
    programId: string,
    _batchId: string,
    _actor: string
  ): Promise<{ txHash: string; programId: string }> {
    await delay(700);
    return {
      txHash: makeTxHash(),
      programId,
    };
  },
};
