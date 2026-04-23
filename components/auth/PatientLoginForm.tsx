'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { loginWithPhone } from '@/lib/auth/session';

const schema = z.object({
  phone: z.string().regex(/^\+234\d{10}$/, 'Use +234 followed by 10 digits'),
});

type FormValues = z.infer<typeof schema>;

export function PatientLoginForm() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '+234' },
  });

  const onSubmit = async (values: FormValues) => {
    const session = await loginWithPhone(values.phone);
    if (!session) {
      toast.error('Phone number not registered. Please sign up first.');
      return;
    }

    login(session);
    toast.success('Record found. Redirecting...');
    router.push('/patient');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ui-text">
          Registered Phone Number
        </label>
        <input 
          {...register('phone')} 
          placeholder="+2348012345678" 
          className="input"
        />
        {errors.phone ? (
          <p className="mt-1.5 text-xs font-medium text-who-red">{errors.phone.message}</p>
        ) : null}
      </div>

      <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
        Find Record & Access Wallet
      </Button>

      <p className="text-center text-sm text-ui-text-light">
        Don't have a record?{' '}
        <Link href="/auth/signup?role=patient" className="font-bold text-who-blue hover:underline">
          Register Patient
        </Link>
      </p>
    </form>
  );
}



