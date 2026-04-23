'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RoleSelector, type RoleChoice } from '@/components/auth/RoleSelector';
import { DonorSignupForm } from '@/components/auth/DonorSignupForm';
import { HealthWorkerSignupForm } from '@/components/auth/HealthWorkerSignupForm';
import { PatientSignupForm } from '@/components/auth/PatientSignupForm';
import { Card } from '@/components/ui/card';

export default function SignUpPage() {
  const [role, setRole] = useState<RoleChoice | null>(null);

  useEffect(() => {
    const roleParam = new URLSearchParams(window.location.search).get('role');
    if (roleParam === 'patient' || roleParam === 'health-worker' || roleParam === 'donor') {
      setRole(roleParam);
    }
  }, []);

  return (
    <main className="min-h-screen bg-ui-bg text-ui-text font-sans px-4 py-12">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <Link href="/" className="transition-transform hover:scale-105">
            <Image src="/logo.png" alt="Vite logo" width={64} height={64} className="rounded-lg shadow-sm" />
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-who-blue">Create Vite Account</h1>
            <p className="text-sm text-ui-text-light">Join the Vite immunization management platform</p>
          </div>
        </div>

        <Card className="shadow-panel border-ui-border">
          <div className="p-2">
            {!role ? (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-ui-text-light uppercase tracking-wide text-center">
                  Select Your Account Role
                </p>
                <RoleSelector value={role ?? undefined} onChange={setRole} />
              </div>
            ) : null}

            <AnimatePresence mode="wait">
              {role ? (
                <motion.div
                  key={role}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-ui-border pb-3">
                     <span className="text-sm font-bold text-who-blue uppercase">
                       New {role.replace('-', ' ')} Account
                     </span>
                    <button
                      type="button"
                      className="text-xs font-medium text-who-blue hover:underline"
                      onClick={() => setRole(null)}
                    >
                      Ã¢â€ Â Back to Roles
                    </button>
                  </div>

                  {role === 'patient' ? <PatientSignupForm /> : null}
                  {role === 'health-worker' ? <HealthWorkerSignupForm /> : null}
                  {role === 'donor' ? <DonorSignupForm /> : null}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t border-ui-border text-center text-sm">
              <p className="text-ui-text-light">
                Already registered?{' '}
                <Link href="/auth/signin" className="font-bold text-who-blue hover:underline">
                  Sign in to your account
                </Link>
              </p>
            </div>
          </div>
        </Card>
        
        <div className="text-center pt-4">
           <Link href="/" className="text-xs text-ui-text-muted hover:text-who-blue transition-colors">
             Ã¢â€ Â Back to Homepage
           </Link>
        </div>
      </div>
    </main>
  );
}



