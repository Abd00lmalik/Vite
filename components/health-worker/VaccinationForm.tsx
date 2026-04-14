'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QRScanner } from '@/components/shared/QRScanner';
import { PatientSearch } from './PatientSearch';
import { VaccinationTimeline } from '@/components/patient/VaccinationTimeline';
import { captureGPS } from '@/lib/utils/gps';
import { createVaccination } from '@/lib/db/db';
import { db } from '@/lib/db/schema';
import { DEMO_VACCINE_LOTS } from '@/lib/seed/demo';
import { useAuthStore } from '@/store/authStore';
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
  const [lookupMode, setLookupMode] = useState<'phone' | 'qr'>('phone');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<VaccinationRecord[]>([]);
  const [gps, setGps] = useState({ lat: 0, lng: 0 });

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
    () => DEMO_VACCINE_LOTS.filter((lot) => lot.vaccineName === selectedVaccine),
    [selectedVaccine]
  );

  useEffect(() => {
    if (!patient || !selectedVaccine) return;
    const sameVaccine = history.filter((record) => record.vaccineName === selectedVaccine);
    setValue('doseNumber', sameVaccine.length + 1, { shouldDirty: true });
  }, [history, patient, selectedVaccine, setValue]);

  const onPatientFound = async (found: Patient | null) => {
    setPatient(found);
    if (!found) {
      setHistory([]);
      return;
    }

    const records = await db.vaccinations.where('patientId').equals(found.id).sortBy('dateAdministered');
    setHistory(records);
  };

  const selectedLot = DEMO_VACCINE_LOTS.find((lot) => lot.lotNumber === selectedLotNumber);
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

    const matchedLot = DEMO_VACCINE_LOTS.find((lot) => lot.lotNumber === values.lotNumber);
    if (!matchedLot) {
      toast.error('Lot not in registry');
      return;
    }

    if (matchedLot.vaccineName !== values.vaccineName) {
      toast.error('Lot number does not match selected vaccine');
      return;
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
      clinicId: session.clinicId ?? 'clinic-001',
      clinicName: session.clinicId === 'clinic-002' ? 'Ibadan Community Clinic' : 'Kano Primary Health Post',
      gpsLat: gps.lat,
      gpsLng: gps.lng,
      notes: values.notes,
    });

    matchedLot.dosesUsed += 1;

    const today = new Date().toISOString().slice(0, 10);
    const workerTodayCount = (await db.vaccinations.where('administeredBy').equals(session.userId).toArray()).filter(
      (entry) => entry.dateAdministered === today
    ).length;

    if (workerTodayCount > 50) {
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
    <div className="space-y-4 pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Patient Lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={lookupMode === 'phone' ? 'primary' : 'outline'} onClick={() => setLookupMode('phone')}>
              Search by Phone
            </Button>
            <Button type="button" variant={lookupMode === 'qr' ? 'primary' : 'outline'} onClick={() => setLookupMode('qr')}>
              Scan QR Code
            </Button>
          </div>

          {lookupMode === 'phone' ? (
            <PatientSearch onFound={onPatientFound} />
          ) : (
            <QRScanner
              onScan={async (value) => {
                const found = await db.patients.where('healthDropId').equals(value).first();
                await onPatientFound(found ?? null);
              }}
            />
          )}

          {!patient ? (
            <p className="text-sm text-gray-600">
              Patient not found.{' '}
              <Link href="/health-worker/register" className="font-semibold text-teal-dark underline">
                Register them first -&gt;
              </Link>
            </p>
          ) : (
            <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-dark">
              <p className="font-semibold">{patient.name}</p>
              <p className="font-mono">{patient.healthDropId}</p>
              <p>DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
              <p>Program: {patient.programId ?? 'No program'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {patient ? (
        <Card>
          <CardHeader>
            <CardTitle>Vaccination History</CardTitle>
          </CardHeader>
          <CardContent>
            <VaccinationTimeline records={history} />
          </CardContent>
        </Card>
      ) : null}

      {patient ? (
        <Card>
          <CardHeader>
            <CardTitle>Vaccination Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Vaccine name</label>
                <Select
                  options={VACCINES.map((value) => ({ value, label: value }))}
                  value={watch('vaccineName')}
                  onChange={(event) => {
                    setValue('vaccineName', event.target.value, { shouldValidate: true });
                    setValue('lotNumber', '');
                  }}
                />
                {errors.vaccineName ? <p className="mt-1 text-sm text-red-600">{errors.vaccineName.message}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Lot number</label>
                <Input
                  list="lot-number-options"
                  {...register('lotNumber')}
                  placeholder="Type or select lot number"
                />
                <datalist id="lot-number-options">
                  {lotsForSelectedVaccine.map((lot) => (
                    <option key={lot.lotNumber} value={lot.lotNumber}>
                      {lot.lotNumber}
                    </option>
                  ))}
                </datalist>

                {lotIsValid ? (
                  <p className="mt-2 text-xs text-green-700">Valid lot - {remainingDoses} doses remaining</p>
                ) : null}
                {lowStock ? (
                  <div className="mt-2">
                    <Badge variant="warning">Low stock</Badge>
                  </div>
                ) : null}
                {lotIsUnknown ? <p className="mt-2 text-xs text-red-600">Lot not in registry</p> : null}
                {lotVaccineMismatch ? (
                  <p className="mt-2 text-xs text-red-600">Lot does not match the selected vaccine</p>
                ) : null}
                {errors.lotNumber ? <p className="mt-1 text-sm text-red-600">{errors.lotNumber.message}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Dose number</label>
                <Input type="number" min={1} max={5} {...register('doseNumber')} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Date administered</label>
                <Input type="date" {...register('dateAdministered')} />
                {errors.dateAdministered ? (
                  <p className="mt-1 text-sm text-red-600">{errors.dateAdministered.message}</p>
                ) : null}
              </div>

              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                Clinic: [{gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}]
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Notes (optional)</label>
                <Input {...register('notes')} placeholder="Any additional context" />
              </div>

              <Button type="submit" className="w-full" loading={isSubmitting}>
                Record Vaccination
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
