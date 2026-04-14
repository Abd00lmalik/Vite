'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUp,
  CheckCircle2,
  Database,
  HandCoins,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
  Workflow,
} from 'lucide-react';

type TabId =
  | 'overview'
  | 'health-workers'
  | 'families'
  | 'donors'
  | 'blockchain'
  | 'security';

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'health-workers', label: 'For Health Workers' },
  { id: 'families', label: 'For Families' },
  { id: 'donors', label: 'For Donors' },
  { id: 'blockchain', label: 'The Blockchain Layer' },
  { id: 'security', label: 'Security & Verification' },
];

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const content = useMemo(() => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'health-workers':
        return <HealthWorkersTab />;
      case 'families':
        return <FamiliesTab />;
      case 'donors':
        return <DonorsTab />;
      case 'blockchain':
        return <BlockchainTab />;
      case 'security':
        return <SecurityTab />;
      default:
        return null;
    }
  }, [activeTab]);

  return (
    <main id="top" className="min-h-screen bg-gray-50 pb-24">
      <section className="border-b border-gray-200 bg-white px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-primary">Public Guide</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">How VITE Works</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-600 md:text-lg">
            A plain-English guide to every part of the system for health officials, implementing partners, and donors.
          </p>
        </div>
      </section>

      <section className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto max-w-6xl overflow-x-auto">
          <div className="flex min-w-max items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`h-11 rounded-lg px-4 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-teal-primary text-white'
                    : 'bg-teal-50 text-teal-dark hover:bg-teal-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 md:px-8">{content}</section>

      <section className="mx-auto mt-6 max-w-6xl px-4 md:px-8">
        <div className="rounded-2xl border border-teal-100 bg-white p-6 text-center shadow-sm md:p-8">
          <h2 className="text-2xl font-semibold text-gray-900">Ready to deploy Stage 1 in your program?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600 md:text-base">
            Create an account and explore the donor, health worker, and patient flows in the live demo environment.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/signup"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-teal-primary px-5 text-base font-semibold text-white hover:bg-teal-dark"
            >
              Get Started
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-teal-primary px-5 text-base font-semibold text-teal-primary hover:bg-teal-50"
            >
              Back to Landing Page
            </Link>
          </div>
        </div>
      </section>

      {showTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-5 right-5 z-40 inline-flex h-11 items-center gap-2 rounded-full bg-teal-primary px-4 text-sm font-semibold text-white shadow-lg hover:bg-teal-dark"
          aria-label="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
          Back to top
        </button>
      ) : null}
    </main>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
        <h2 className="text-2xl font-semibold text-gray-900">The Three-Layer System</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-teal-100 bg-teal-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-primary">Layer 1 - Record</p>
            <div className="mt-2 flex items-center gap-2 text-gray-900">
              <Smartphone className="h-5 w-5 text-teal-primary" />
              <p className="font-semibold">Health Worker App</p>
            </div>
            <p className="mt-2 text-sm text-gray-700">Records every vaccination offline and stores data locally until sync.</p>
          </article>

          <article className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Layer 2 - Verify</p>
            <div className="mt-2 flex items-center gap-2 text-gray-900">
              <Database className="h-5 w-5 text-blue-700" />
              <p className="font-semibold">XION Blockchain</p>
            </div>
            <p className="mt-2 text-sm text-gray-700">
              Every batch is submitted as one transaction. A Merkle proof lets any record be independently verified.
            </p>
          </article>

          <article className="rounded-xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Layer 3 - Release</p>
            <div className="mt-2 flex items-center gap-2 text-gray-900">
              <HandCoins className="h-5 w-5 text-green-700" />
              <p className="font-semibold">Smart Contracts</p>
            </div>
            <p className="mt-2 text-sm text-gray-700">
              Milestone verification triggers automatic grant release from escrow with no manual approval.
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
        <h3 className="text-xl font-semibold text-gray-900">Why this matters</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">Today</p>
            <p className="mt-2 text-sm text-gray-700">Record - Manual review - Wait 3 to 6 months - Pay</p>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-700">With VITE</p>
            <p className="mt-2 text-sm text-gray-700">Record - Sync - Auto-verify - Pay within 24 hours</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function HealthWorkersTab() {
  const steps = [
    {
      title: 'Download or open the app on any phone',
      body: 'No app store required. It is a Progressive Web App that opens in a browser and can be added to home screen.',
      icon: Smartphone,
    },
    {
      title: 'Register a patient in about 60 seconds',
      body: 'Enter child name, date of birth, sex, and parent phone. VITE assigns a unique Health ID such as HD-ADE001 and generates a QR sticker.',
      icon: Users,
    },
    {
      title: 'Record vaccination with zero internet',
      body: 'Select vaccine, lot number, and dose number. GPS is captured automatically and the record is saved immediately on device.',
      icon: Workflow,
    },
    {
      title: 'Sync when connected',
      body: 'Tap Sync Now or wait for auto-sync. Pending records are batched into one transaction and verified with a Merkle tree.',
      icon: Database,
    },
    {
      title: 'Grant releases run automatically',
      body: 'When milestones are verified, payments are released and parents receive SMS notifications without manual approval queues.',
      icon: HandCoins,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
        <h2 className="text-2xl font-semibold text-gray-900">What the app does</h2>
        <div className="mt-5 space-y-4">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-primary text-sm font-bold text-white">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-700">{step.body}</p>
                </div>
                <step.icon className="h-5 w-5 text-teal-primary" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
        <h3 className="text-xl font-semibold text-gray-900">What health workers never have to do</h3>
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          <li>- Call a program officer to confirm a visit happened</li>
          <li>- Fill in a separate reporting spreadsheet</li>
          <li>- Wait for a supervisor to approve a payment</li>
          <li>- Explain a paper register to an auditor</li>
        </ul>
      </section>
    </div>
  );
}

function FamiliesTab() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
        <h2 className="text-2xl font-semibold text-gray-900">Your child&apos;s health record, always with you</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-gray-200 p-4">
            <p className="text-base font-semibold text-gray-900">How to access your record</p>
            <ul className="mt-2 space-y-2 text-sm text-gray-700">
              <li>- Scan the QR sticker on your child&apos;s vaccination card</li>
              <li>- Visit vite.health and enter your phone number</li>
              <li>- Text your child&apos;s Health ID to the VITE number</li>
            </ul>
          </article>

          <article className="rounded-xl border border-gray-200 p-4">
            <p className="text-base font-semibold text-gray-900">What you see</p>
            <ul className="mt-2 space-y-2 text-sm text-gray-700">
              <li>- Every vaccine your child has received</li>
              <li>- Which clinic administered it and when</li>
              <li>- Which doses are still due and when</li>
              <li>- How much grant money is available to claim</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
        <h3 className="text-xl font-semibold text-gray-900">How grants work</h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          When a health worker records your child&apos;s vaccination and syncs to the network, a smart contract checks
          whether a milestone has been reached. If yes, the grant is released within minutes rather than months. You
          receive an SMS confirmation and can transfer funds to your mobile money account with one tap.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
        <h3 className="text-xl font-semibold text-gray-900">Privacy note</h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          Your name is never stored on the public blockchain. Only a hashed identifier is anchored on-chain.
          Vaccination details are accessible to credentialed health workers and to your family account.
        </p>
      </section>
    </div>
  );
}

function DonorsTab() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
        <h2 className="text-2xl font-semibold text-gray-900">From escrow to impact, every dollar tracked</h2>
        <div className="mt-5 space-y-3 text-sm text-gray-700">
          <p>
            <span className="font-semibold text-gray-900">Step 1:</span> Create a program with vaccine milestones and
            grant amounts (example: DTP Dose 1 = $3, DTP Dose 2 = $3, Measles = $5).
          </p>
          <p>
            <span className="font-semibold text-gray-900">Step 2:</span> Fund escrow. Funds are locked and cannot be
            redirected or released without verified milestones.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Step 3:</span> Watch milestone completion in real time with
            patient progress, clinic, lot number, and transaction evidence.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Step 4:</span> Smart contracts release grants directly after
            verification with no manual approval delays.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Step 5:</span> Export verified reports including funded
            courses, disbursement efficiency, fraud flag rate, and per-milestone completion.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
        <h3 className="text-xl font-semibold text-gray-900">What this replaces</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-700">
                <th className="border border-gray-200 px-3 py-2">Before VITE</th>
                <th className="border border-gray-200 px-3 py-2">With VITE</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr>
                <td className="border border-gray-200 px-3 py-2">Program officer calls clinics</td>
                <td className="border border-gray-200 px-3 py-2">Records are automatic</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2">3 to 6 month payment delays</td>
                <td className="border border-gray-200 px-3 py-2">Same-day grant release</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2">Narrative reports from grantees</td>
                <td className="border border-gray-200 px-3 py-2">On-chain verifiable audit trail</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2">15 to 25% admin overhead</td>
                <td className="border border-gray-200 px-3 py-2">2 to 3% platform fee</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2">Limited by verification staff</td>
                <td className="border border-gray-200 px-3 py-2">Scales to any number of patients</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function BlockchainTab() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
        <h2 className="text-2xl font-semibold text-gray-900">XION, the infrastructure layer</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          XION is blockchain infrastructure designed for real-world products where users do not need wallet expertise.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-gray-200 p-4">
            <p className="text-base font-semibold text-gray-900">Email and phone onboarding</p>
            <p className="mt-1 text-sm text-gray-700">
              Health workers, families, and donors sign in with familiar credentials. Wallet complexity stays in the
              background.
            </p>
          </article>
          <article className="rounded-xl border border-gray-200 p-4">
            <p className="text-base font-semibold text-gray-900">Free transactions</p>
            <p className="mt-1 text-sm text-gray-700">
              Recording, syncing, and releasing grants do not expose gas fees to users. Platform sponsorship keeps UX
              predictable.
            </p>
          </article>
          <article className="rounded-xl border border-gray-200 p-4">
            <p className="text-base font-semibold text-gray-900">Tamper-proof storage</p>
            <p className="mt-1 text-sm text-gray-700">
              Once anchored, records cannot be changed or deleted by clinics, operators, or platform admins.
            </p>
          </article>
          <article className="rounded-xl border border-gray-200 p-4">
            <p className="text-base font-semibold text-gray-900">Automatic payments</p>
            <p className="mt-1 text-sm text-gray-700">
              Smart contracts release grants only when milestone conditions are met by valid vaccination evidence.
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
        <h3 className="text-xl font-semibold text-gray-900">The Merkle Tree, batch verification at scale</h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          A weekly sync may include 50 records. Instead of 50 transactions, VITE hashes each record, builds a Merkle
          tree, and submits one root hash. Any single record can later be proven with a short proof path, making
          verification fast and low-cost at national scale.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
        <h3 className="text-xl font-semibold text-gray-900">The four smart contracts</h3>
        <div className="mt-4 space-y-3 text-sm text-gray-700">
          <p>
            <span className="font-semibold text-gray-900">IssuerRegistry:</span> Controls which workers can issue valid
            records, and supports credential revocation.
          </p>
          <p>
            <span className="font-semibold text-gray-900">VaccinationRecord:</span> Anchors batch roots and supports
            proof-based verification of individual records.
          </p>
          <p>
            <span className="font-semibold text-gray-900">MilestoneChecker:</span> Evaluates newly synced records
            against active program milestone rules.
          </p>
          <p>
            <span className="font-semibold text-gray-900">GrantEscrow:</span> Holds program funds and only releases
            verified disbursements.
          </p>
        </div>
      </section>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
        <h2 className="text-2xl font-semibold text-gray-900">How we prevent fraud</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-900">
              <ShieldCheck className="h-5 w-5 text-teal-primary" />
              <p className="font-semibold">Credentialed worker controls</p>
            </div>
            <p className="mt-2 text-sm text-gray-700">
              IssuerRegistry acts as a whitelist. Uncredentialed accounts cannot create valid milestone evidence.
            </p>
          </article>

          <article className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-900">
              <CheckCircle2 className="h-5 w-5 text-teal-primary" />
              <p className="font-semibold">Lot number reconciliation</p>
            </div>
            <p className="mt-2 text-sm text-gray-700">
              Each record includes lot number. Excess usage against registered stock is automatically flagged.
            </p>
          </article>

          <article className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-900">
              <Workflow className="h-5 w-5 text-teal-primary" />
              <p className="font-semibold">Volume anomaly detection</p>
            </div>
            <p className="mt-2 text-sm text-gray-700">
              Unusual daily volume versus worker history triggers review workflows to detect synthetic record bursts.
            </p>
          </article>

          <article className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-900">
              <Wallet className="h-5 w-5 text-teal-primary" />
              <p className="font-semibold">Geographic verification</p>
            </div>
            <p className="mt-2 text-sm text-gray-700">
              GPS metadata captured at recording is checked against registered clinic geography and anomaly thresholds.
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-7">
        <h3 className="text-xl font-semibold text-amber-900">What technology cannot prevent alone</h3>
        <p className="mt-3 text-sm leading-relaxed text-amber-900/90">
          No system removes all fraud risk. Collusion between actors can still bypass automated checks. VITE is built
          to increase cost, reduce opportunity, and raise visibility of fraud attempts. Quarterly supervisory
          spot-checks remain essential as the human audit layer.
        </p>
      </section>
    </div>
  );
}
