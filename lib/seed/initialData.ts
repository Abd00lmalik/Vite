import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db/schema';
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
  User,
  VaccineLot,
  VaccinationRecord,
} from '@/types';

export const INITIAL_VACCINE_LOTS: VaccineLot[] = [
  {
    lotNumber: 'DTP-LOT-2025-001',
    vaccineName: 'DTP',
    dosesRegistered: 100,
    dosesUsed: 12,
    expiryDate: '2026-06-01',
  },
  {
    lotNumber: 'OPV-LOT-2025-002',
    vaccineName: 'OPV',
    dosesRegistered: 80,
    dosesUsed: 8,
    expiryDate: '2026-03-01',
  },
  {
    lotNumber: 'MSL-LOT-2025-003',
    vaccineName: 'Measles',
    dosesRegistered: 60,
    dosesUsed: 5,
    expiryDate: '2026-09-01',
  },
  {
    lotNumber: 'BCG-LOT-2025-004',
    vaccineName: 'BCG',
    dosesRegistered: 50,
    dosesUsed: 3,
    expiryDate: '2026-12-01',
  },
  {
    lotNumber: 'YFV-LOT-2025-005',
    vaccineName: 'Yellow Fever',
    dosesRegistered: 40,
    dosesUsed: 2,
    expiryDate: '2026-08-01',
  },
];

export const INITIAL_CLINICS: Clinic[] = [
  {
    id: 'clinic-001',
    name: 'Kano Primary Health Post',
    email: 'admin@clinic-kano.ng',
    location: 'Kano, Nigeria',
    state: 'Kano',
    lga: 'Nassarawa',
    createdAt: '2025-01-05T08:00:00.000Z',
  },
  {
    id: 'clinic-002',
    name: 'Ibadan Community Clinic',
    email: 'admin@clinic-ibadan.ng',
    location: 'Ibadan, Nigeria',
    state: 'Oyo',
    lga: 'Ibadan North',
    createdAt: '2025-01-06T08:00:00.000Z',
  },
];

export async function seedInitialData(): Promise<void> {
  if (typeof window === 'undefined') return;

  const alreadySeeded = localStorage.getItem('vite_seeded_v2');
  if (alreadySeeded) return;

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash('Vite2025!', 10);

  const users: User[] = [
    {
      id: 'user-patient-001',
      role: 'patient',
      name: 'Grace Oluwaseun',
      phone: '+2348012345001',
      createdAt: now,
      lastLoginAt: now,
    },
    {
      id: 'hw-001',
      role: 'health-worker',
      name: 'Dr. Amara Osei',
      email: 'amara@clinic-kano.ng',
      passwordHash,
      clinicId: 'clinic-001',
      clinicName: 'Kano Primary Health Post',
      idVerificationField: 'HW-NC-0001',
      roleTitle: 'Medical Officer',
      createdAt: now,
      lastLoginAt: now,
    },
    {
      id: 'hw-002',
      role: 'health-worker',
      name: 'Nurse Fatima Diallo',
      email: 'fatima@clinic-ibadan.ng',
      passwordHash,
      clinicId: 'clinic-002',
      clinicName: 'Ibadan Community Clinic',
      idVerificationField: 'HW-OY-0002',
      roleTitle: 'Nurse',
      createdAt: now,
      lastLoginAt: now,
    },
    {
      id: 'donor-001',
      role: 'donor',
      name: 'UNICEF Nigeria',
      email: 'donor@unicef-ng.org',
      passwordHash,
      organizationName: 'UNICEF Nigeria',
      programPreferences: ['vaccination'],
      createdAt: now,
      lastLoginAt: now,
    },
    {
      id: 'user-patient-002',
      role: 'patient',
      name: 'Aisha Musa',
      phone: '+2348012345002',
      createdAt: now,
      lastLoginAt: now,
    },
  ];

  const milestones: Milestone[] = [
    {
      id: 'milestone-dtp1',
      programId: 'program-init-001',
      name: 'DTP Dose 1',
      description: 'First DTP dose milestone',
      vaccineName: 'DTP',
      doseNumber: 1,
      grantAmount: 3,
      completedCount: 2,
      pendingCount: 2,
    },
    {
      id: 'milestone-dtp2',
      programId: 'program-init-001',
      name: 'DTP Dose 2',
      description: 'Second DTP dose milestone',
      vaccineName: 'DTP',
      doseNumber: 2,
      grantAmount: 3,
      completedCount: 1,
      pendingCount: 3,
    },
    {
      id: 'milestone-measles',
      programId: 'program-init-001',
      name: 'Measles Dose 1',
      description: 'Measles first dose milestone',
      vaccineName: 'Measles',
      doseNumber: 1,
      grantAmount: 5,
      completedCount: 1,
      pendingCount: 3,
    },
  ];

  const programs: Program[] = [
    {
      id: 'program-init-001',
      name: 'UNICEF Nigeria Immunisation Incentive Program',
      donorId: 'donor-001',
      donorName: 'UNICEF Nigeria',
      type: 'vaccination completion',
      description: 'Conditional cash transfer for childhood immunization completion.',
      geographicScope: ['Kano', 'Oyo'],
      enrollmentType: 'partner clinics only',
      escrowBalance: 2500,
      totalReleased: 14,
      milestones,
      enrolledPatients: 4,
      status: 'active',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ];

  const patients: Patient[] = [
    {
      id: 'patient-001',
      userId: 'user-patient-001',
      healthDropId: 'VITE-ADE001',
      name: 'Adebayo Oluwaseun',
      dateOfBirth: '2024-01-15',
      sex: 'M',
      parentPhone: '+2348012345001',
      parentName: 'Grace Oluwaseun',
      clinicId: 'clinic-001',
      clinicName: 'Kano Primary Health Post',
      registeredBy: 'hw-001',
      registeredAt: '2025-01-15T09:00:00.000Z',
      programId: 'program-init-001',
      syncStatus: 'synced',
      xionRecordId: 'xion-rec-001',
      gpsLat: 12.0022,
      gpsLng: 8.592,
    },
    {
      id: 'patient-002',
      userId: 'user-patient-002',
      healthDropId: 'VITE-FAT002',
      name: 'Fatima Musa',
      dateOfBirth: '2024-02-20',
      sex: 'F',
      parentPhone: '+2348012345002',
      parentName: 'Aisha Musa',
      clinicId: 'clinic-001',
      clinicName: 'Kano Primary Health Post',
      registeredBy: 'hw-001',
      registeredAt: '2025-02-20T10:00:00.000Z',
      programId: 'program-init-001',
      syncStatus: 'synced',
      gpsLat: 12.0022,
      gpsLng: 8.592,
    },
    {
      id: 'patient-003',
      healthDropId: 'VITE-EME003',
      name: 'Emeka Chijioke',
      dateOfBirth: '2024-03-10',
      sex: 'M',
      parentPhone: '+2348012345003',
      parentName: 'Ngozi Chijioke',
      clinicId: 'clinic-002',
      clinicName: 'Ibadan Community Clinic',
      registeredBy: 'hw-002',
      registeredAt: '2025-03-10T11:00:00.000Z',
      syncStatus: 'synced',
      gpsLat: 7.3775,
      gpsLng: 3.947,
    },
    {
      id: 'patient-004',
      healthDropId: 'VITE-AIS004',
      name: 'Aisha Bello',
      dateOfBirth: '2024-04-05',
      sex: 'F',
      parentPhone: '+2348012345004',
      parentName: 'Hadiza Bello',
      clinicId: 'clinic-002',
      clinicName: 'Ibadan Community Clinic',
      registeredBy: 'hw-002',
      registeredAt: '2025-04-05T08:30:00.000Z',
      programId: 'program-init-001',
      syncStatus: 'pending',
      gpsLat: 7.3775,
      gpsLng: 3.947,
    },
    {
      id: 'patient-005',
      healthDropId: 'VITE-KWA005',
      name: 'Kwame Asante',
      dateOfBirth: '2024-05-12',
      sex: 'M',
      parentPhone: '+2348012345005',
      parentName: 'Abena Asante',
      clinicId: 'clinic-001',
      clinicName: 'Kano Primary Health Post',
      registeredBy: 'hw-001',
      registeredAt: '2025-05-12T14:00:00.000Z',
      programId: 'program-init-001',
      syncStatus: 'pending',
      gpsLat: 12.0022,
      gpsLng: 8.592,
    },
  ];

  const vaccinations: VaccinationRecord[] = [
    {
      id: 'vac-001',
      patientId: 'patient-001',
      healthDropId: 'VITE-ADE001',
      vaccineName: 'DTP',
      lotNumber: 'DTP-LOT-2025-001',
      doseNumber: 1,
      dateAdministered: '2025-01-15',
      administeredBy: 'hw-001',
      clinicId: 'clinic-001',
      clinicName: 'Kano Primary Health Post',
      gpsLat: 12.0022,
      gpsLng: 8.592,
      syncStatus: 'synced',
      xionTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      milestoneTriggered: 'milestone-dtp1',
      createdAt: '2025-01-15T09:30:00.000Z',
    },
    {
      id: 'vac-002',
      patientId: 'patient-001',
      healthDropId: 'VITE-ADE001',
      vaccineName: 'DTP',
      lotNumber: 'DTP-LOT-2025-001',
      doseNumber: 2,
      dateAdministered: '2025-02-26',
      administeredBy: 'hw-001',
      clinicId: 'clinic-001',
      clinicName: 'Kano Primary Health Post',
      gpsLat: 12.0022,
      gpsLng: 8.592,
      syncStatus: 'synced',
      xionTxHash: '0xbcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      milestoneTriggered: 'milestone-dtp2',
      createdAt: '2025-02-26T10:00:00.000Z',
    },
    {
      id: 'vac-003',
      patientId: 'patient-002',
      healthDropId: 'VITE-FAT002',
      vaccineName: 'DTP',
      lotNumber: 'DTP-LOT-2025-001',
      doseNumber: 1,
      dateAdministered: '2025-02-20',
      administeredBy: 'hw-001',
      clinicId: 'clinic-001',
      clinicName: 'Kano Primary Health Post',
      gpsLat: 12.0022,
      gpsLng: 8.592,
      syncStatus: 'synced',
      xionTxHash: '0xcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc',
      milestoneTriggered: 'milestone-dtp1',
      createdAt: '2025-02-20T10:30:00.000Z',
    },
    {
      id: 'vac-004',
      patientId: 'patient-003',
      healthDropId: 'VITE-EME003',
      vaccineName: 'Measles',
      lotNumber: 'MSL-LOT-2025-003',
      doseNumber: 1,
      dateAdministered: '2025-03-10',
      administeredBy: 'hw-002',
      clinicId: 'clinic-002',
      clinicName: 'Ibadan Community Clinic',
      gpsLat: 7.3775,
      gpsLng: 3.947,
      syncStatus: 'synced',
      xionTxHash: '0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
      milestoneTriggered: 'milestone-measles',
      createdAt: '2025-03-10T11:30:00.000Z',
    },
    {
      id: 'vac-005',
      patientId: 'patient-004',
      healthDropId: 'VITE-AIS004',
      vaccineName: 'DTP',
      lotNumber: 'DTP-LOT-2025-001',
      doseNumber: 1,
      dateAdministered: '2025-04-05',
      administeredBy: 'hw-002',
      clinicId: 'clinic-002',
      clinicName: 'Ibadan Community Clinic',
      gpsLat: 7.3775,
      gpsLng: 3.947,
      syncStatus: 'pending',
      createdAt: '2025-04-05T08:45:00.000Z',
    },
  ];

  const grantReleases: GrantRelease[] = [
    {
      id: 'grant-001',
      patientId: 'patient-001',
      patientName: 'Adebayo Oluwaseun',
      milestoneId: 'milestone-dtp1',
      milestoneName: 'DTP Dose 1',
      amount: 3,
      status: 'released',
      xionTxHash: '0x1111aaaabbbb2222cccc3333dddd4444eeee5555ffff6666aaaa7777bbbb8888',
      releasedAt: '2025-01-15T09:35:00.000Z',
    },
    {
      id: 'grant-002',
      patientId: 'patient-001',
      patientName: 'Adebayo Oluwaseun',
      milestoneId: 'milestone-dtp2',
      milestoneName: 'DTP Dose 2',
      amount: 3,
      status: 'released',
      xionTxHash: '0x2222aaaabbbb2222cccc3333dddd4444eeee5555ffff6666aaaa7777bbbb8888',
      releasedAt: '2025-02-26T10:05:00.000Z',
    },
    {
      id: 'grant-003',
      patientId: 'patient-002',
      patientName: 'Fatima Musa',
      milestoneId: 'milestone-dtp1',
      milestoneName: 'DTP Dose 1',
      amount: 3,
      status: 'redeemed',
      xionTxHash: '0x3333aaaabbbb2222cccc3333dddd4444eeee5555ffff6666aaaa7777bbbb8888',
      releasedAt: '2025-02-20T10:35:00.000Z',
      mobileMoneyReceipt: {
        transactionId: 'VH-REDEEM01',
        phone: '+2348012345002',
        amount: 3,
        currency: 'USD',
        provider: 'OPay',
        timestamp: '2025-02-20T10:40:00.000Z',
        status: 'success',
      },
    },
    {
      id: 'grant-004',
      patientId: 'patient-003',
      patientName: 'Emeka Chijioke',
      milestoneId: 'milestone-measles',
      milestoneName: 'Measles Dose 1',
      amount: 5,
      status: 'released',
      xionTxHash: '0x4444aaaabbbb2222cccc3333dddd4444eeee5555ffff6666aaaa7777bbbb8888',
      releasedAt: '2025-03-10T11:35:00.000Z',
    },
  ];

  const disputes: Dispute[] = [
    {
      id: 'dispute-001',
      recordId: 'vac-001',
      patientId: 'patient-001',
      raisedBy: 'donor-001',
      reason: 'Stock lot DTP-LOT-2025-001 record count exceeds registered doses.',
      evidence: '102 records vs 100 registered doses - discrepancy of 2.',
      status: 'under-review',
      createdAt: '2025-03-01T12:00:00.000Z',
    },
  ];

  const smsLogs: SMSLog[] = [
    {
      id: uuidv4(),
      to: '+2348012345001',
      type: 'registration',
      message: 'VITE Health: Adebayo Oluwaseun has been registered for UNICEF Nigeria Immunisation Incentive Program.',
      status: 'sent',
      timestamp: '2025-01-15T09:05:00.000Z',
    },
    {
      id: uuidv4(),
      to: '+2348012345002',
      type: 'registration',
      message: 'VITE Health: Fatima Musa has been registered for UNICEF Nigeria Immunisation Incentive Program.',
      status: 'sent',
      timestamp: '2025-02-20T10:05:00.000Z',
    },
    {
      id: uuidv4(),
      to: '+2348012345004',
      type: 'registration',
      message: 'VITE Health: Aisha Bello has been registered for UNICEF Nigeria Immunisation Incentive Program.',
      status: 'sent',
      timestamp: '2025-04-05T08:31:00.000Z',
    },
    {
      id: uuidv4(),
      to: '+2348012345001',
      type: 'milestone-payment',
      message: 'VITE Health: $3 has been added for DTP Dose 1.',
      status: 'sent',
      timestamp: '2025-01-15T09:36:00.000Z',
    },
    {
      id: uuidv4(),
      to: '+2348012345001',
      type: 'milestone-payment',
      message: 'VITE Health: $3 has been added for DTP Dose 2.',
      status: 'sent',
      timestamp: '2025-02-26T10:06:00.000Z',
    },
    {
      id: uuidv4(),
      to: '+2348012345002',
      type: 'milestone-payment',
      message: 'VITE Health: $3 has been added for DTP Dose 1.',
      status: 'sent',
      timestamp: '2025-02-20T10:36:00.000Z',
    },
    {
      id: uuidv4(),
      to: '+2348012345004',
      type: 'reminder',
      message: 'VITE Health: Aisha Bello is due for DTP Dose 2 vaccination by 17 May 2025.',
      status: 'sent',
      timestamp: '2025-05-10T08:00:00.000Z',
    },
    {
      id: uuidv4(),
      to: '+2348012345002',
      type: 'reminder',
      message: 'VITE Health: Fatima Musa is due for DTP dose 2 by 03 Apr 2025.',
      status: 'sent',
      timestamp: '2025-03-28T08:00:00.000Z',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'audit-001',
      entityId: 'batch-001',
      entityType: 'sync-batch',
      action: 'Synced 4 records. Merkle root anchored to XION.',
      performedBy: 'hw-001',
      timestamp: '2025-03-10T11:32:00.000Z',
    },
    {
      id: 'audit-002',
      entityId: 'grant-004',
      entityType: 'grant-release',
      action: 'Released $5 for Measles milestone.',
      performedBy: 'system',
      timestamp: '2025-03-10T11:35:00.000Z',
    },
    {
      id: 'audit-003',
      entityId: 'dispute-001',
      entityType: 'dispute',
      action: 'Dispute opened for vac-001 due to stock mismatch.',
      performedBy: 'donor-001',
      timestamp: '2025-03-01T12:00:00.000Z',
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'note-001',
      userId: 'user-patient-001',
      type: 'reminder',
      message: 'Adebayo Oluwaseun is due for Measles dose 1 by 07 Apr 2025.',
      read: false,
      createdAt: '2025-03-30T08:00:00.000Z',
    },
    {
      id: 'note-002',
      userId: 'donor-001',
      type: 'milestone',
      message: 'New milestone completion recorded for VITE-ADE001.',
      read: false,
      createdAt: '2025-02-26T10:07:00.000Z',
    },
    {
      id: 'note-003',
      userId: 'hw-001',
      type: 'dispute',
      message: 'Dispute raised on record vac-001. Review required.',
      read: false,
      createdAt: '2025-03-01T12:05:00.000Z',
    },
  ];

  await db.users.bulkPut(users);
  await db.clinics.bulkPut(INITIAL_CLINICS);
  await db.milestones.bulkPut(milestones);
  await db.programs.bulkPut(programs);
  await db.patients.bulkPut(patients);
  await db.vaccinations.bulkPut(vaccinations);
  await db.grantReleases.bulkPut(grantReleases);
  await db.disputes.bulkPut(disputes);
  await db.smsLogs.bulkPut(smsLogs);
  await db.auditLogs.bulkPut(auditLogs);
  await db.notifications.bulkPut(notifications);

  await db.syncBatches.bulkPut([
    {
      id: 'batch-001',
      records: vaccinations.filter((item) => item.syncStatus === 'synced'),
      merkleRoot: '0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abcd',
      proof: ['leaf-1', 'leaf-2', 'leaf-3'],
      status: 'confirmed',
      submittedAt: '2025-03-10T11:32:00.000Z',
      xionTxHash: '0xaaaabbbbccccddddeeeeffff1111222233334444555566667777888899990000',
      recordCount: 4,
    },
  ]);

  localStorage.setItem('vite_seeded_v2', 'true');
}

export function resetSeedFlag(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('vite_seeded_v2');
}




