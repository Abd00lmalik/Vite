'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RoleSelector, type RoleChoice } from '@/components/auth/RoleSelector';
import { DonorSignupForm } from '@/components/auth/DonorSignupForm';
import { HealthWorkerSignupForm } from '@/components/auth/HealthWorkerSignupForm';
import { PatientSignupForm } from '@/components/auth/PatientSignupForm';
import { Card, CardContent } from '@/components/ui/card';

export default function SignUpPage() {
  const [role, setRole] = useState<RoleChoice | null>(null);

  useEffect(() => {
    const roleParam = new URLSearchParams(window.location.search).get('role');
    if (roleParam === 'patient' || roleParam === 'health-worker' || roleParam === 'donor') {
      setRole(roleParam);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50 to-white px-4 py-8">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Image src="/logo.png" alt="VITE logo" width={42} height={42} className="rounded-md" />
          <div>
            <h1 className="text-xl font-bold text-teal-dark">Create VITE Account</h1>
            <p className="text-xs text-gray-600">Role-specific onboarding</p>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4 p-4">
            {!role ? <RoleSelector value={role ?? undefined} onChange={setRole} /> : null}

            <AnimatePresence mode="wait">
              {role ? (
                <motion.div
                  key={role}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  <button
                    type="button"
                    className="text-sm text-teal-dark underline"
                    onClick={() => setRole(null)}
                  >
                    Back to role selection
                  </button>

                  {role === 'patient' ? <PatientSignupForm /> : null}
                  {role === 'health-worker' ? <HealthWorkerSignupForm /> : null}
                  {role === 'donor' ? <DonorSignupForm /> : null}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-semibold text-teal-dark underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
