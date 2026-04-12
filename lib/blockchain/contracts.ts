import { v4 as uuidv4 } from 'uuid';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function makeTxHash(): string {
  const raw = `${uuidv4().replace(/-/g, '')}${uuidv4().replace(/-/g, '')}`;
  return `0x${raw.slice(0, 64)}`;
}

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

  async fundEscrow(
    _programId: string,
    _amount: number,
    _donorAddress: string
  ): Promise<{ txHash: string }> {
    await delay(2000);
    return { txHash: makeTxHash() };
  },
};

