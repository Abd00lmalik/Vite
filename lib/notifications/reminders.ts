import { db } from '@/lib/db/schema';
import { SMS } from './sms';
import type { Milestone, Patient } from '@/types';

export async function scheduleReminder(
  patient: Patient,
  nextMilestone: Milestone,
  dueDate: string
): Promise<void> {
  await db.notifications.put({
    id: `reminder-${patient.id}-${nextMilestone.id}`,
    userId: patient.userId ?? patient.id,
    type: 'reminder',
    message: `${patient.name} is due for ${nextMilestone.vaccineName} Dose ${nextMilestone.doseNumber} by ${new Date(dueDate).toLocaleDateString()}`,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export async function sendDueReminders(): Promise<void> {
  const patients = await db.patients.where('programId').notEqual('').toArray();

  for (const patient of patients) {
    const program = patient.programId ? await db.programs.get(patient.programId) : null;
    if (!program) continue;

    const vaccinations = await db.vaccinations.where('patientId').equals(patient.id).toArray();

    for (const milestone of program.milestones) {
      const completed = vaccinations.find(
        (record) =>
          record.vaccineName === milestone.vaccineName && record.doseNumber === milestone.doseNumber
      );
      if (completed) continue;

      const prevDose = vaccinations.find(
        (record) =>
          record.vaccineName === milestone.vaccineName &&
          record.doseNumber === milestone.doseNumber - 1
      );

      if (!prevDose) continue;

      const daysSince =
        (Date.now() - new Date(prevDose.dateAdministered).getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince >= 35) {
        const dueDate = new Date(prevDose.dateAdministered);
        dueDate.setDate(dueDate.getDate() + 42);

        const link = `vite.health/record/${patient.healthDropId}`;
        await SMS.reminder(
          patient.parentPhone,
          patient.name,
          milestone.vaccineName,
          dueDate.toLocaleDateString('en-NG'),
          link
        );
      }
    }
  }
}

