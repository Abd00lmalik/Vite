'use client';

import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { loginWithEmail } from '@/lib/auth/session';
import type { UserRole } from '@/types';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

interface StaffLoginFormProps {
  role: 'health-worker' | 'donor';
}

const homeByRole: Record<UserRole, string> = {
  patient: '/patient',
  'health-worker': '/health-worker',
  donor: '/donor',
  admin: '/donor',
};

export function StaffLoginForm({ role }: StaffLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    const session = await loginWithEmail(values.email, values.password);

    if (!session) {
      toast.error('Invalid credentials');
      return;
    }

    if (session.role !== role) {
      toast.error(`This account is registered as ${session.role}.`);
      router.push(homeByRole[session.role]);
      return;
    }

    login(session);
    toast.success('Signed in successfully');
    router.push(homeByRole[session.role]);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
        <Input {...register('email')} type="email" placeholder="name@org.org" />
        {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
        <div className="relative">
          <Input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Enter password" />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password ? <p className="mt-1 text-sm text-red-600">{errors.password.message}</p> : null}
      </div>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Sign In
      </Button>

      <p className="text-sm text-gray-600">
        Need an account?{' '}
        <Link href="/auth/signup" className="font-semibold text-teal-dark underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}


