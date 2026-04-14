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

export const IssuerRegistryContract = {
  async registerIssuer(
    issuerAddress: string,
    clinicId: string,
    performedBy: string
  ): Promise<{ txHash: string; issuerAddress: string; clinicId: string; performedBy: string }> {
    await delay(900);
    return {
      txHash: makeTxHash(),
      issuerAddress,
      clinicId,
      performedBy,
    };
  },

  async revokeIssuer(
    issuerAddress: string,
    reason: string,
    performedBy: string
  ): Promise<{ txHash: string; issuerAddress: string; reason: string; performedBy: string }> {
    await delay(900);
    return {
      txHash: makeTxHash(),
      issuerAddress,
      reason,
      performedBy,
    };
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
      blockHeight: 5_000_000,
    };
  },
};

export const MilestoneCheckerContract = {
  async evaluateMilestones(
    programId: string,
    batchId: string,
    actor: string
  ): Promise<{ txHash: string; programId: string; batchId: string; actor: string }> {
    await delay(700);
    return {
      txHash: makeTxHash(),
      programId,
      batchId,
      actor,
    };
  },
};

export const GrantEscrow = {
  async releaseTranche(
    _programId: string,
    _patientId: string,
    _milestoneId: string,
    amount: number
  ): Promise<{ txHash: string; released: number }> {
    await delay(800);
    return {
      txHash: makeTxHash(),
      released: amount,
    };
  },

  async fundEscrow(_programId: string, _amount: number, _donorAddress: string): Promise<{ txHash: string }> {
    await delay(2000);
    return { txHash: makeTxHash() };
  },
};
