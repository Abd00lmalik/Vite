import { db } from '@/lib/db/schema';
import type { Milestone, Patient, Program, VaccinationRecord } from '@/types';

export function findNextMilestone(program: Program, vaccinations: VaccinationRecord[]): Milestone | null {
  for (const milestone of program.milestones) {
    const complete = vaccinations.some(
      (record) =>
        record.vaccineName === milestone.vaccineName &&
        record.doseNumber === milestone.doseNumber
    );
    if (!complete) return milestone;
  }
  return null;
}

export async function evaluateMilestoneForPatient(
  patient: Patient,
  vaccineName: string,
  doseNumber: number
): Promise<Milestone | null> {
  if (!patient.programId) return null;
  const program = await db.programs.get(patient.programId);
  if (!program || program.status !== 'active') return null;

  return (
    program.milestones.find(
      (milestone) =>
        milestone.vaccineName === vaccineName && milestone.doseNumber === doseNumber
    ) ?? null
  );
}

