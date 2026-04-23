import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('vite_health.db');

export function initDb(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS patients (
      id            TEXT PRIMARY KEY,
      health_drop_id TEXT UNIQUE,
      name          TEXT NOT NULL,
      dob           TEXT NOT NULL,
      sex           TEXT NOT NULL,
      parent_phone  TEXT NOT NULL,
      parent_name   TEXT,
      clinic_id     TEXT NOT NULL,
      registered_by TEXT NOT NULL,
      program_id    TEXT DEFAULT '',
      registered_at TEXT NOT NULL,
      sync_status   TEXT DEFAULT 'pending',
      xion_address  TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS vaccinations (
      id                TEXT PRIMARY KEY,
      patient_id        TEXT NOT NULL,
      health_drop_id    TEXT NOT NULL,
      vaccine_name      TEXT NOT NULL,
      lot_number        TEXT NOT NULL,
      dose_number       INTEGER NOT NULL,
      date_administered TEXT NOT NULL,
      administered_by   TEXT NOT NULL,
      clinic_id         TEXT NOT NULL,
      gps_lat           REAL DEFAULT 0,
      gps_lng           REAL DEFAULT 0,
      sync_status       TEXT DEFAULT 'pending',
      xion_tx_hash      TEXT DEFAULT '',
      created_at        TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_batches (
      id              TEXT PRIMARY KEY,
      merkle_root     TEXT NOT NULL,
      record_count    INTEGER NOT NULL,
      tx_hash         TEXT NOT NULL,
      block_height    INTEGER DEFAULT 0,
      synced_at       TEXT NOT NULL,
      grants_released INTEGER DEFAULT 0
    );
  `);
}

// ── Patients ──────────────────────────────────────────────────────

export function insertPatient(p: {
  id: string; healthDropId: string; name: string; dob: string;
  sex: string; parentPhone: string; parentName: string;
  clinicId: string; registeredBy: string; programId?: string;
  registeredAt: string;
}): void {
  db.runSync(
    `INSERT OR REPLACE INTO patients
     (id,health_drop_id,name,dob,sex,parent_phone,parent_name,
      clinic_id,registered_by,program_id,registered_at,sync_status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    p.id, p.healthDropId, p.name, p.dob, p.sex,
    p.parentPhone, p.parentName ?? '', p.clinicId,
    p.registeredBy, p.programId ?? '', p.registeredAt, 'pending'
  );
}

export function getPatientByPhone(phone: string): any {
  return db.getFirstSync('SELECT * FROM patients WHERE parent_phone = ?', phone);
}

export function getPatientByHDId(hdId: string): any {
  return db.getFirstSync('SELECT * FROM patients WHERE health_drop_id = ?', hdId);
}

export function getAllPatients(): any[] {
  return db.getAllSync('SELECT * FROM patients ORDER BY registered_at DESC');
}

// ── Vaccinations ──────────────────────────────────────────────────

export function insertVaccination(v: {
  id: string; patientId: string; healthDropId: string;
  vaccineName: string; lotNumber: string; doseNumber: number;
  dateAdministered: string; administeredBy: string; clinicId: string;
  gpsLat: number; gpsLng: number;
}): void {
  db.runSync(
    `INSERT OR REPLACE INTO vaccinations
     (id,patient_id,health_drop_id,vaccine_name,lot_number,
      dose_number,date_administered,administered_by,clinic_id,
      gps_lat,gps_lng,sync_status,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    v.id, v.patientId, v.healthDropId, v.vaccineName, v.lotNumber,
    v.doseNumber, v.dateAdministered, v.administeredBy, v.clinicId,
    v.gpsLat, v.gpsLng, 'pending', new Date().toISOString()
  );
}

export function getPendingVaccinations(): any[] {
  return db.getAllSync("SELECT * FROM vaccinations WHERE sync_status = 'pending'");
}

export function getPatientVaccinations(patientId: string): any[] {
  return db.getAllSync(
    'SELECT * FROM vaccinations WHERE patient_id = ? ORDER BY date_administered DESC',
    patientId
  );
}

export function markVaccinationSynced(id: string, txHash: string): void {
  db.runSync(
    "UPDATE vaccinations SET sync_status='synced', xion_tx_hash=? WHERE id=?",
    txHash, id
  );
}

// ── Sync Batches ──────────────────────────────────────────────────

export function saveSyncBatch(b: {
  id: string; merkleRoot: string; recordCount: number;
  txHash: string; blockHeight: number; grantsReleased: number;
}): void {
  db.runSync(
    `INSERT OR REPLACE INTO sync_batches
     (id,merkle_root,record_count,tx_hash,block_height,synced_at,grants_released)
     VALUES (?,?,?,?,?,?,?)`,
    b.id, b.merkleRoot, b.recordCount,
    b.txHash, b.blockHeight, new Date().toISOString(), b.grantsReleased
  );
}

export function getAllSyncBatches(): any[] {
  return db.getAllSync('SELECT * FROM sync_batches ORDER BY synced_at DESC');
}



