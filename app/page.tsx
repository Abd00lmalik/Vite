'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Syringe, Wallet } from 'lucide-react';
import { UNSPLASH_IMAGES } from '@/lib/content/unsplash';

const countryRibbon = [
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

const statsLeft = [
  {
    value: '20 million',
    description: 'children miss one or more vaccine doses every year.',
    source: "UNICEF State of the World's Children 2023",
  },
  {
    value: '42%',
    description: 'dropout rate between first and third DTP dose in sub-Saharan Africa.',
    source: 'WHO/UNICEF coverage estimates 2023',
  },
  {
    value: '42%',
    description: 'of children in Nigeria complete the full DTP vaccination course.',
    source: 'UNICEF Nigeria Country Office 2023',
  },
];

const statsRight = [
  {
    value: '$96.4B',
    description: 'in remittances flowed into Africa in 2024, yet health grants still take 3-6 months.',
    source: 'World Bank Migration and Development Brief 2024',
  },
  {
    value: '1 in 10',
    description: 'medical products in low-income countries are substandard or falsified.',
    source: 'WHO GSMS 2023',
  },
  {
    value: '30-40%',
    description: 'of humanitarian aid is estimated lost to fraud, duplication, or admin waste.',
    source: 'U4 Anti-Corruption / Transparency International',
  },
];

export default function HomePage() {
  const reduceMotion = useReducedMotion();
  const pageVariants: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0.01 : 0.28, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="sticky top-0 z-50 border-b border-ui-border/80 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="VITE logo" width={36} height={36} className="rounded-lg shadow-sm" />
            <span className="text-xl font-bold tracking-tight text-ui-text">VITE</span>
          </div>
          <nav className="flex items-center gap-3 sm:gap-5">
            <Link href="/how-it-works" className="hidden text-sm font-medium text-ui-text-light transition-colors hover:text-who-blue sm:inline">
              How It Works
            </Link>
            <Link href="/auth/signin" className="text-sm font-semibold text-ui-text transition-colors hover:text-who-blue">
              Sign In
            </Link>
            <Link href="/auth/signup" className="btn-primary h-10 px-4 text-xs sm:h-11 sm:px-5 sm:text-sm">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-hero-gradient">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-who-blue/20 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, 24, 0], y: [0, 16, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 right-[-5rem] h-72 w-72 rounded-full bg-who-green/20 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, -18, 0], y: [0, -10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <motion.div initial="hidden" animate="visible" variants={pageVariants} className="space-y-6">
            <span className="badge-blue">Trusted immunization and grant verification</span>
            <h1 className="text-ui-text">
              Every dose recorded.
              <br />
              Every record trusted.
              <br />
              Every grant verified.
            </h1>
            <p className="max-w-xl text-lg text-ui-text-light">
              From Abuja to Accra. From Nairobi to Kinshasa.
              <br />
              VITE closes the gap between a child&apos;s first dose and their last.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signup" className="btn-primary h-12 px-7 text-sm">
                Create an Account
              </Link>
              <Link href="/auth/signin" className="btn-secondary h-12 px-7 text-sm">
                Sign In
              </Link>
            </div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={pageVariants} className="relative">
            <div className="absolute -left-4 -top-4 h-20 w-20 rounded-3xl bg-who-green/20 blur-2xl" />
            <div className="surface relative overflow-hidden p-2">
              <Image
                src={UNSPLASH_IMAGES.landing.hero}
                alt="Healthcare professional supporting a patient"
                width={1200}
                height={900}
                priority
                loading="eager"
                className="h-[320px] w-full rounded-xl object-cover sm:h-[420px]"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-ui-border bg-white py-5">
        <motion.div
          className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-2 px-4 text-xs font-semibold uppercase tracking-wide text-ui-text-muted sm:text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduceMotion ? 0.01 : 0.35 }}
        >
          <span>VITE operates across</span>
          {countryRibbon.map((country, index) => (
            <span key={country} className="inline-flex items-center gap-2">
              {index > 0 ? <span className="h-1.5 w-1.5 rounded-full bg-who-blue/40" /> : null}
              <span className="font-medium text-ui-text-light">{country}</span>
            </span>
          ))}
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          className="grid gap-8 rounded-3xl bg-white p-5 shadow-card sm:p-8 lg:grid-cols-2 lg:items-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Image
            src={UNSPLASH_IMAGES.landing.vaccination}
            alt="Child receiving a vaccination"
            width={1200}
            height={800}
            className="h-72 w-full rounded-2xl object-cover sm:h-80"
          />
          <div className="space-y-4">
            <span className="badge-orange">Challenge 01</span>
            <h2>Vaccination records disappear, and children pay the price.</h2>
            <p>
              When families move between cities, paper records are often lost. Clinics restart schedules from scratch,
              doses are duplicated, and missed follow-ups remain invisible.
            </p>
            <p>
              VITE keeps every dose portable, verifiable, and available across clinics, even when connectivity is weak.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="grid gap-8 rounded-3xl bg-white p-5 shadow-card sm:p-8 lg:grid-cols-2 lg:items-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
        >
          <div className="order-2 space-y-4 lg:order-1">
            <span className="badge-blue">Challenge 02</span>
            <h2>Funding is committed, but verification delays block families.</h2>
            <p>
              Manual checks create long payment cycles and weak audit confidence. Program teams spend weeks collecting
              evidence before grants are disbursed.
            </p>
            <p>
              VITE links verified clinic records to automated disbursement logic, so programs can release support with
              speed and transparency.
            </p>
          </div>
          <Image
            src={UNSPLASH_IMAGES.landing.system}
            alt="Digital health records and analytics workflow"
            width={1200}
            height={800}
            className="order-1 h-72 w-full rounded-2xl object-cover sm:h-80 lg:order-2"
          />
        </motion.div>
      </section>

      <section className="border-y border-ui-border bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <h2 className="mb-3">Global immunization and funding realities</h2>
            <p>Two focused data columns that show where the system fails and why verified digital infrastructure matters.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              {statsLeft.map((item) => (
                <article key={item.value + item.source} className="rounded-2xl border border-ui-border bg-ui-surface p-5">
                  <p className="text-4xl font-bold tracking-tight text-who-blue">{item.value}</p>
                  <p className="mt-2 max-w-xs text-sm text-ui-text-light">{item.description}</p>
                  <p className="mt-2 text-xs text-ui-text-muted">Source: {item.source}</p>
                </article>
              ))}
            </div>
            <div className="space-y-6">
              {statsRight.map((item) => (
                <article key={item.value + item.source} className="rounded-2xl border border-ui-border bg-ui-surface p-5">
                  <p className="text-4xl font-bold tracking-tight text-who-green">{item.value}</p>
                  <p className="mt-2 max-w-xs text-sm text-ui-text-light">{item.description}</p>
                  <p className="mt-2 text-xs text-ui-text-muted">Source: {item.source}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="mb-3">How VITE supports the full care and funding loop</h2>
            <p>Offline capture for health workers, transparent progress for donors, and clear records for families.</p>
          </div>
          <Link href="/how-it-works" className="hidden items-center gap-1 text-sm font-semibold text-who-blue hover:underline sm:inline-flex">
            Read the full technical guide
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <article className="card space-y-3">
            <Syringe className="h-5 w-5 text-who-blue" />
            <h3 className="text-xl font-semibold text-ui-text">Record</h3>
            <p className="text-sm text-ui-text-light">
              Health workers register patients and vaccinations in under a minute, even while offline.
            </p>
            <Image
              src={UNSPLASH_IMAGES.landing.healthWorker}
              alt="Nurse reviewing patient records in clinic"
              width={800}
              height={500}
              className="mt-2 h-40 w-full rounded-xl object-cover"
            />
          </article>

          <article className="card space-y-3">
            <ShieldCheck className="h-5 w-5 text-who-green" />
            <h3 className="text-xl font-semibold text-ui-text">Verify</h3>
            <p className="text-sm text-ui-text-light">
              Records sync as auditable batches with cryptographic integrity checks and dispute visibility.
            </p>
            <Image
              src={UNSPLASH_IMAGES.landing.system}
              alt="Medical data and verification workflow"
              width={800}
              height={500}
              className="mt-2 h-40 w-full rounded-xl object-cover"
            />
          </article>

          <article className="card space-y-3">
            <Wallet className="h-5 w-5 text-who-blue" />
            <h3 className="text-xl font-semibold text-ui-text">Release</h3>
            <p className="text-sm text-ui-text-light">
              Verified milestones trigger grant releases with transparent transaction history for donors and families.
            </p>
            <Image
              src={UNSPLASH_IMAGES.landing.hero}
              alt="Family-focused healthcare support"
              width={800}
              height={500}
              className="mt-2 h-40 w-full rounded-xl object-cover"
            />
          </article>
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link href="/how-it-works" className="inline-flex items-center gap-1 text-sm font-semibold text-who-blue hover:underline">
            Read the full technical guide
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="bg-hero-gradient py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
          <h2>Build trusted vaccination delivery across your programs.</h2>
          <p className="max-w-2xl text-base text-ui-text-light">
            Register as a donor, health worker, or patient to experience a complete demo of offline recording,
            verification, and grant release.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/auth/signup?role=donor" className="btn-primary h-12 px-8 text-sm">
              Register as Donor / NGO
            </Link>
            <Link href="/auth/signup?role=health-worker" className="btn-outline h-12 px-8 text-sm">
              Register as Health Worker
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ui-border bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="VITE logo" width={30} height={30} className="rounded" />
            <div>
              <p className="text-sm font-semibold text-ui-text">VITE</p>
              <p className="text-xs text-ui-text-muted">Every dose recorded. Every record trusted. Every grant verified.</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-sm text-ui-text-light">
            <Link href="/how-it-works" className="hover:text-who-blue">How It Works</Link>
            <Link href="/auth/signin" className="hover:text-who-blue">Sign In</Link>
            <Link href="/auth/signup" className="hover:text-who-blue">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
