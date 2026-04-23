'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRScanner } from '@/components/shared/QRScanner';
import { PatientSearch } from './PatientSearch';
import { VaccinationTimeline } from '@/components/patient/VaccinationTimeline';
import { captureGPS } from '@/lib/utils/gps';
import { createVaccination } from '@/lib/db/db';
import { db } from '@/lib/db/schema';
import { INITIAL_VACCINE_LOTS } from '@/lib/seed/initialData';
import { useAuthStore } from '@/store/authStore';
import { isDemoSession } from '@/lib/auth/demo';
import type { Patient, VaccinationRecord } from '@/types';

const schema = z.object({
  vaccineName: z.string().min(1, 'Select a vaccine'),
  lotNumber: z.string().min(1, 'Enter a lot number'),
  doseNumber: z.coerce.number().min(1).max(5),
  dateAdministered: z.string().refine((value) => new Date(value).getTime() <= Date.now(), {
    message: 'Date cannot be in the future',
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const VACCINES = ['DTP', 'OPV', 'Measles', 'BCG', 'Yellow Fever'];

export function VaccinationForm() {
  const { session } = useAuthStore();
  const demoSession = isDemoSession(session);
  const [lookupMode, setLookupMode] = useState<'phone' | 'qr'>('phone');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<VaccinationRecord[]>([]);
  const [gps, setGps] = useState({ lat: 0, lng: 0 });
  const [manualLotEntry, setManualLotEntry] = useState('');
  const [manualLotMode, setManualLotMode] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dateAdministered: new Date().toISOString().slice(0, 10),
      doseNumber: 1,
      vaccineName: '',
      lotNumber: '',
      notes: '',
    },
  });

  const selectedVaccine = watch('vaccineName');
  const selectedLotNumber = watch('lotNumber');

  useEffect(() => {
    captureGPS().then((coords) => setGps({ lat: coords.lat, lng: coords.lng }));
  }, []);

  const lotsForSelectedVaccine = useMemo(
    () => INITIAL_VACCINE_LOTS.filter((lot) => lot.vaccineName === selectedVaccine),
    [selectedVaccine]
  );

  useEffect(() => {
    if (!patient || !selectedVaccine) return;
    const sameVaccine = history.filter((record) => record.vaccineName === selectedVaccine);
    setValue('doseNumber', sameVaccine.length + 1, { shouldDirty: true });
  }, [history, patient, selectedVaccine, setValue]);

  const onPatientFound = async (found: Patient | null) => {
    if (!found) {
      setPatient(null);
      setHistory([]);
      return;
    }

    if (!demoSession && session?.clinicId && found.clinicId !== session.clinicId) {
      toast.error('This patient belongs to another clinic. Search your clinic records only.');
      setPatient(null);
      setHistory([]);
      return;
    }

    setPatient(found);

    const records = await db.vaccinations.where('patientId').equals(found.id).sortBy('dateAdministered');
    setHistory(records);
  };

  const selectedLot = INITIAL_VACCINE_LOTS.find((lot) => lot.lotNumber === selectedLotNumber);
  const remainingDoses = selectedLot ? selectedLot.dosesRegistered - selectedLot.dosesUsed : 0;
  const lotIsUnknown = !!selectedLotNumber && !selectedLot;
  const lotVaccineMismatch = !!selectedLot && !!selectedVaccine && selectedLot.vaccineName !== selectedVaccine;
  const lotIsValid = !!selectedLot && !lotVaccineMismatch;
  const lowStock = lotIsValid && remainingDoses < 10;

  const onSubmit = async (values: FormValues) => {
    if (!patient || !session) {
      toast.error('Find a patient first');
      return;
    }

    const clinicId = session.clinicId ?? `clinic-${session.userId.slice(0, 6)}`;
    const clinic = await db.clinics.get(clinicId);

    const matchedLot = INITIAL_VACCINE_LOTS.find((lot) => lot.lotNumber === values.lotNumber);
    const recordId = uuidv4();
    let autoDispute = false;
    let disputeReason = '';

    if (!matchedLot) {
      autoDispute = true;
      disputeReason = `Manual lot entry: ${values.lotNumber} is not in the recognized registry.`;
    } else if (matchedLot.vaccineName !== values.vaccineName) {
      autoDispute = true;
      disputeReason = `Lot/Vaccine mismatch: Lot ${values.lotNumber} is registered for ${matchedLot.vaccineName}, but used for ${values.vaccineName}.`;
    }

    const duplicate = history.find(
      (record) => record.vaccineName === values.vaccineName && record.doseNumber === values.doseNumber
    );
    if (duplicate) {
      toast.error('This vaccine and dose is already recorded for this patient.');
      return;
    }

    const lowerDoses = history
      .filter((record) => record.vaccineName === values.vaccineName)
      .map((record) => record.doseNumber)
      .sort((a, b) => a - b);

    const expectedDose = lowerDoses.length > 0 ? lowerDoses[lowerDoses.length - 1] + 1 : 1;
    if (values.doseNumber !== expectedDose) {
      toast('Dose sequence warning: the entered dose skips the expected order.');
    }

    const record = await createVaccination({
      patientId: patient.id,
      healthDropId: patient.healthDropId,
      vaccineName: values.vaccineName,
      lotNumber: values.lotNumber,
      doseNumber: values.doseNumber,
      dateAdministered: values.dateAdministered,
      administeredBy: session.userId,
      clinicId,
      clinicName: clinic?.name ?? 'Unassigned Clinic',
      gpsLat: gps.lat,
      gpsLng: gps.lng,
      notes: values.notes,
    });

    if (matchedLot) {
      matchedLot.dosesUsed += 1;
    }

    const today = new Date().toISOString().slice(0, 10);
    const workerTodayCount = (await db.vaccinations.where('administeredBy').equals(session.userId).toArray()).filter(
      (entry) => entry.dateAdministered === today
    ).length;

    if (autoDispute) {
      await db.disputes.put({
        id: uuidv4(),
        recordId: record.id,
        patientId: patient.id,
        raisedBy: 'system',
        reason: disputeReason,
        evidence: `Lot Number: ${values.lotNumber}, Selected Vaccine: ${values.vaccineName}`,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    } else if (workerTodayCount > 50) {
      await db.disputes.put({
        id: uuidv4(),
        recordId: record.id,
        patientId: patient.id,
        raisedBy: 'system',
        reason: 'High daily vaccination volume detected (>50).',
        evidence: `Worker ${session.userId} recorded ${workerTodayCount} doses today.`,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    }

    await db.syncQueue.put({
      id: uuidv4(),
      type: 'vaccination',
      recordId: record.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0,
    });

    toast.success('Vaccination recorded offline. Sync pending.');

    const records = await db.vaccinations.where('patientId').equals(patient.id).sortBy('dateAdministered');
    setHistory(records);
    const sameVaccineCount = records.filter((entry) => entry.vaccineName === values.vaccineName).length;

    reset({
      vaccineName: values.vaccineName,
      lotNumber: '',
      doseNumber: sameVaccineCount + 1,
      dateAdministered: new Date().toISOString().slice(0, 10),
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-semibold text-ui-text mb-4 uppercase tracking-wider">Patient Identification</h3>
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-ui-bg rounded-lg border border-ui-border">
            <button
              type="button"
              onClick={() => setLookupMode('phone')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                lookupMode === 'phone' ? 'bg-white shadow-sm text-who-blue' : 'text-ui-text-muted hover:text-ui-text'
              }`}
            >
              Phone Lookup
            </button>
            <button
              type="button"
              onClick={() => setLookupMode('qr')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                lookupMode === 'qr' ? 'bg-white shadow-sm text-who-blue' : 'text-ui-text-muted hover:text-ui-text'
              }`}
            >
              Scan QR Card
            </button>
          </div>

          {lookupMode === 'phone' ? (
            <PatientSearch
              onFound={onPatientFound}
              clinicId={session?.clinicId}
              allowCrossClinic={demoSession}
            />
          ) : (
            <QRScanner
              onScan={async (value) => {
                const found = await db.patients.where('healthDropId').equals(value).first();
                await onPatientFound(found ?? null);
              }}
              onManualPhoneLookup={async (phone) => {
                const found = await db.patients.where('parentPhone').equals(phone).first();
                await onPatientFound(found ?? null);
              }}
            />
          )}

          {!patient ? (
            <p className="text-sm text-ui-text-light text-center py-4">
              Patient not identified. Need a new record?{' '}
              <Link href="/health-worker/register" className="text-who-blue font-bold hover:underline">
                Register Patient
              </Link>
            </p>
          ) : (
            <div className="rounded-lg border border-who-blue/20 bg-who-blue-light p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-who-blue text-lg leading-tight">{patient.name}</p>
                <p className="font-mono text-xs text-who-blue/80 uppercase mt-1">{patient.healthDropId}</p>
                <p className="text-xs text-ui-text-muted mt-2">
                  Program: <span className="text-ui-text font-medium">{patient.programId ?? 'National Records Only'}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="badge-blue bg-white border border-who-blue/30">Active Case</div>
                <p className="text-[10px] text-ui-text-muted mt-2">DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {patient && (
        <>
          <Card>
            <h3 className="text-sm font-semibold text-ui-text mb-4 uppercase tracking-wider">Local Immunization History</h3>
            <VaccinationTimeline records={history} />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-ui-text mb-4 uppercase tracking-wider">New Immunization Entry</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ui-text">Vaccine Managed</label>
                  <select
                    className="input"
                    value={watch('vaccineName')}
                    onChange={(event) => {
                      setValue('vaccineName', event.target.value, { shouldValidate: true });
                      setValue('lotNumber', '');
                      setManualLotEntry('');
                      setManualLotMode(false);
                    }}
                  >
                    <option value="">Select vaccine...</option>
                    {VACCINES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                  {errors.vaccineName ? <p className="mt-1 text-xs text-who-red">{errors.vaccineName.message}</p> : null}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ui-text">Batch / Lot Number</label>
                  <select
                    className="input"
                    value={manualLotMode ? '__manual__' : selectedLotNumber}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (nextValue === '__manual__') {
                        setManualLotMode(true);
                        setValue('lotNumber', manualLotEntry, { shouldValidate: true });
                        return;
                      }
                      setManualLotMode(false);
                      setManualLotEntry('');
                      setValue('lotNumber', nextValue, { shouldValidate: true });
                    }}
                  >
                    <option value="">Select lot...</option>
                    {lotsForSelectedVaccine.map((lot) => (
                      <option key={lot.lotNumber} value={lot.lotNumber}>
                        {lot.lotNumber} ({lot.dosesRegistered - lot.dosesUsed} left)
                      </option>
                    ))}
                    <option value="__manual__">Enter lot manually...</option>
                  </select>

                  {manualLotMode && (
                    <input
                      className="input mt-2"
                      value={manualLotEntry}
                      onChange={(event) => {
                        setManualLotEntry(event.target.value);
                        setValue('lotNumber', event.target.value, { shouldValidate: true });
                      }}
                      placeholder="Enter verification code"
                    />
                  )}

                  {lotIsValid && (
                    <p className="mt-2 text-xs text-who-green font-medium">Verified lot: {remainingDoses} doses local stock</p>
                  )}
                  {lowStock && <div className="mt-1 badge-orange">Low stock warning</div>}
                  {lotIsUnknown && <p className="mt-2 text-xs text-who-red font-medium">Batch not recognized locally</p>}
                  {lotVaccineMismatch && <p className="mt-2 text-xs text-who-red font-medium">Batch mismatch with vaccine type</p>}
                  {errors.lotNumber ? <p className="mt-1 text-xs text-who-red">{errors.lotNumber.message}</p> : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ui-text">Dose Number</label>
                  <input type="number" min={1} max={5} {...register('doseNumber')} className="input" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ui-text">Date of Administration</label>
                  <input type="date" {...register('dateAdministered')} className="input" />
                  {errors.dateAdministered ? <p className="mt-1 text-xs text-who-red">{errors.dateAdministered.message}</p> : null}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ui-text">Clinical Notes (Internal Only)</label>
                <textarea
                  {...register('notes')}
                  className="input min-h-[80px]"
                  placeholder="Additional context about injection site, patient reaction, etc."
                />
              </div>

              <div className="p-3 bg-ui-bg rounded border border-ui-border flex items-center justify-between text-xs text-ui-text-muted">
                <span>Security Check: GPS Confirmed</span>
                <span className="font-mono text-ui-text">[{gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}]</span>
              </div>

              <Button type="submit" variant="primary" className="w-full h-12" loading={isSubmitting}>
                Record & Issue Verified Document
              </Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}



