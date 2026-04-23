'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { QRDisplay } from '@/components/shared/QRDisplay';
import { captureGPS } from '@/lib/utils/gps';
import { db } from '@/lib/db/schema';
import { createPatient } from '@/lib/db/db';
import { registerUser } from '@/lib/auth/session';
import { SMS } from '@/lib/notifications/sms';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  childName: z.string().min(2, "Name is required"),
  dateOfBirth: z.string().refine((value) => new Date(value).getTime() <= Date.now(), {
    message: 'Date cannot be in the future',
  }),
  sex: z.enum(['M', 'F', 'Other']),
  parentName: z.string().min(2, "Parent name is required"),
  parentPhone: z.string().regex(/^\+\d{8,15}$/, 'Use international format, e.g. +2348012345678'),
  programId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function PatientForm() {
  const { session } = useAuthStore();
  const [step, setStep] = useState(1);
  const [createdHealthId, setCreatedHealthId] = useState<string | null>(null);
  const [createdPatientName, setCreatedPatientName] = useState<string | null>(null);

  const programs = useLiveQuery(() => db.programs.where('status').equals('active').toArray(), []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sex: 'M',
      parentPhone: '+234',
      programId: 'program-init-001',
    },
  });

  const selectedProgram = useMemo(
    () => programs?.find((program) => program.id === watch('programId')),
    [programs, watch]
  );

  const onSubmit = async (values: FormValues) => {
    if (!session) {
      toast.error('You must be signed in as a health worker');
      return;
    }

    const existingPatient = await db.patients.where('parentPhone').equals(values.parentPhone).first();
    if (existingPatient) {
      toast.error('This phone number is already registered. Search for the patient instead.');
      return;
    }

    const gps = await captureGPS();

    let patientUser = await db.users.where('phone').equals(values.parentPhone).first();
    if (!patientUser) {
      const result = await registerUser({
        role: 'patient',
        name: values.parentName,
        phone: values.parentPhone,
      });
      patientUser = result.user ?? undefined;
    }

    let patient;
    try {
      patient = await createPatient({
        userId: patientUser?.id,
        name: values.childName,
        dateOfBirth: values.dateOfBirth,
        sex: values.sex,
        parentName: values.parentName,
        parentPhone: values.parentPhone,
        clinicId: session.clinicId ?? 'clinic-001',
        clinicName: session.clinicId === 'clinic-002' ? 'Ibadan Community Clinic' : 'Kano Primary Health Post',
        registeredBy: session.userId,
        programId: values.programId || undefined,
        gpsLat: gps.lat,
        gpsLng: gps.lng,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Patient already registered')) {
        toast.error('This phone number is already registered. Search for the patient instead.');
        return;
      }
      toast.error('Unable to register patient. Please try again.');
      return;
    }

    const amount = selectedProgram?.milestones?.[0]?.grantAmount ?? 0;

    await SMS.registration(
      values.parentPhone,
      values.childName,
      selectedProgram?.name ?? 'Record-only enrollment',
      patient.healthDropId,
      amount
    );

    await db.auditLogs.put({
      id: uuidv4(),
      entityId: patient.id,
      entityType: 'patient',
      action: `Patient registered${values.programId ? ` and enrolled in ${values.programId}` : ''}`,
      performedBy: session.userId,
      timestamp: new Date().toISOString(),
    });

    setCreatedHealthId(patient.healthDropId);
    setCreatedPatientName(patient.name);
    toast.success('Patient registered. Saved offline - sync pending.');
  };

  if (createdHealthId && createdPatientName) {
    return (
      <div className="space-y-6">
        <Card className="text-center">
          <p className="text-sm text-ui-text-muted mb-2">Digital Health ID Issued</p>
          <p className="text-4xl font-bold text-who-blue tracking-tight">{createdHealthId}</p>
          <div className="mt-4 inline-flex items-center gap-1.5 badge-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-who-blue animate-pulse" />
            Registry Sync Pending
          </div>
        </Card>

        <div className="bg-white p-6 rounded-lg border border-ui-border flex flex-col items-center">
          <QRDisplay healthDropId={createdHealthId} patientName={createdPatientName} size={200} />
          <p className="mt-4 text-xs text-ui-text-muted">Present this QR at any WHO-partner clinic</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => { setCreatedHealthId(null); setCreatedPatientName(null); }}>
            Register Another
          </Button>
          <Link href="/health-worker/vaccinate">
            <Button variant="primary" className="w-full">Record Vaccination</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between border-b border-ui-border pb-4">
          <h3 className="text-base font-bold text-ui-text">Step {step} of 2</h3>
          <span className="badge-blue">New Enrollment</span>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ui-text">Child's full name</label>
                <input {...register('childName')} className="input" placeholder="e.g. Ama Mensah" />
                {errors.childName ? <p className="mt-1 text-xs text-who-red">{errors.childName.message}</p> : null}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ui-text">Date of birth</label>
                <input type="date" {...register('dateOfBirth')} className="input" />
                {errors.dateOfBirth ? <p className="mt-1 text-xs text-who-red">{errors.dateOfBirth.message}</p> : null}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ui-text">Sex</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'M', label: 'Male' },
                  { value: 'F', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex h-11 cursor-pointer items-center justify-center rounded border text-sm font-medium transition-all
                                ${watch('sex') === option.value
                                  ? 'border-who-blue bg-who-blue-light text-who-blue'
                                  : 'border-ui-border text-ui-text-light hover:border-ui-text'}`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      checked={watch('sex') === option.value}
                      onChange={(event) => setValue('sex', event.target.value as FormValues['sex'])}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ui-text">Guardian name</label>
                <input {...register('parentName')} className="input" placeholder="e.g. Kofi Mensah" />
                {errors.parentName ? <p className="mt-1 text-xs text-who-red">{errors.parentName.message}</p> : null}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ui-text">Guardian phone</label>
                <input {...register('parentPhone')} className="input" placeholder="+234..." />
                {errors.parentPhone ? <p className="mt-1 text-xs text-who-red">{errors.parentPhone.message}</p> : null}
              </div>
            </div>

            <Button type="button" variant="primary" className="w-full mt-4" onClick={() => setStep(2)}>
              Next: Program Details
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ui-text">Select Humanitarian Program</label>
              <select
                className="input"
                value={watch('programId')}
                onChange={(event) => setValue('programId', event.target.value)}
              >
                <option value="">No program - record only</option>
                {(programs ?? []).map((program) => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </select>
            </div>

            {selectedProgram ? (
              <div className="rounded bg-who-blue-light border border-who-blue/20 p-4">
                <p className="text-xs font-bold text-who-blue uppercase mb-2">Milestone Grants Eligibility:</p>
                <div className="space-y-1">
                  {selectedProgram.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex justify-between text-sm text-ui-text">
                      <span>{milestone.name}</span>
                      <span className="font-bold">${milestone.grantAmount}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded bg-gray-50 border border-gray-200 p-4 text-sm text-ui-text-muted">
                Patient will be registered for records only. No conditional grants will be attached.
              </div>
            )}

            <div className="p-3 bg-ui-bg rounded text-xs text-ui-text-muted flex items-center justify-between">
              <span>Primary Clinic ID</span>
              <span className="font-mono text-ui-text">{session?.clinicId ?? 'clinic-001'}</span>
            </div>

            <div className="grid gap-3 pt-2">
              <Button type="submit" variant="primary" loading={isSubmitting} className="w-full">
                Register & Enroll Patient
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)}>
                Back to Personal Info
              </Button>
            </div>
          </div>
        )}
      </form>
    </Card>
  );
}



