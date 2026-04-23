'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RoleSelector, type RoleChoice } from '@/components/auth/RoleSelector';
import { PatientLoginForm } from '@/components/auth/PatientLoginForm';
import { StaffLoginForm } from '@/components/auth/StaffLoginForm';
import { Card } from '@/components/ui/card';

export default function SignInPage() {
  const [role, setRole] = useState<RoleChoice | null>(null);

  useEffect(() => {
    const roleParam = new URLSearchParams(window.location.search).get('role');
    if (
      roleParam === 'patient' ||
      roleParam === 'health-worker' ||
      roleParam === 'donor'
    ) {
      setRole(roleParam);
    }
  }, []);

  return (
    <main className="min-h-screen bg-ui-bg text-ui-text font-sans px-4 py-8">
      {/* Header */}
      <div className="mx-auto max-w-md mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Vite logo" width={32} height={32} />
          <span className="text-xl font-bold text-who-blue">Vite</span>
        </Link>
        <span className="text-xs font-semibold text-ui-text-muted uppercase tracking-wider">
          Sign In
        </span>
      </div>

      <div className="mx-auto max-w-md space-y-6">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-ui-text mb-2">Welcome Back</h1>
          <p className="text-sm text-ui-text-light">
            Secure role-based access to the Vite platform
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-panel border-ui-border">
          {!role && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-ui-text-light uppercase tracking-wide mb-4 text-center">
                Select Your Role
              </p>
              <RoleSelector value={role ?? undefined} onChange={setRole} />
            </div>
          )}

          <AnimatePresence mode="wait">
            {role && (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-ui-border pb-3 mb-4">
                  <span className="text-sm font-bold text-who-blue uppercase">
                    {role.replace('-', ' ')}
                  </span>
                  <button
                    type="button"
                    className="text-xs font-medium text-who-blue-dark hover:underline"
                    onClick={() => setRole(null)}
                  >
                    Change Role
                  </button>
                </div>
                {role === 'patient' ? <PatientLoginForm /> : <StaffLoginForm role={role} />}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-ui-border text-center text-sm">
            <p className="text-ui-text-light">
              New to Vite?{' '}
              <Link href="/auth/signup" className="text-who-blue font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </Card>

        {/* Demo Credentials */}
        <div className="bg-who-blue-light border border-who-blue/20 rounded-lg p-5">
          <p className="text-who-blue text-xs font-bold uppercase tracking-wider mb-4 text-center">
            Demo Credentials
          </p>
          <div className="space-y-3">
            {[
              { role: 'Health Worker', creds: 'amara@clinic-kano.ng / Demo1234!' },
              { role: 'Donor / NGO',   creds: 'donor@unicef-ng.org / Demo1234!' },
              { role: 'Patient',       creds: '+2348012345001 (phone only)' },
            ].map(({ role: r, creds }) => (
              <div key={r} className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-xs font-bold text-who-blue/80">{r}:</span>
                <span className="text-xs font-medium text-ui-text bg-white/50 px-2 py-0.5 rounded">
                  {creds}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center">
           <Link href="/" className="text-xs text-ui-text-muted hover:text-who-blue transition-colors">
             ← Back to Homepage
           </Link>
        </div>
      </div>
    </main>
  );
}



