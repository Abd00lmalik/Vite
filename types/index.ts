export type UserRole = 'patient' | 'health-worker' | 'donor' | 'admin';

export type SyncStatus = 'pending' | 'synced' | 'flagged';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  clinicId?: string;
  clinicName?: string;
  organizationName?: string;
  walletAddress?: string;
  walletConnectedAt?: string;
  idVerificationField?: string;
  roleTitle?: string;
  programPreferences?: string[];
  isDemoUser?: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthSession {
  userId: string;
  role: UserRole;
  name: string;
  clinicId?: string;
  organizationName?: string;
  demo?: boolean;
  expiresAt: string;
}

export interface Clinic {
  id: string;
  name: string;
  email?: string;
  location: string;
  state?: string;
  lga?: string;
  createdAt: string;
}

export interface VaccineLot {
  lotNumber: string;
  vaccineName: string;
  dosesRegistered: number;
  dosesUsed: number;
  expiryDate: string;
}

export interface Patient {
  id: string;
  userId?: string;
  ownerUserId?: string;
  healthDropId: string;
  name: string;
  dateOfBirth: string;
  sex: 'M' | 'F' | 'Other';
  parentPhone: string;
  parentName: string;
  clinicId: string;
  clinicName?: string;
  registeredBy: string;
  registeredAt: string;
  programId?: string;
  qrCode?: string;
  syncStatus: SyncStatus;
  xionRecordId?: string;
  gpsLat?: number;
  gpsLng?: number;
}

export interface VaccinationRecord {
  id: string;
  ownerUserId?: string;
  patientId: string;
  healthDropId: string;
  vaccineName: string;
  lotNumber: string;
  doseNumber: number;
  dateAdministered: string;
  administeredBy: string;
  clinicId: string;
  clinicName?: string;
  gpsLat: number;
  gpsLng: number;
  syncStatus: SyncStatus;
  xionTxHash?: string;
  xionBlockHeight?: number;
  milestoneTriggered?: string;
  notes?: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  programId: string;
  name: string;
  description: string;
  vaccineName: string;
  doseNumber: number;
  grantAmount: number;
  completedCount: number;
  pendingCount: number;
}

export type ProgramStatus = 'active' | 'paused' | 'completed';

export interface Program {
  id: string;
  name: string;
  donorId: string;
  donorName: string;
  type: 'vaccination completion' | 'antenatal visits' | 'child growth';
  description: string;
  geographicScope: string[];
  enrollmentType: 'partner clinics only' | 'open enrollment';
  escrowBalance: number;
  totalReleased: number;
  milestones: Milestone[];
  enrolledPatients: number;
  status: ProgramStatus;
  createdAt: string;
}

export interface MobileMoneyReceipt {
  transactionId: string;
  phone: string;
  amount: number;
  currency: string;
  provider: string;
  timestamp: string;
  status: 'success';
}

export type GrantStatus = 'pending' | 'released' | 'redeemed';

export interface GrantRelease {
  id: string;
  patientId: string;
  patientName: string;
  milestoneId: string;
  milestoneName: string;
  amount: number;
  status: GrantStatus;
  xionTxHash?: string;
  mobileMoneyReceipt?: MobileMoneyReceipt;
  releasedAt?: string;
  txDate?: string;
}

export type DisputeStatus = 'open' | 'under-review' | 'resolved';

export interface Dispute {
  id: string;
  recordId: string;
  patientId: string;
  raisedBy: string;
  reason: string;
  evidence: string;
  status: DisputeStatus;
  resolution?: string;
  createdAt: string;
}

export interface SMSLog {
  id: string;
  to: string;
  type: 'registration' | 'milestone-payment' | 'reminder' | 'dispute' | 'system';
  message: string;
  status: 'sent' | 'failed' | 'simulated';
  timestamp: string;
}

export interface SyncBatch {
  id: string;
  records: VaccinationRecord[];
  merkleRoot: string;
  proof: string[];
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  submittedAt?: string;
  xionTxHash?: string;
  blockHeight?: number;
  recordCount: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'vaccination' | 'patient' | 'grant' | 'notification';
  recordId: string;
  status: 'pending' | 'processing' | 'failed' | 'completed' | 'synced';
  isDemo?: boolean;
  ownerUserId?: string;
  clinicId?: string;
  patientId?: string;
  userId?: string;
  syncedAt?: string;
  data?: unknown;
  createdAt: string;
  retryCount: number;
  error?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'reminder' | 'milestone' | 'dispute' | 'sync' | 'system';
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityId: string;
  entityType: string;
  action: string;
  performedBy: string;
  timestamp: string;
}

export interface SyncResult {
  success: boolean;
  batchId: string;
  recordCount: number;
  txHash?: string;
  blockHeight?: number;
  explorerUrl?: string;
  merkleRoot: string;
  grantsReleased: number;
  errors: string[];
  flaggedCount?: number;
  mode?: 'simulated' | 'onchain';
}

export interface ProgramReport {
  program: Program | undefined;
  totalCourses: number;
  totalReleased: number;
  efficiency: number;
  fraudRate: number;
  flaggedRecords: number;
  dropoutByMilestone: Array<{
    milestone: string;
    completed: number;
    enrolled: number;
    rate: number;
  }>;
  generatedAt: string;
}




