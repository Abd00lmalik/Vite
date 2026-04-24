'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { RoleSelector, type RoleChoice } from '@/components/auth/RoleSelector';
import { DonorSignupForm } from '@/components/auth/DonorSignupForm';
import { HealthWorkerSignupForm } from '@/components/auth/HealthWorkerSignupForm';
import { PatientSignupForm } from '@/components/auth/PatientSignupForm';
import { Card } from '@/components/ui/card';
import { PageTransition } from '@/components/shared/PageTransition';
import { UNSPLASH_IMAGES } from '@/lib/content/unsplash';

export default function SignUpPage() {
  const [role, setRole] = useState<RoleChoice | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const roleParam = new URLSearchParams(window.location.search).get('role');
    if (roleParam === 'patient' || roleParam === 'health-worker' || roleParam === 'donor') {
      setRole(roleParam);
    }
  }, []);

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8 md:py-12">
      <PageTransition className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/logo.png" alt="VITE logo" width={36} height={36} className="rounded-lg" />
              <span className="text-xl font-bold text-ui-text">VITE</span>
            </Link>
            <Link href="/" className="text-xs font-medium text-ui-text-muted transition-colors hover:text-who-blue">
              Back to Home
            </Link>
          </div>

          <Card className="space-y-6 p-6 sm:p-8">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-ui-text">Create your account</h2>
              <p className="text-sm text-ui-text-light">
                Register as a patient, health worker, or donor to start using verified health workflows.
              </p>
            </div>

            {!role ? (
              <div className="space-y-3">
                <p className="text-center text-xs font-semibold uppercase tracking-wide text-ui-text-muted">Select role</p>
                <RoleSelector value={role ?? undefined} onChange={setRole} />
              </div>
            ) : null}

            <AnimatePresence mode="wait">
              {role ? (
                <motion.div
                  key={role}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-ui-border pb-3">
                    <span className="text-xs font-bold uppercase tracking-wide text-who-blue">New {role.replace('-', ' ')} account</span>
                    <button type="button" onClick={() => setRole(null)} className="text-xs font-medium text-ui-text-muted hover:text-who-blue">
                      Change role
                    </button>
                  </div>
                  {role === 'patient' ? <PatientSignupForm /> : null}
                  {role === 'health-worker' ? <HealthWorkerSignupForm /> : null}
                  {role === 'donor' ? <DonorSignupForm /> : null}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <p className="text-center text-sm text-ui-text-light">
              Already registered?{' '}
              <Link href="/auth/signin" className="font-semibold text-who-blue hover:underline">
                Sign in
              </Link>
            </p>
          </Card>
        </section>

        <section className="relative hidden overflow-hidden rounded-3xl border border-ui-border bg-card-gradient p-8 shadow-card lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-5">
            <span className="badge-green">Healthcare-ready onboarding</span>
            <h1 className="max-w-md text-4xl font-bold text-ui-text">Designed for teams delivering real care in real communities.</h1>
            <p className="max-w-md text-base text-ui-text-light">
              VITE helps programs coordinate immunization records, verification, and grant disbursement across countries.
            </p>
          </div>
          <div className="relative mt-8 h-[360px] w-full overflow-hidden rounded-2xl">
            <Image
              src={UNSPLASH_IMAGES.auth.signup}
              alt="Healthcare professionals preparing treatment"
              fill
              className="object-cover"
              priority
            />
          </div>
        </section>
      </PageTransition>
    </main>
  );
}
