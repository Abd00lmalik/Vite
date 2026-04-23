'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ HEADER Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <header className="bg-who-blue text-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Vite" width={36} height={36}
                     className="rounded" />
              <span className="text-xl font-bold text-white">Vite</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/how-it-works"
                    className="text-sm text-white/80 hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="/auth/signin"
                    className="text-sm text-white/80 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup"
                    className="bg-who-orange text-white px-4 py-2 rounded text-sm
                               font-semibold hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </nav>
            {/* Mobile menu */}
            <div className="md:hidden flex items-center gap-3">
              <Link href="/auth/signin"
                    className="text-sm text-white/80 hover:text-white">
                Sign In
              </Link>
              <Link href="/auth/signup"
                    className="bg-who-orange text-white px-3 py-1.5 rounded text-sm
                               font-semibold">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ HERO Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="bg-who-blue text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial="hidden" animate="visible" variants={stagger}
          >
            <motion.p variants={fadeUp}
                      className="text-who-orange font-semibold text-sm uppercase
                                 tracking-wide mb-4">
              Built on XION Blockchain Ã‚Â· Testnet-2
            </motion.p>
            <motion.h1 variants={fadeUp}
                       className="text-4xl md:text-6xl font-bold text-white mb-6
                                  leading-tight">
              Every dose recorded.
              <br />Every grant verified.
            </motion.h1>
            <motion.p variants={fadeUp}
                      className="text-xl text-white/80 mb-4 max-w-2xl mx-auto">
              From Abuja to Accra. From Nairobi to Kinshasa.
            </motion.p>
            <motion.p variants={fadeUp}
                      className="text-base text-white/70 mb-10 max-w-xl mx-auto
                                 leading-relaxed">
              Vite gives health workers offline-first vaccination records,
              gives families portable health credentials, and gives donors
              verified proof that every dollar reached a real child.
            </motion.p>
            <motion.div variants={fadeUp}
                        className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup"
                    className="bg-white text-who-blue px-8 py-3.5 rounded font-semibold
                               text-base hover:bg-who-blue-light transition-colors">
                Get Started
              </Link>
              <Link href="/how-it-works"
                    className="bg-transparent text-white border border-white/40 px-8 py-3.5
                               rounded font-semibold text-base hover:bg-white/10
                               transition-colors">
                Learn How It Works
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ PARTNERS BAR Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="bg-white border-b border-ui-border py-5">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs text-ui-text-muted uppercase tracking-wide mb-3">
            Aligned with
          </p>
          <p className="text-sm font-medium text-ui-text-light">
            UN Sustainable Development Goals Ã‚Â· GAVI Ã‚Â· UNICEF Ã‚Â· WHO Ã‚Â·
            Blockchain for Good Alliance
          </p>
        </div>
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ PROBLEM 1: Vaccine Records (image left, text right) Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-lg overflow-hidden border border-ui-border
                       shadow-panel aspect-video"
          >
            <Image src="/images/problem-vaccines.jpg"
                   alt="Child vaccination" width={700} height={400}
                   className="w-full h-full object-cover" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="badge-orange mb-4 inline-block">Challenge 01</span>
            <h2 className="text-2xl md:text-3xl font-bold text-ui-text mb-4">
              Vaccination records disappear: children lose their protection.
            </h2>
            <p className="text-ui-text-light leading-relaxed mb-4">
              A child vaccinated in Kano has no record when her family moves to
              Abuja. The next clinic starts from zero. Duplicate doses are
              administered. Protection gaps go undetected.
            </p>
            <p className="text-ui-text-light leading-relaxed mb-5">
              Across sub-Saharan Africa, the DTP3 completion rate sits at just
              42%: not because of access, but because the system loses track
              of children between doses.
            </p>
            <div className="flex items-center gap-3 p-4 bg-who-blue-light
                            rounded-lg border-l-4 border-who-blue">
              <div>
                <p className="text-2xl font-bold text-who-blue">20 million</p>
                <p className="text-sm text-ui-text-light">
                  children miss at least one dose every year
                </p>
                <p className="text-xs text-ui-text-muted mt-1">
                  Source: UNICEF State of the World's Children 2023
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ PROBLEM 2: Donor Grants (text left, image right) Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="py-20 px-4 bg-ui-bg">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:order-1 order-2"
          >
            <span className="badge-blue mb-4 inline-block">Challenge 02</span>
            <h2 className="text-2xl md:text-3xl font-bold text-ui-text mb-4">
              Donor funds reach programs: but not the families they serve.
            </h2>
            <p className="text-ui-text-light leading-relaxed mb-4">
              Conditional health grants work when they arrive. But manual
              verification means 3 to 6 month delays between a clinic visit
              and a payment. Program officers spend weeks gathering paper
              evidence. Fraud is common.
            </p>
            <p className="text-ui-text-light leading-relaxed mb-5">
              When fraud is discovered, the entire program is cancelled:
              punishing families who were complying honestly alongside
              those who weren't.
            </p>
            <div className="flex items-center gap-3 p-4 bg-who-orange-light
                            rounded-lg border-l-4 border-who-orange">
              <div>
                <p className="text-2xl font-bold text-who-orange">30Ã¢â‚¬â€œ40%</p>
                <p className="text-sm text-ui-text-light">
                  of humanitarian aid lost to fraud or administrative waste
                </p>
                <p className="text-xs text-ui-text-muted mt-1">
                  Source: Transparency International / U4 Anti-Corruption
                </p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-lg overflow-hidden border border-ui-border
                       shadow-panel aspect-video md:order-2 order-1"
          >
            <Image src="/images/problem-vaccines.jpg"
                   alt="Donor grant tracking" width={700} height={400}
                   className="w-full h-full object-cover" />
          </motion.div>
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ STATS GRID Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="py-20 px-4 bg-white border-t border-ui-border">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-ui-text mb-3">
              The scale of the challenge
            </h2>
            <p className="text-ui-text-light max-w-xl mx-auto">
              Real figures from authoritative sources. No estimates.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { num: '20M',    color: 'blue',
                label: 'Children miss vaccine doses yearly',
                src:   'UNICEF 2023' },
              { num: '42%',    color: 'orange',
                label: 'DTP3 completion rate in Nigeria',
                src:   'WHO/UNICEF 2023' },
              { num: '30Ã¢â‚¬â€œ40%', color: 'orange',
                label: 'Aid lost to fraud or waste',
                src:   'Transparency International' },
              { num: '$96.4B', color: 'blue',
                label: 'Remittances into Africa (2024)',
                src:   'World Bank 2024' },
              { num: '1 in 10', color: 'orange',
                label: 'Medical products substandard or falsified',
                src:   'WHO Global Surveillance 2023' },
              { num: '8.2%',   color: 'blue',
                label: 'Average cost to send remittances to Africa',
                src:   'RemitScope Q1 2025' },
            ].map(({ num, color, label, src }) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="card"
              >
                <p className={`text-3xl font-bold mb-2 ${
                  color === 'blue' ? 'text-who-blue' : 'text-who-orange'
                }`}>
                  {num}
                </p>
                <p className="text-sm text-ui-text font-medium mb-2">{label}</p>
                <p className="text-xs text-ui-text-muted">Source: {src}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ HOW IT WORKS Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="py-20 px-4 bg-who-blue-light">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-ui-text mb-3">
              How Vite Works
            </h2>
            <p className="text-ui-text-light max-w-xl mx-auto">
              Five steps from clinic visit to verified grant payment.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { n: '01', title: 'Donor creates program and funds escrow',
                desc: 'Milestone conditions are defined. Funds are locked in a XION smart contract. No one can access them until milestones are verified.' },
              { n: '02', title: 'Clinics are credentialed on-chain',
                desc: 'Only health workers registered in the IssuerRegistry contract can issue valid vaccination records.' },
              { n: '03', title: 'Health worker registers family and records vaccination offline',
                desc: 'Works with no internet connection. Records are stored locally with GPS coordinates and lot number.' },
              { n: '04', title: 'Records sync to XION as a verified batch',
                desc: 'When connectivity is available, records upload as a single Merkle batch. Treasury pays all gas fees.' },
              { n: '05', title: 'Grant released automatically to family',
                desc: 'The MilestoneChecker contract verifies the batch. GrantEscrow releases funds directly to the patient\'s Meta Account. SMS confirms receipt.' },
            ].map(({ n, title, desc }) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white border border-ui-border rounded-lg p-5
                           flex gap-5 items-start shadow-card"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-who-blue text-white
                                rounded-full flex items-center justify-center
                                font-bold text-sm">
                  {n}
                </div>
                <div>
                  <p className="font-semibold text-ui-text mb-1">{title}</p>
                  <p className="text-sm text-ui-text-light leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/how-it-works"
                  className="text-who-blue text-sm font-medium
                             hover:underline">
              Read the full technical guide Ã¢â€ â€™
            </Link>
          </div>
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ COVERAGE Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="py-10 bg-white border-t border-ui-border">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs text-ui-text-muted uppercase tracking-wider mb-3">
            Operating across
          </p>
          <p className="text-sm font-medium text-ui-text-light">
            Nigeria Ã‚Â· Ghana Ã‚Â· Kenya Ã‚Â· Ethiopia Ã‚Â· Tanzania Ã‚Â· Uganda Ã‚Â·
            South Africa Ã‚Â· Senegal Ã‚Â· Rwanda Ã‚Â· DR Congo
          </p>
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ CTA Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="py-20 px-4 bg-who-blue text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to close the gap?</h2>
          <p className="text-white/80 mb-8">
            Join health workers, donors, and families already using Vite
            to verify care and deliver grants automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup?role=health-worker"
                  className="bg-white text-who-blue px-8 py-3.5 rounded font-semibold
                             hover:bg-who-blue-light transition-colors text-sm">
              Register as Health Worker
            </Link>
            <Link href="/auth/signup?role=donor"
                  className="bg-who-orange text-white px-8 py-3.5 rounded font-semibold
                             hover:opacity-90 transition-opacity text-sm">
              Register as Donor / NGO
            </Link>
          </div>
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ FOOTER Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <footer className="bg-gray-900 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center
                          justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Vite" width={32} height={32}
                     className="rounded" />
              <div>
                <p className="font-bold text-white">Vite</p>
                <p className="text-xs text-gray-400">
                  Built on XION Testnet-2
                </p>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/how-it-works" className="hover:text-white transition-colors">
                How It Works
              </Link>
              <a href="https://github.com/Abd00lmalik/Vite" target="_blank"
                 rel="noopener noreferrer"
                 className="hover:text-white transition-colors">
                GitHub
              </a>
              <a href="https://explorer.burnt.com/xion-testnet-2"
                 target="_blank" rel="noopener noreferrer"
                 className="hover:text-white transition-colors">
                Explorer
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center">
            <p className="text-xs text-gray-500">
              Ã‚Â© 2026 Vite Ã‚Â· Blockchain for Good Alliance Ã‚Â· GIA 2026 Ã‚Â·
              SDG 1, 3, 16, 17
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}



