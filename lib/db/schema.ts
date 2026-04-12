import Dexie, { type Table } from 'dexie';
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
  patients!: Table<Patient, string>;
  vaccinations!: Table<VaccinationRecord, string>;
  syncBatches!: Table<SyncBatch, string>;
  grantReleases!: Table<GrantRelease, string>;
  disputes!: Table<Dispute, string>;
  smsLogs!: Table<SMSLog, string>;
  programs!: Table<Program, string>;
  users!: Table<User, string>;
  milestones!: Table<Milestone, string>;
  notifications!: Table<NotificationItem, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  auditLogs!: Table<AuditLog, string>;
  clinics!: Table<Clinic, string>;

  constructor() {
    super('ViteHealthDrop');

    this.version(1).stores({
      patients: 'id, healthDropId, parentPhone, clinicId, syncStatus, programId',
      vaccinations: 'id, patientId, healthDropId, vaccineName, syncStatus, clinicId',
      syncBatches: 'id, status, submittedAt',
      grantReleases: 'id, patientId, milestoneId, status',
      disputes: 'id, recordId, status',
      smsLogs: 'id, to, type, timestamp',
      programs: 'id, donorId, status',
    });

    this.version(2)
      .stores({
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
        syncQueue: 'id, type, status, createdAt, retryCount',
        auditLogs: 'id, entityId, entityType, action, performedBy, timestamp',
        clinics: 'id, name, location, createdAt',
      })
      .upgrade((_tx) => {
        // No data migration needed. Version bump ensures indexes are rebuilt.
      });
  }
}

export const db = new ViteDatabase();

