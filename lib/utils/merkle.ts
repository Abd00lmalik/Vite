import CryptoJS from 'crypto-js';
import { MerkleTree } from 'merkletreejs';
import { Buffer } from 'buffer';
import type { VaccinationRecord } from '@/types';

function sha256Hex(value: string): string {
  return CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
}

function toBuffer(value: string): Buffer {
  return Buffer.from(value.replace(/^0x/, ''), 'hex');
}

function serializeRecord(record: VaccinationRecord): string {
  return JSON.stringify({
    id: record.id,
    patientId: record.patientId,
    healthDropId: record.healthDropId,
    vaccineName: record.vaccineName,
    doseNumber: record.doseNumber,
    lotNumber: record.lotNumber,
    administeredBy: record.administeredBy,
    clinicId: record.clinicId,
    dateAdministered: record.dateAdministered,
  });
}

export function buildMerkleTree(records: VaccinationRecord[]) {
  const leafBuffers = records.map((record) => toBuffer(sha256Hex(serializeRecord(record))));
  const tree = new MerkleTree(leafBuffers, (value: Buffer | string) => {
    const hex = Buffer.isBuffer(value) ? value.toString('hex') : value;
    return toBuffer(sha256Hex(hex));
  }, { sortPairs: true });

  const leaves = leafBuffers.map((leaf) => `0x${leaf.toString('hex')}`);
  const rootBuffer = tree.getRoot();

  return {
    root: rootBuffer.length > 0 ? `0x${rootBuffer.toString('hex')}` : '0x0',
    tree,
    leaves,
  };
}

export function getProofForRecord(
  tree: MerkleTree,
  recordOrLeaf: VaccinationRecord | string
): string[] {
  const leafHex =
    typeof recordOrLeaf === 'string'
      ? recordOrLeaf
      : `0x${sha256Hex(serializeRecord(recordOrLeaf))}`;

  return tree.getProof(toBuffer(leafHex)).map((entry) => `0x${entry.data.toString('hex')}`);
}
