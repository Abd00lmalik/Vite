'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-teal-primary via-[#0A6E74] to-teal-dark px-4 pb-24 pt-16 text-white md:px-8">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2),_transparent_40%)]"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/15 px-3 py-2">
            <Image src="/logo.png" alt="VITE logo" width={34} height={34} className="rounded-md" />
            <span className="text-sm font-semibold tracking-wide">VITE Health</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            14 million children don't complete their vaccines every year.
            <br className="hidden md:block" />
            <span className="mt-2 inline-block">We're fixing the system that lets them fall through the gap.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/90">
            VITE gives health workers offline-first vaccination records, gives families portable
            health credentials, and gives donors verified proof that every dollar reached a real child.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#how-it-works">
              <Button className="w-full bg-white text-teal-dark hover:bg-teal-100 sm:w-auto">See How It Works</Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full border-white text-white hover:bg-white/20 sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="relative hidden overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-3 lg:block"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <Image
            src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80"
            alt="Health worker supporting immunization"
            width={860}
            height={600}
            className="h-[420px] w-full rounded-xl object-cover opacity-40"
          />
        </motion.div>
      </div>

      <a href="#problem" className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <ArrowDown className="h-6 w-6 animate-bounce text-white/85" />
      </a>
    </section>
  );
}






