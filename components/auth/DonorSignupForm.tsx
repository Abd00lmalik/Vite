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
    organizationName: z.string().min(2, "Organization name is required"),
    contactName: z.string().min(2, "Contact person name is required"),
    email: z.string().email("Enter a valid professional email"),
    password: z.string().min(8, "Security requirement: Minimum 8 characters"),
    confirmPassword: z.string().min(8),
    country: z.string().min(2, "Country is required"),
    interests: z.array(z.string()).min(1, 'Choose at least one program interest'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof schema>;

function strengthLabel(password: string) {
  if (password.length === 0) return '';
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
      toast.error(result.error ?? 'Unable to establish donor identity');
      return;
    }

    login(buildSession(result.user));
    toast.success('Donor professional account created');
    router.push('/donor');
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-ui-text">Organization Name *</label>
          <Input {...register('organizationName')} placeholder="e.g. UNICEF Nigeria" />
          {errors.organizationName ? <p className="mt-1.5 text-xs font-medium text-who-red">{errors.organizationName.message}</p> : null}
        </div>

        <div>
           <label className="mb-1.5 block text-sm font-semibold text-ui-text">Contact Person *</label>
           <Input {...register('contactName')} placeholder="Enter full name" />
           {errors.contactName ? <p className="mt-1.5 text-xs font-medium text-who-red">{errors.contactName.message}</p> : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ui-text">Operational Country *</label>
          <Input {...register('country')} placeholder="e.g. Nigeria" />
          {errors.country ? <p className="mt-1.5 text-xs font-medium text-who-red">{errors.country.message}</p> : null}
        </div>
      </div>

      <div className="pt-4 border-t border-ui-border">
         <label className="mb-1.5 block text-sm font-semibold text-ui-text">Professional Email *</label>
         <Input type="email" {...register('email')} placeholder="donor.contact@org.org" />
         {errors.email ? <p className="mt-1.5 text-xs font-medium text-who-red">{errors.email.message}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <div className="pt-4 border-t border-ui-border">
        <p className="mb-3 text-sm font-semibold text-ui-text">Primary Program Interests *</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { id: 'vaccination', label: 'Vaccination' },
            { id: 'antenatal',   label: 'Antenatal' },
            { id: 'child growth',label: 'Child Growth' },
          ].map((interest) => (
            <button
               key={interest.id}
               type="button"
               onClick={() => toggleInterest(interest.id)}
               className={`flex items-center justify-center px-3 py-2.5 rounded border text-xs font-medium transition-colors
                          ${interests.includes(interest.id) 
                            ? 'bg-who-blue text-white border-who-blue' 
                            : 'bg-white text-ui-text border-ui-border hover:bg-ui-bg'}`}
            >
              {interest.label}
            </button>
          ))}
        </div>
        {errors.interests ? <p className="mt-1.5 text-xs font-medium text-who-red">{errors.interests.message}</p> : null}
      </div>

      <div className="pt-2">
        <Button type="submit" variant="primary" className="w-full h-12 text-base" loading={isSubmitting}>
          Create Donor Profile
        </Button>
      </div>

      <p className="text-xs text-ui-text-muted italic text-center">
        * Donors can fund programs using XION Testnet-2 once the account is established.
      </p>
    </form>
  );
}



