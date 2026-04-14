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
      "Any clinic, any device, offline or online. A child's vaccination history follows them everywhere and is accessible via QR code in seconds.",
    className: 'bg-teal-primary text-white',
  },
  {
    title: 'Automated Grants',
    description:
      'When a health worker records a vaccination, that record becomes the verification. Grants release automatically with no manual paperwork bottlenecks.',
    className: 'bg-slate-900 text-white',
  },
  {
    title: 'Verified Impact',
    description:
      'Every disbursement has an audit trail. Donors see real-time milestone completion and transaction evidence for each funded program.',
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

const countries = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'Ethiopia',
  'Tanzania',
  'Uganda',
  'South Africa',
  'Senegal',
  'Rwanda',
  'DR Congo',
];

const vaccinationStats = [
  {
    value: '20 million',
    description: 'children miss one or more vaccine doses every year.',
    source: "Source: UNICEF State of the World's Children 2023",
  },
  {
    value: '42%',
    description: 'dropout rate between first and third DTP dose in sub-Saharan Africa.',
    source: 'Source: WHO/UNICEF immunization coverage estimates 2023',
  },
  {
    value: '42%',
    description: 'of children in Nigeria complete their full DTP vaccination course.',
    source: 'Source: UNICEF Nigeria Country Office 2023',
  },
];

const fundingStats = [
  {
    value: '$96.4B',
    description: 'in remittances flowed into Africa in 2024, yet conditional health grants still take 3-6 months to reach families.',
    source: 'Source: World Bank Migration and Development Brief 2024',
  },
  {
    value: '1 in 10',
    description: 'medical products in low-income countries is substandard or falsified.',
    source: 'Source: WHO Global Surveillance and Monitoring System 2023',
  },
  {
    value: '30-40%',
    description: 'of humanitarian aid is estimated lost to fraud, duplication, or administrative waste before reaching beneficiaries.',
    source: 'Source: U4 Anti-Corruption Resource Centre / Transparency International',
  },
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
            {mounted ? (
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm text-white/80">{isOnline ? 'Connected' : 'Offline Mode'}</span>
              </div>
            ) : null}

            <Image src="/logo.png" alt="VITE logo" width={88} height={88} className="mb-6 h-20 w-20" />

            <motion.h1
              className="text-3xl font-bold tracking-tight md:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              20 million children miss one or more vaccine doses every year.
              <br className="hidden md:block" />
              VITE is rebuilding how completion is tracked and verified.
            </motion.h1>

            <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/90 md:text-lg">
              From Abuja to Accra. From Nairobi to Kinshasa.
              <br />
              VITE closes the gap between a child&apos;s first dose and their last.
            </p>

            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/80 md:text-base">
              VITE gives health workers offline-first vaccination records, gives families portable health credentials,
              and gives donors verifiable proof that every funded milestone reached a real child.
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

          <a href="#problem" className="absolute bottom-6 left-1/2 -translate-x-1/2" aria-label="Scroll to problem section">
            <ArrowDown className="h-6 w-6 animate-bounce text-white/90" />
          </a>
        </div>
      </section>

      <section className="bg-white px-4 py-16 md:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold md:text-3xl">The Global Immunization and Funding Gap</h2>
          <p className="mt-3 max-w-3xl text-base text-gray-600">
            These are the operational realities VITE is designed to address across public health programs in Africa.
          </p>
          <p className="mt-3 text-sm text-gray-600">
            VITE operates across: Nigeria · Ghana · Kenya · Ethiopia · Tanzania · Uganda · South Africa · Senegal ·
            Rwanda · DR Congo
          </p>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Vaccination Gap</h3>
              {vaccinationStats.map((item) => (
                <article key={item.value + item.description} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-4xl font-bold text-teal-primary">{item.value}</p>
                  <p className="mt-2 max-w-xs text-sm text-gray-600">{item.description}</p>
                  <p className="mt-2 text-xs text-gray-400">{item.source}</p>
                </article>
              ))}
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Funding and Integrity Gap</h3>
              {fundingStats.map((item) => (
                <article key={item.value + item.description} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-4xl font-bold text-teal-primary">{item.value}</p>
                  <p className="mt-2 max-w-xs text-sm text-gray-600">{item.description}</p>
                  <p className="mt-2 text-xs text-gray-400">{item.source}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            className="grid grid-cols-1 items-center gap-16 md:grid-cols-2"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="relative order-1 h-80 overflow-hidden rounded-2xl shadow-xl md:h-96">
              <Image src="/images/problem-vaccines.jpg" alt="Child vaccination records" fill className="object-cover" />
            </div>

            <div className="order-2 space-y-5">
              <span className="text-sm font-semibold uppercase tracking-widest text-teal-primary">Challenge 01</span>
              <h3 className="text-3xl font-bold leading-tight text-gray-900">
                Vaccination records disappear and children pay the price.
              </h3>
              <p className="text-lg leading-relaxed text-gray-600">
                Families move, paper records are lost, and clinics have incomplete histories. That creates duplicate
                dosing risk, missed follow-up windows, and silent protection gaps that are hard to detect at system
                level.
              </p>
              <p className="text-lg leading-relaxed text-gray-600">
                The result is avoidable dropout between first and later doses, especially where records are still
                fragmented across facilities and paper registers.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            className="grid grid-cols-1 items-center gap-16 md:grid-cols-2"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="order-2 space-y-5 md:order-1">
              <span className="text-sm font-semibold uppercase tracking-widest text-teal-primary">Challenge 02</span>
              <h3 className="text-3xl font-bold leading-tight text-gray-900">
                Donor funds reach programs, but verification delays block families.
              </h3>
              <p className="text-lg leading-relaxed text-gray-600">
                Conditional health grants are effective when payments are fast and trusted. Yet manual verification
                often introduces months of delay between clinic visits and disbursement.
              </p>
              <p className="text-lg leading-relaxed text-gray-600">
                Donors need independent, real-time evidence that funded milestones happened and reached intended
                beneficiaries without leakage.
              </p>
            </div>

            <div className="relative order-1 h-80 overflow-hidden rounded-2xl shadow-xl md:order-2 md:h-96">
              <Image src="/images/problem-donors.jpg" alt="Donor grant tracking" fill className="object-cover" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold md:text-3xl">What VITE Does</h2>
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

      <section id="how-it-works" className="bg-teal-50 px-4 py-20 md:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold md:text-3xl">How It Works</h2>
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

          <motion.div
            className="mt-8 rounded-xl border border-teal-100 bg-white px-4 py-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-primary">VITE Geographic Coverage</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-700">
              {countries.map((country, index) => (
                <span key={country} className="inline-flex items-center gap-2">
                  {country}
                  {index < countries.length - 1 ? <span className="h-1 w-1 rounded-full bg-teal-primary/70" /> : null}
                </span>
              ))}
            </div>
          </motion.div>

          <div className="mt-6 text-center">
            <Link href="/how-it-works" className="text-sm font-semibold text-teal-primary underline underline-offset-4">
              Read the full technical guide -&gt;
            </Link>
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
          <div className="mt-6 space-y-2 text-sm text-white/80">
            <p>VITE Health | Built on XION | GIA 2026</p>
            <Link href="/how-it-works" className="inline-block underline underline-offset-4 hover:text-white">
              How VITE Works
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
