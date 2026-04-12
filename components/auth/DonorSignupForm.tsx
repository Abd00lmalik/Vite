'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { buildSession, registerUser } from '@/lib/auth/session';
import { useAuthStore } from '@/store/authStore';

const schema = z
  .object({
    organizationName: z.string().min(2),
    contactName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    country: z.string().min(2),
    interests: z.array(z.string()).min(1, 'Choose at least one interest'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof schema>;

function strengthLabel(password: string) {
  if (password.length < 8) return 'Weak';
  if (!/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) return 'Fair';
  return 'Strong';
}

export function DonorSignupForm() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      interests: ['vaccination'],
      country: 'Nigeria',
    },
  });

  const interests = watch('interests');
  const password = watch('password', '');
  const strength = useMemo(() => strengthLabel(password), [password]);

  const toggleInterest = (interest: string) => {
    const next = interests.includes(interest)
      ? interests.filter((item) => item !== interest)
      : [...interests, interest];
    setValue('interests', next, { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    const result = await registerUser({
      role: 'donor',
      name: values.contactName,
      email: values.email,
      password: values.password,
      organizationName: values.organizationName,
      programPreferences: values.interests,
    });

    if (!result.user) {
      toast.error(result.error ?? 'Unable to register donor');
      return;
    }

    login(buildSession(result.user));
    toast.success('Donor account created');
    router.push('/donor');
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Organisation name</label>
        <Input {...register('organizationName')} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Contact person name</label>
        <Input {...register('contactName')} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
        <Input type="email" {...register('email')} />
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
        <label className="mb-1 block text-sm font-medium text-gray-700">Country</label>
        <Input {...register('country')} />
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-gray-700">Program interest</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {['vaccination', 'antenatal', 'child growth'].map((interest) => (
            <label key={interest} className="flex items-center gap-2 rounded-md border border-gray-200 p-2 text-sm">
              <input
                type="checkbox"
                checked={interests.includes(interest)}
                onChange={() => toggleInterest(interest)}
              />
              {interest}
            </label>
          ))}
        </div>
        {errors.interests ? <p className="mt-1 text-sm text-red-600">{errors.interests.message}</p> : null}
      </div>
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Create donor account
      </Button>
    </form>
  );
}


