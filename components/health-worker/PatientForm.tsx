'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QRDisplay } from '@/components/shared/QRDisplay';
import { captureGPS } from '@/lib/utils/gps';
import { db } from '@/lib/db/schema';
import { createPatient } from '@/lib/db/db';
import { registerUser } from '@/lib/auth/session';
import { SMS } from '@/lib/notifications/sms';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  childName: z.string().min(2),
  dateOfBirth: z.string().refine((value) => new Date(value).getTime() <= Date.now(), {
    message: 'Date cannot be in the future',
  }),
  sex: z.enum(['M', 'F', 'Other']),
  parentName: z.string().min(2),
  parentPhone: z.string().regex(/^\+234\d{10}$/, 'Use +234 followed by 10 digits'),
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
      programId: 'program-demo-001',
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

    const patient = await createPatient({
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
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">Health ID</p>
            <p className="font-mono text-2xl font-bold text-teal-dark">{createdHealthId}</p>
            <div className="mt-3 inline-flex">
              <Badge variant="pending">Saved offline - will sync when connected</Badge>
            </div>
          </CardContent>
        </Card>

        <QRDisplay healthDropId={createdHealthId} patientName={createdPatientName} />

        <div className="grid gap-2 sm:grid-cols-2">
          <Button onClick={() => { setCreatedHealthId(null); setCreatedPatientName(null); }} className="w-full">
            Register Another Patient
          </Button>
          <Link href="/health-worker/vaccinate">
            <Button variant="outline" className="w-full">Record Vaccination Now</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Step {step} of 2</h3>
          <Badge variant="active">Patient Enrollment</Badge>
        </div>

        {step === 1 ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Child's full name</label>
              <Input {...register('childName')} />
              {errors.childName ? <p className="mt-1 text-sm text-red-600">{errors.childName.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date of birth</label>
              <Input type="date" {...register('dateOfBirth')} />
              {errors.dateOfBirth ? <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Sex</label>
              <Select
                options={[
                  { value: 'M', label: 'Male' },
                  { value: 'F', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
                value={watch('sex')}
                onChange={(event) => setValue('sex', event.target.value as FormValues['sex'])}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Parent/guardian full name</label>
              <Input {...register('parentName')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Parent phone number</label>
              <Input {...register('parentPhone')} />
              {errors.parentPhone ? <p className="mt-1 text-sm text-red-600">{errors.parentPhone.message}</p> : null}
            </div>
            <Button type="button" className="w-full" onClick={() => setStep(2)}>
              Continue to Program Enrollment
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Program enrollment</label>
              <Select
                options={[
                  { value: '', label: 'No program - record only' },
                  ...(programs ?? []).map((program) => ({ value: program.id, label: program.name })),
                ]}
                value={watch('programId')}
                onChange={(event) => setValue('programId', event.target.value)}
              />
            </div>

            {selectedProgram ? (
              <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-dark">
                {selectedProgram.milestones.map((milestone) => (
                  <p key={milestone.id}>
                    {milestone.name}: ${milestone.grantAmount}
                  </p>
                ))}
              </div>
            ) : null}

            <p className="text-sm text-gray-600">Clinic: {session?.clinicId ?? 'clinic-001'}</p>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="submit" className="w-full" loading={isSubmitting}>
                Register Patient
              </Button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}


