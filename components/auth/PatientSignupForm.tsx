'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { QRDisplay } from '@/components/shared/QRDisplay';
import { db } from '@/lib/db/schema';
import { SMS } from '@/lib/notifications/sms';
import { registerUser, buildSession } from '@/lib/auth/session';
import { useAuthStore } from '@/store/authStore';
import type { Patient } from '@/types';

const schema = z.object({
  childName: z.string().min(2, 'Child name is required'),
  dateOfBirth: z.string().refine((value) => new Date(value).getTime() <= Date.now(), {
    message: 'Date of birth cannot be in the future',
  }),
  sex: z.enum(['M', 'F', 'Other']),
  parentName: z.string().min(2, 'Parent name is required'),
  parentPhone: z.string().regex(/^\+234\d{10}$/, 'Use +234 followed by 10 digits'),
});

type FormValues = z.infer<typeof schema>;

function buildHealthId(id: string) {
  return `HD-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

export function PatientSignupForm() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      parentPhone: '+234',
      sex: 'M',
    },
  });

  const onSubmit = async (values: FormValues) => {
    const result = await registerUser({
      role: 'patient',
      name: values.parentName,
      phone: values.parentPhone,
    });

    if (!result.user) {
      toast.error(result.error ?? 'Unable to create account');
      return;
    }

    const patientId = uuidv4();
    const patient: Patient = {
      id: patientId,
      userId: result.user.id,
      healthDropId: buildHealthId(patientId),
      name: values.childName,
      dateOfBirth: values.dateOfBirth,
      sex: values.sex,
      parentName: values.parentName,
      parentPhone: values.parentPhone,
      clinicId: 'clinic-001',
      clinicName: 'Kano Primary Health Post',
      registeredBy: 'hw-001',
      registeredAt: new Date().toISOString(),
      programId: 'program-demo-001',
      syncStatus: 'pending',
      gpsLat: 6.5244,
      gpsLng: 3.3792,
    };

    await db.patients.put(patient);

    await SMS.registration(
      values.parentPhone,
      values.childName,
      'UNICEF Nigeria Immunisation Incentive Program',
      patient.healthDropId,
      3
    );

    setCreatedPatient(patient);
    login(buildSession(result.user));
    toast.success(`Account created. Health ID: ${patient.healthDropId}`);

    setTimeout(() => {
      router.push('/patient');
    }, 1800);
  };

  if (createdPatient) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Registration complete. Redirecting to your dashboard...
        </div>
        <QRDisplay healthDropId={createdPatient.healthDropId} patientName={createdPatient.name} size={180} />
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
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
        <label className="mb-1 block text-sm font-medium text-gray-700">Parent/guardian name</label>
        <Input {...register('parentName')} />
        {errors.parentName ? <p className="mt-1 text-sm text-red-600">{errors.parentName.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Parent phone (+234)</label>
        <Input {...register('parentPhone')} />
        {errors.parentPhone ? <p className="mt-1 text-sm text-red-600">{errors.parentPhone.message}</p> : null}
      </div>
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Register and continue
      </Button>
    </form>
  );
}


