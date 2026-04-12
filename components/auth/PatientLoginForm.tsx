'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Phone number</label>
        <Input {...register('phone')} placeholder="+2348012345678" />
        {errors.phone ? <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p> : null}
      </div>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Find my record
      </Button>

      <p className="text-sm text-gray-600">
        No account found?{' '}
        <Link href="/auth/signup" className="font-semibold text-teal-dark underline">
          Register here \u2192
        </Link>
      </p>
    </form>
  );
}



