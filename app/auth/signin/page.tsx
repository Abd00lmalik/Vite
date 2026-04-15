'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RoleSelector, type RoleChoice } from '@/components/auth/RoleSelector';
import { PatientLoginForm } from '@/components/auth/PatientLoginForm';
import { StaffLoginForm } from '@/components/auth/StaffLoginForm';
import { Card, CardContent } from '@/components/ui/card';

export default function SignInPage() {
  const [role, setRole] = useState<RoleChoice | null>(null);

  useEffect(() => {
    const roleParam = new URLSearchParams(window.location.search).get('role');
    if (roleParam === 'patient' || roleParam === 'health-worker' || roleParam === 'donor') {
      setRole(roleParam);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50 to-white px-4 py-8">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Image src="/logo.png" alt="VITE logo" width={42} height={42} className="rounded-md" />
          <div>
            <h1 className="text-xl font-bold text-teal-dark">VITE Sign In</h1>
            <p className="text-xs text-gray-600">Secure role-based access</p>
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
                  {role === 'patient' ? <PatientLoginForm /> : <StaffLoginForm role={role} />}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <p className="text-center text-sm text-gray-600">
              New to VITE?{' '}
              <Link href="/auth/signup" className="font-semibold text-teal-dark underline">
                Create account
              </Link>
            </p>

            <div className="mt-6 rounded-xl border border-teal-primary/20 bg-teal-pale p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-teal-dark">Demo Credentials</p>
              <div className="space-y-1.5 text-xs text-teal-dark">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">Health Worker:</span>
                  <span className="font-mono text-right">amara@clinic-kano.ng / Demo1234!</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="font-medium">Donor / NGO:</span>
                  <span className="font-mono text-right">donor@unicef-ng.org / Demo1234!</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="font-medium">Patient:</span>
                  <span className="font-mono text-right">+2348012345001 (phone only)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
