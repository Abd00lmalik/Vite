'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { QRDisplay } from '@/components/shared/QRDisplay';
import { db } from '@/lib/db/schema';
import { SMS } from '@/lib/notifications/sms';
import { registerUser, buildSession } from '@/lib/auth/session';
import { useAuthStore } from '@/store/authStore';
import type { Patient } from '@/types';

const schema = z.object({
  childName: z.string().min(2, "Child's name is required for identification"),
  dateOfBirth: z.string().refine((value) => new Date(value).getTime() <= Date.now(), {
    message: 'Date of birth cannot be in the future',
  }),
  sex: z.enum(['M', 'F', 'Other']),
  parentName: z.string().min(2, 'Guardian name is required'),
  parentPhone: z.string().regex(/^\+234\d{10}$/, 'Use +234 followed by 10 digits'),
});

type FormValues = z.infer<typeof schema>;

function buildHealthId(id: string) {
  return `HD-${id.replace(/-/g, '').slice(-6).toUpperCase()}`;
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
      toast.error(result.error ?? 'Unable to establish portal identity');
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
      clinicId: 'self-service',
      clinicName: 'Self Registration',
      registeredBy: result.user.id,
      registeredAt: new Date().toISOString(),
      programId: undefined,
      syncStatus: 'pending',
      gpsLat: 6.5244,
      gpsLng: 3.3792,
    };

    await db.patients.put(patient);

    await SMS.registration(
      values.parentPhone,
      values.childName,
      'VITE Patient Registry',
      patient.healthDropId,
      0
    );

    setCreatedPatient(patient);
    login(buildSession(result.user));
    toast.success(`Patient enrollment complete: ${patient.healthDropId}`);
    
    // Redirect after a short delay to allow viewing the QR
    setTimeout(() => {
      router.push('/patient');
    }, 3000);
  };

  if (createdPatient) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="badge-green px-4 py-2 text-sm font-bold">
           Enrollment Confirmed
        </div>
        <div className="flex justify-center">
          <QRDisplay healthDropId={createdPatient.healthDropId} patientName={createdPatient.name} size={200} />
        </div>
        <div className="p-4 bg-ui-bg rounded-lg border border-ui-border">
           <p className="text-xs text-ui-text-muted mb-1 uppercase font-bold">Health Identifier</p>
           <p className="text-xl font-bold text-who-blue font-mono">{createdPatient.healthDropId}</p>
        </div>
        <p className="text-sm text-ui-text-light">
          Identity established on XION Testnet-2. Redirecting to Patient Wallet...
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-ui-text">Child's Full Name *</label>
          <input {...register('childName')} className="input" placeholder="Enter full name" />
          {errors.childName ? <p className="mt-1.5 text-xs font-medium text-who-red">{errors.childName.message}</p> : null}
        </div>
        
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ui-text">Date of Birth *</label>
          <input type="date" {...register('dateOfBirth')} className="input" />
          {errors.dateOfBirth ? <p className="mt-1.5 text-xs font-medium text-who-red">{errors.dateOfBirth.message}</p> : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ui-text">Sex *</label>
          <div className="flex gap-2">
            {['M', 'F', 'Other'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setValue('sex', s as FormValues['sex'])}
                className={`flex-1 py-2.5 rounded border text-sm font-medium transition-colors
                           ${watch('sex') === s 
                             ? 'bg-who-blue text-white border-who-blue' 
                             : 'bg-white text-ui-text border-ui-border hover:bg-ui-bg'}`}
              >
                {s === 'M' ? 'Male' : s === 'F' ? 'Female' : 'Other'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-ui-border">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ui-text">Parent/Guardian Name *</label>
            <input {...register('parentName')} className="input" placeholder="Enter guardian name" />
            {errors.parentName ? <p className="mt-1.5 text-xs font-medium text-who-red">{errors.parentName.message}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ui-text">Primary Phone Number (+234) *</label>
            <input {...register('parentPhone')} className="input" placeholder="+2348000000000" />
            {errors.parentPhone ? <p className="mt-1.5 text-xs font-medium text-who-red">{errors.parentPhone.message}</p> : null}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" variant="primary" className="w-full h-12 text-base" loading={isSubmitting}>
          Finalize Enrollment
        </Button>
      </div>
      
      <p className="text-xs text-ui-text-muted italic text-center">
        * Registration will be verified on-chain and SMS confirmation will be sent to the parent number.
      </p>
    </form>
  );
}



