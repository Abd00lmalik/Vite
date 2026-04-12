import CryptoJS from 'crypto-js';
import type { VaccinationRecord } from '@/types';

function sha256(input: string): string {
  return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
}

function pairwiseHash(nodes: string[]): string[] {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) return nodes;

  const nextLevel: string[] = [];
  for (let index = 0; index < nodes.length; index += 2) {
    const left = nodes[index];
    const right = nodes[index + 1] ?? nodes[index];
    const ordered = [left, right].sort();
    nextLevel.push(sha256(`${ordered[0]}${ordered[1]}`));
  }
  return nextLevel;
}

export function buildMerkleTree(records: VaccinationRecord[]) {
  const leaves = records.map((record) =>
    sha256(
      JSON.stringify({
        id: record.id,
        patientId: record.patientId,
        vaccineName: record.vaccineName,
        doseNumber: record.doseNumber,
        lotNumber: record.lotNumber,
        administeredBy: record.administeredBy,
        dateAdministered: record.dateAdministered,
      })
    )
  );

  if (leaves.length === 0) {
    return { root: '0x0', tree: [] as string[][], leaves };
  }

  const tree: string[][] = [leaves];
  let currentLevel = leaves;

  while (currentLevel.length > 1) {
    currentLevel = pairwiseHash(currentLevel);
    tree.push(currentLevel);
  }

  return {
    root: `0x${currentLevel[0]}`,
    tree,
    leaves,
  };
}

