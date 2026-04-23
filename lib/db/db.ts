import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import type {
  AuditLog,
  Clinic,
  Dispute,
  GrantRelease,
  Milestone,
  NotificationItem,
  Patient,
  Program,
  SMSLog,
  SyncQueueItem,
  User,
  VaccinationRecord,
} from '@/types';

function buildHealthId(seed: string): string {
  const entropy = `${seed.replace(/-/g, '')}${uuidv4().replace(/-/g, '')}`;
  return `VITE-${entropy.slice(-6).toUpperCase()}`;
}

export async function createUser(user: User): Promise<void> {
  await db.users.put(user);
}

export async function createClinic(clinic: Clinic): Promise<void> {
  await db.clinics.put(clinic);
}

export async function createPatient(
  data: Omit<Patient, 'id' | 'healthDropId' | 'syncStatus' | 'registeredAt'>
): Promise<Patient> {
  const existing = await db.patients.where('parentPhone').equals(data.parentPhone).first();
  if (existing) {
    throw new Error(`Patient already registered with phone ${data.parentPhone}`);
  }

  const id = uuidv4();
  const patient: Patient = {
    ...data,
    id,
    healthDropId: buildHealthId(id),
    syncStatus: 'pending',
    registeredAt: new Date().toISOString(),
  };
  await db.patients.put(patient);
  return patient;
}

export async function upsertPatient(patient: Patient): Promise<void> {
  await db.patients.put(patient);
}

export async function updatePatient(id: string, updates: Partial<Patient>): Promise<void> {
  await db.patients.update(id, updates);
}

export async function getPatientByPhone(phone: string): Promise<Patient | undefined> {
  return db.patients.where('parentPhone').equals(phone).first();
}

export async function getPatientByhealthDropId(healthDropId: string): Promise<Patient | undefined> {
  return db.patients.where('healthDropId').equals(healthDropId).first();
}

export async function getPatientById(id: string): Promise<Patient | undefined> {
  return db.patients.get(id);
}

export async function getPatientsByClinic(clinicId: string): Promise<Patient[]> {
  return db.patients.where('clinicId').equals(clinicId).toArray();
}

export async function getPatientsByProgram(programId: string): Promise<Patient[]> {
  return db.patients.where('programId').equals(programId).toArray();
}

export async function getRecentPatients(limit = 10): Promise<Patient[]> {
  return db.patients.orderBy('registeredAt').reverse().limit(limit).toArray();
}

export async function createVaccination(
  data: Omit<VaccinationRecord, 'id' | 'syncStatus' | 'createdAt'>
): Promise<VaccinationRecord> {
  const record: VaccinationRecord = {
    ...data,
    id: uuidv4(),
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
  };
  await db.vaccinations.put(record);
  return record;
}

export async function upsertVaccination(record: VaccinationRecord): Promise<void> {
  await db.vaccinations.put(record);
}

export async function getVaccinationsByPatient(patientId: string): Promise<VaccinationRecord[]> {
  return db.vaccinations.where('patientId').equals(patientId).sortBy('dateAdministered');
}

export async function getVaccinationsByWorker(workerId: string): Promise<VaccinationRecord[]> {
  return db.vaccinations.where('administeredBy').equals(workerId).toArray();
}

export async function getPendingVaccinations(): Promise<VaccinationRecord[]> {
  return db.vaccinations.where('syncStatus').equals('pending').toArray();
}

export async function getPendingPatients(): Promise<Patient[]> {
  return db.patients.where('syncStatus').equals('pending').toArray();
}

export async function markVaccinationSynced(id: string, txHash: string): Promise<void> {
  await db.vaccinations.update(id, {
    syncStatus: 'synced',
    xionTxHash: txHash,
  });
}

export async function enqueueSync(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<SyncQueueItem> {
  const queueItem: SyncQueueItem = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    retryCount: 0,
    ...item,
  };
  await db.syncQueue.put(queueItem);
  return queueItem;
}

export async function updateSyncQueue(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
  await db.syncQueue.update(id, updates);
}

export async function addProgram(program: Program): Promise<void> {
  await db.programs.put(program);
}

export async function updateProgram(id: string, updates: Partial<Program>): Promise<void> {
  await db.programs.update(id, updates);
}

export async function addMilestones(milestones: Milestone[]): Promise<void> {
  await db.milestones.bulkPut(milestones);
}

export async function addGrantRelease(grant: GrantRelease): Promise<void> {
  await db.grantReleases.put(grant);
}

export async function addDispute(dispute: Dispute): Promise<void> {
  await db.disputes.put(dispute);
}

export async function addNotification(notification: NotificationItem): Promise<void> {
  await db.notifications.put(notification);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db.notifications.where('userId').equals(userId).modify({ read: true });
}

export async function addSMSLog(log: SMSLog): Promise<void> {
  await db.smsLogs.put(log);
}

export async function addAuditLog(log: AuditLog): Promise<void> {
  await db.auditLogs.put(log);
}




