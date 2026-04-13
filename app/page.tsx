'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const solutions = [
  {
    title: 'Universal Records',
    description:
      "Any clinic, any device, offline or online. A child's vaccination history follows them everywhere — accessible via QR code in 10 seconds.",
    className: 'bg-teal-primary text-white',
  },
  {
    title: 'Automated Grants',
    description:
      'When a health worker records a vaccination, that record is the verification. Grants release automatically. No program officer. No delay. No fraud.',
    className: 'bg-slate-900 text-white',
  },
  {
    title: 'Verified Impact',
    description:
      'Every disbursement has an audit trail. Donors see real-time milestone completion, not quarterly estimates written by the same programs they fund.',
    className: 'bg-[url(/images/problem-donors.jpg)] bg-cover bg-center text-white',
  },
];

const steps = [
  'Donor creates a program and funds an escrow',
  'Clinics are credentialed and receive the app',
  'Health worker registers family and records vaccination offline',
  'Records sync when connected and milestones are verified automatically',
  'Family receives SMS notification and grant payment instantly',
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setMounted(true);
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <main className="bg-white text-gray-900">
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-teal-primary to-teal-dark text-white">
        <Image
          src="/images/problem-vaccines.jpg"
          alt="Community vaccination session"
          fill
          className="object-cover opacity-25"
          loading="eager"
          priority
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-black/20 via-teal-dark/35 to-teal-dark/60"
          animate={{ opacity: [0.75, 0.95, 0.75] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-24 pt-6 md:px-8">
          <header className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-3">
              <Image src="/logo.png" alt="VITE logo" width={42} height={42} className="h-10 w-10" />
              <span className="text-xl font-semibold tracking-[0.14em]">VITE</span>
            </div>
            <Link href="/auth/signin">
              <Button variant="outline" className="h-12 border-white text-white hover:bg-white/15">
                Sign In
              </Button>
            </Link>
          </header>

          <div className="mx-auto mt-16 flex max-w-4xl flex-1 flex-col items-center justify-center text-center md:mt-20">
            {mounted && (
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm text-white/80">{isOnline ? 'Connected' : 'Offline Mode'}</span>
              </div>
            )}

            <Image src="/logo.png" alt="VITE logo" width={88} height={88} className="mb-6 h-20 w-20" />

            <motion.h1
              className="text-3xl font-bold tracking-tight md:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              14 million children don't complete their vaccines every year.
              <br className="hidden md:block" />
              We&apos;re fixing the system that lets them fall through the gap.
            </motion.h1>

            <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/90 md:text-lg">
              VITE gives health workers offline-first vaccination records, gives families portable health credentials,
              and gives donors verified proof that every dollar reached a real child.
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="#how-it-works" className="w-full sm:w-auto">
                <Button className="h-12 w-full bg-white text-teal-dark hover:bg-teal-100">See How It Works</Button>
              </Link>
              <Link href="/auth/signin" className="w-full sm:w-auto">
                <Button variant="outline" className="h-12 w-full border-white text-white hover:bg-white/15">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <a href="#problem" className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <ArrowDown className="h-6 w-6 animate-bounce text-white/90" />
          </a>
        </div>
      </section>

      <section id="problem" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/problem-vaccines.jpg" alt="Child vaccination records" fill className="object-cover" />
            </div>

            <div className="space-y-5">
              <span className="text-teal-primary font-semibold text-sm uppercase tracking-widest">Challenge 01</span>
              <h3 className="text-3xl font-bold text-gray-900 leading-tight">
                Vaccination records disappear — and children pay the price.
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                A child vaccinated in Kano has no record when her family moves to Abuja. The next clinic starts from
                zero. Duplicate doses are administered. Protection gaps go undetected. Paper cards get lost,
                destroyed, or falsified — and the health system has no way to know.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Across sub-Saharan Africa, 25% of children who receive their first vaccine dose never complete the
                full course — not because of access, but because the system loses track of them.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="space-y-5 md:order-1 order-2">
              <span className="text-teal-primary font-semibold text-sm uppercase tracking-widest">Challenge 02</span>
              <h3 className="text-3xl font-bold text-gray-900 leading-tight">
                Donor funds reach programs — but not the families they were meant for.
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Conditional health grants work when they reach people. But manual verification means 3 to 6 month
                delays between clinic visits and payment. Program officers spend weeks gathering evidence. Fraud is
                common. And when it is discovered, the entire program is cut — punishing families who were complying
                honestly.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Donors receive narrative reports written by the same organisations they are funding. There is no
                independent verification. No real-time data. No way to know if a dollar became a dose.
              </p>
            </div>

            <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden shadow-xl md:order-2 order-1">
              <Image src="/images/problem-donors.jpg" alt="Donor grant tracking" fill className="object-cover" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-white py-20 px-4 md:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-semibold">What VITE Does</h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {solutions.map((item) => (
              <motion.article
                key={item.title}
                className={`rounded-2xl p-6 ${item.className}`}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
              >
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/90">{item.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-teal-50 py-20 px-4 md:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-semibold text-center">How It Works</h2>
          <div className="mt-10 space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="rounded-xl border border-teal-100 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-primary text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="text-base leading-relaxed text-gray-700">{step}</p>
                </div>
                {index < steps.length - 1 ? (
                  <div className="mt-3 flex justify-center text-teal-dark/70">
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </div>
                ) : null}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-teal-dark px-4 py-16 text-white md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-semibold">Ready to close the gap?</h2>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/auth/signup?role=health-worker" className="w-full sm:w-auto">
              <Button className="h-12 w-full bg-white text-teal-dark hover:bg-teal-100 sm:w-auto">
                Register as Health Worker
              </Button>
            </Link>
            <Link href="/auth/signup?role=donor" className="w-full sm:w-auto">
              <Button variant="outline" className="h-12 w-full border-white text-white hover:bg-white/20 sm:w-auto">
                Register as Donor / NGO
              </Button>
            </Link>
            <Link href="/auth/signin" className="w-full sm:w-auto">
              <Button variant="outline" className="h-12 w-full border-white text-white hover:bg-white/20 sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-sm text-white/80">VITE Health · Built on XION · GIA 2026</p>
        </div>
      </section>
    </main>
  );
}

