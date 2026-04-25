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
  return `HD-${entropy.slice(-6).toUpperCase()}`;
}

function resolvePatientOwner(patient: Pick<Patient, 'ownerUserId' | 'registeredBy'>): string {
  return patient.ownerUserId ?? patient.registeredBy;
}

function resolveVaccinationOwner(
  record: Pick<VaccinationRecord, 'ownerUserId' | 'administeredBy'>
): string {
  return record.ownerUserId ?? record.administeredBy;
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
  const ownerUserId = data.ownerUserId ?? data.registeredBy;
  const existing = (await db.patients.where('parentPhone').equals(data.parentPhone).toArray()).find(
    (patient) => resolvePatientOwner(patient) === ownerUserId
  );
  if (existing) {
    throw new Error(`Patient already registered with phone ${data.parentPhone}`);
  }

  const id = uuidv4();
  const patient: Patient = {
    ...data,
    ownerUserId,
    id,
    healthDropId: buildHealthId(id),
    syncStatus: 'pending',
    registeredAt: new Date().toISOString(),
  };
  await db.patients.put(patient);
  await ensureSyncQueueEntry({
    type: 'patient',
    recordId: patient.id,
    ownerUserId,
    clinicId: patient.clinicId,
    patientId: patient.id,
    userId: ownerUserId,
    data: patient,
  });
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
  const ownerUserId = data.ownerUserId ?? data.administeredBy;
  const record: VaccinationRecord = {
    ...data,
    ownerUserId,
    id: uuidv4(),
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
  };
  await db.vaccinations.put(record);
  await ensureSyncQueueEntry({
    type: 'vaccination',
    recordId: record.id,
    ownerUserId,
    clinicId: record.clinicId,
    patientId: record.patientId,
    userId: ownerUserId,
    data: record,
  });
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

export async function getPendingVaccinations(params?: {
  clinicId?: string;
  ownerUserId?: string;
}): Promise<VaccinationRecord[]> {
  const { clinicId, ownerUserId } = params ?? {};
  let rows: VaccinationRecord[];

  if (clinicId) {
    rows = await db.vaccinations.where('clinicId').equals(clinicId).toArray();
  } else {
    rows = await db.vaccinations.where('syncStatus').equals('pending').toArray();
  }

  return rows.filter((record) => {
    if (record.syncStatus !== 'pending') return false;
    if (!ownerUserId) return true;
    return resolveVaccinationOwner(record) === ownerUserId;
  });
}

export async function getPendingPatients(params?: {
  clinicId?: string;
  ownerUserId?: string;
}): Promise<Patient[]> {
  const { clinicId, ownerUserId } = params ?? {};
  let rows: Patient[];

  if (clinicId) {
    rows = await db.patients.where('clinicId').equals(clinicId).toArray();
  } else {
    rows = await db.patients.where('syncStatus').equals('pending').toArray();
  }

  return rows.filter((patient) => {
    if (patient.syncStatus !== 'pending') return false;
    if (!ownerUserId) return true;
    return resolvePatientOwner(patient) === ownerUserId;
  });
}

export async function markVaccinationSynced(id: string, txHash: string, blockHeight?: number): Promise<void> {
  await db.vaccinations.update(id, {
    syncStatus: 'synced',
    xionTxHash: txHash,
    ...(blockHeight ? { xionBlockHeight: blockHeight } : {}),
  });
}

export async function markPatientSynced(id: string): Promise<void> {
  await db.patients.update(id, {
    syncStatus: 'synced',
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

export async function ensureSyncQueueEntry(
  item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount' | 'status'> & {
    status?: SyncQueueItem['status'];
  }
): Promise<SyncQueueItem> {
  const existing = (await db.syncQueue.where('type').equals(item.type).toArray()).find(
    (queueItem) =>
      queueItem.recordId === item.recordId &&
      (queueItem.ownerUserId ?? queueItem.userId) === (item.ownerUserId ?? item.userId)
  );

  if (existing) {
    if (existing.status !== 'pending') {
      await db.syncQueue.update(existing.id, {
        status: 'pending',
        error: undefined,
        data: item.data ?? existing.data,
      });
    }
    const refreshed = await db.syncQueue.get(existing.id);
    return refreshed ?? existing;
  }

  return enqueueSync({
    ...item,
    status: item.status ?? 'pending',
  });
}

export async function getPendingSyncQueueForUser(
  userId: string,
  type?: SyncQueueItem['type']
): Promise<SyncQueueItem[]> {
  const pending = await db.syncQueue.where('status').equals('pending').toArray();
  return pending.filter((item) => {
    if (type && item.type !== type) return false;
    return (item.ownerUserId ?? item.userId) === userId;
  });
}

export async function markSyncQueueSynced(
  userId: string,
  type: SyncQueueItem['type'],
  recordIds: string[]
): Promise<void> {
  if (!recordIds.length) return;
  const idSet = new Set(recordIds);
  const pending = await db.syncQueue.where('status').equals('pending').toArray();
  const targets = pending.filter(
    (item) =>
      item.type === type &&
      idSet.has(item.recordId) &&
      (item.ownerUserId ?? item.userId) === userId
  );

  const syncedAt = new Date().toISOString();
  await Promise.all(
    targets.map((item) =>
      db.syncQueue.update(item.id, {
        status: 'synced',
        error: undefined,
        syncedAt,
      })
    )
  );
}

export async function countPendingSyncItemsForUser(userId: string): Promise<number> {
  const pendingQueue = await getPendingSyncQueueForUser(userId);

  const [pendingVaccinations, pendingPatients] = await Promise.all([
    getPendingVaccinations({ ownerUserId: userId }),
    getPendingPatients({ ownerUserId: userId }),
  ]);

  const queueKeySet = new Set(
    pendingQueue.map((item) => `${item.type}:${item.recordId}`)
  );

  let fallbackCount = 0;
  for (const record of pendingVaccinations) {
    if (!queueKeySet.has(`vaccination:${record.id}`)) fallbackCount += 1;
  }
  for (const patient of pendingPatients) {
    if (!queueKeySet.has(`patient:${patient.id}`)) fallbackCount += 1;
  }

  return pendingQueue.length + fallbackCount;
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




