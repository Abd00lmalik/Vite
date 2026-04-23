'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { db } from '@/lib/db/schema';
import { buildSession, registerUser } from '@/lib/auth/session';
import { useAuthStore } from '@/store/authStore';
import { CLINIC_LOCATIONS } from '@/lib/data/clinicLocations';

const schema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Enter a valid professional email"),
    password: z.string().min(8, "Security requirement: Minimum 8 characters"),
    confirmPassword: z.string().min(8),
    clinicName: z.string().min(2, "Clinic name is required"),
    clinicLocation: z.string().min(2, "Please select a location"),
    staffId: z.string().min(3, "Professional staff ID required"),
    roleTitle: z.string().min(2, "Specify your role title"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

function strengthLabel(password: string) {
  if (password.length === 0) return '';
  if (password.length < 8) return 'Weak';
  if (!/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) return 'Fair';
  return 'Strong';
}

export function HealthWorkerSignupForm() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedLGA, setSelectedLGA] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clinicLocation: '',
    },
  });

  const password = watch('password', '');
  const strength = useMemo(() => strengthLabel(password), [password]);

  const countryData = CLINIC_LOCATIONS.find((country) => country.id === selectedCountry);
  const stateData = countryData?.states.find((state) => state.id === selectedState);

  const onSubmit = async (values: FormValues) => {
    const clinicId = `clinic-${values.clinicName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}`;
    const existingClinic = await db.clinics.where('name').equalsIgnoreCase(values.clinicName).first();

    if (!existingClinic) {
      await db.clinics.put({
        id: clinicId,
        name: values.clinicName,
        email: values.email,
        location: values.clinicLocation,
        createdAt: new Date().toISOString(),
      });
    }

    const result = await registerUser({
      role: 'health-worker',
      name: values.fullName,
      email: values.email,
      password: values.password,
      clinicId: existingClinic?.id ?? clinicId,
      clinicName: values.clinicName,
      idVerificationField: values.staffId,
      roleTitle: values.roleTitle,
    });

    if (!result.user) {
      toast.error(result.error ?? 'Unable to establish portal credentials');
      return;
    }

    await db.auditLogs.put({
      id: uuidv4(),
      entityId: result.user.id,
      entityType: 'user',
      action: `Health worker onboarded at ${values.clinicName}. Role: ${values.roleTitle}`,
      performedBy: result.user.id,
      timestamp: new Date().toISOString(),
    });

    login(buildSession(result.user));
    toast.success('Professional account created successfully');
    router.push('/health-worker');
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" {...register('clinicLocation')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-ui-text">Staff Full Name *</label>
          <Input {...register('fullName')} placeholder="Enter full name" />
          {errors.fullName ? <p className="mt-1.5 text-xs font-medium text-who-red">{errors.fullName.message}</p> : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ui-text">Professional Email *</label>
          <Input type="email" {...register('email')} placeholder="name@clinic.org" />
          {errors.email ? <p className="mt-1.5 text-xs font-medium text-who-red">{errors.email.message}</p> : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ui-text">Role Title *</label>
          <Input {...register('roleTitle')} placeholder="e.g. Senior Nurse" />
          {errors.roleTitle ? <p className="mt-1.5 text-xs font-medium text-who-red">{errors.roleTitle.message}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4 border-t border-ui-border">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-ui-text">Primary Clinic Name *</label>
          <Input {...register('clinicName')} placeholder="Enter registered clinic name" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ui-text">Country *</label>
          <Select
            value={selectedCountry}
            onChange={(event) => {
              setSelectedCountry(event.target.value);
              setSelectedState('');
              setSelectedLGA('');
              setValue('clinicLocation', '', { shouldValidate: true });
            }}
            placeholder="Select country"
            options={CLINIC_LOCATIONS.map((country) => ({ value: country.id, label: country.name }))}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ui-text">State / Region *</label>
          <Select
            value={selectedState}
            onChange={(event) => {
              setSelectedState(event.target.value);
              setSelectedLGA('');
              setValue('clinicLocation', '', { shouldValidate: true });
            }}
            placeholder="Select state"
            disabled={!countryData}
            options={(countryData?.states ?? []).map((state) => ({ value: state.id, label: state.name }))}
          />
        </div>

        <div>
           <label className="mb-1.5 block text-sm font-semibold text-ui-text">LGA / District *</label>
          <Select
            value={selectedLGA}
            onChange={(event) => {
              const lgaId = event.target.value;
              setSelectedLGA(lgaId);
              const lga = stateData?.lgas.find((item) => item.id === lgaId);
              if (countryData && stateData && lga) {
                setValue('clinicLocation', `${countryData.name} > ${stateData.name} > ${lga.name}`, {
                  shouldValidate: true,
                });
              }
            }}
            placeholder="Select area"
            disabled={!stateData}
            options={(stateData?.lgas ?? []).map((lga) => ({ value: lga.id, label: lga.name }))}
          />
          {errors.clinicLocation ? <p className="mt-1.5 text-xs font-medium text-who-red">{errors.clinicLocation.message}</p> : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ui-text">Staff / License ID *</label>
          <Input {...register('staffId')} placeholder="Enter ID number" />
          {errors.staffId ? <p className="mt-1.5 text-xs font-medium text-who-red">{errors.staffId.message}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4 border-t border-ui-border">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ui-text">Password *</label>
          <Input type="password" {...register('password')} placeholder="Min 8 characters" />
          {strength && (
            <p className={`mt-1.5 text-xs font-bold ${
              strength === 'Strong' ? 'text-who-green' : 
              strength === 'Fair' ? 'text-who-orange' : 'text-who-red'
            }`}>
              Strength: {strength}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ui-text">Confirm Password *</label>
          <Input type="password" {...register('confirmPassword')} placeholder="Repeat password" />
          {errors.confirmPassword ? <p className="mt-1.5 text-xs font-medium text-who-red">{errors.confirmPassword.message}</p> : null}
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" variant="primary" className="w-full h-12 text-base" loading={isSubmitting}>
          Register Professional Identity
        </Button>
      </div>

      <p className="text-xs text-ui-text-muted italic text-center">
        * Registration will be subject to admin verification via the IssuerRegistry contract.
      </p>
    </form>
  );
}



