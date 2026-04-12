'use client';

import { useMemo } from 'react';
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

const schema = z
  .object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    clinicName: z.string().min(2),
    clinicLocation: z.string().min(2),
    staffId: z.string().min(3),
    roleTitle: z.string().min(2),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

function strengthLabel(password: string) {
  if (password.length < 8) return 'Weak';
  if (!/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) return 'Fair';
  return 'Strong';
}

export function HealthWorkerSignupForm() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const password = watch('password', '');
  const strength = useMemo(() => strengthLabel(password), [password]);

  const onSubmit = async (values: FormValues) => {
    const clinicId = `clinic-${values.clinicName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}`;
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
      toast.error(result.error ?? 'Unable to register');
      return;
    }

    await db.auditLogs.put({
      id: uuidv4(),
      entityId: result.user.id,
      entityType: 'user',
      action: `Health worker onboarded at ${values.clinicName}`,
      performedBy: result.user.id,
      timestamp: new Date().toISOString(),
    });

    login(buildSession(result.user));
    toast.success('Health worker account created');
    router.push('/health-worker');
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
        <Input {...register('fullName')} />
        {errors.fullName ? <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
        <Input type="email" {...register('email')} />
        {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
        <Input type="password" {...register('password')} />
        <p className="mt-1 text-xs text-gray-500">Strength: {strength}</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Confirm password</label>
        <Input type="password" {...register('confirmPassword')} />
        {errors.confirmPassword ? <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Clinic name</label>
        <Input {...register('clinicName')} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Clinic location (LGA/State)</label>
        <Select
          options={[
            { value: 'Nassarawa, Kano', label: 'Nassarawa, Kano' },
            { value: 'Ibadan North, Oyo', label: 'Ibadan North, Oyo' },
            { value: 'Mushin, Lagos', label: 'Mushin, Lagos' },
          ]}
          {...register('clinicLocation')}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Staff ID / verification</label>
        <Input {...register('staffId')} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Role title</label>
        <Input {...register('roleTitle')} />
      </div>
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Create account
      </Button>
    </form>
  );
}


