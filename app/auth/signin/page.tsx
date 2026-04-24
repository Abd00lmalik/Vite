'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { RoleSelector, type RoleChoice } from '@/components/auth/RoleSelector';
import { PatientLoginForm } from '@/components/auth/PatientLoginForm';
import { StaffLoginForm } from '@/components/auth/StaffLoginForm';
import { Card } from '@/components/ui/card';
import { PageTransition } from '@/components/shared/PageTransition';
import { UNSPLASH_IMAGES } from '@/lib/content/unsplash';

export default function SignInPage() {
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
      <PageTransition className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="relative hidden overflow-hidden rounded-3xl border border-ui-border bg-card-gradient p-8 shadow-card lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-5">
            <span className="badge-blue">Secure healthcare access</span>
            <h1 className="max-w-md text-4xl font-bold text-ui-text">Sign in to continue managing trusted health records.</h1>
            <p className="max-w-md text-base text-ui-text-light">
              Designed for health workers, families, and donor teams with role-based experiences and verified workflows.
            </p>
          </div>
          <div className="relative mt-8 h-[360px] w-full overflow-hidden rounded-2xl">
            <Image
              src={UNSPLASH_IMAGES.auth.signin}
              alt="Healthcare team in a clinic"
              fill
              className="object-cover"
              priority
            />
          </div>
        </section>

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
              <h2 className="text-2xl font-bold text-ui-text">Welcome back</h2>
              <p className="text-sm text-ui-text-light">Choose your role and access your dashboard.</p>
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
                    <span className="text-xs font-bold uppercase tracking-wide text-who-blue">{role.replace('-', ' ')} sign in</span>
                    <button type="button" onClick={() => setRole(null)} className="text-xs font-medium text-ui-text-muted hover:text-who-blue">
                      Change role
                    </button>
                  </div>
                  {role === 'patient' ? <PatientLoginForm /> : <StaffLoginForm role={role} />}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="rounded-2xl border border-who-blue/20 bg-who-blue-light/60 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-who-blue">Demo Credentials</p>
              <div className="space-y-2 text-xs text-ui-text">
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="font-semibold">Health Worker</span>
                  <span className="font-mono">amara@clinic-kano.ng / Demo1234!</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="font-semibold">Donor / NGO</span>
                  <span className="font-mono">donor@unicef-ng.org / Demo1234!</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span className="font-semibold">Patient</span>
                  <span className="font-mono">+2348012345001 (phone only)</span>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-ui-text-light">
              New to VITE?{' '}
              <Link href="/auth/signup" className="font-semibold text-who-blue hover:underline">
                Create an account
              </Link>
            </p>
          </Card>
        </section>
      </PageTransition>
    </main>
  );
}
