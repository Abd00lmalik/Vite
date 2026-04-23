import Dexie, { Table } from 'dexie';
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
  SyncBatch,
  SyncQueueItem,
  User,
  VaccinationRecord,
} from '@/types';

export class ViteDatabase extends Dexie {
  patients!: Table<Patient>;
  vaccinations!: Table<VaccinationRecord>;
  syncBatches!: Table<SyncBatch>;
  grantReleases!: Table<GrantRelease>;
  disputes!: Table<Dispute>;
  smsLogs!: Table<SMSLog>;
  programs!: Table<Program>;
  users!: Table<User>;
  milestones!: Table<Milestone>;
  notifications!: Table<NotificationItem>;
  auditLogs!: Table<AuditLog>;
  syncQueue!: Table<SyncQueueItem>;
  clinics!: Table<Clinic>;

  constructor() {
    super('ViteHealthDrop');

    // VERSION 3 â€” clean slate with correct primary keys and indexes
    // Primary keys use 'id' throughout â€” never '++id'
    this.version(3).stores({
      patients:
        'id, healthDropId, parentPhone, clinicId, syncStatus, programId, registeredAt, registeredBy',
      vaccinations:
        'id, patientId, healthDropId, vaccineName, doseNumber, syncStatus, clinicId, administeredBy, dateAdministered, lotNumber',
      syncBatches: 'id, status, submittedAt',
      grantReleases: 'id, patientId, milestoneId, status, releasedAt',
      disputes: 'id, recordId, patientId, status, raisedBy',
      smsLogs: 'id, to, type, timestamp, status',
      programs: 'id, donorId, status, createdAt',
      users: 'id, email, phone, role, clinicId, createdAt',
      milestones: 'id, programId, vaccineName, doseNumber',
      notifications: 'id, userId, type, read, createdAt',
      auditLogs: 'id, entityId, entityType, action, performedBy, timestamp',
      syncQueue: 'id, type, status, createdAt, retryCount',
      clinics: 'id, name, location, createdAt',
    });
  }
}

// Singleton instance
let _db: ViteDatabase | null = null;

export function getDb(): ViteDatabase {
  if (!_db) _db = new ViteDatabase();
  return _db;
}

export const db = new Proxy({} as ViteDatabase, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});




