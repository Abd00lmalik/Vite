'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const steps = [
  'Donor creates a program and funds an escrow',
  'Clinics are credentialed and receive the app',
  'Health worker registers family and records vaccination offline',
  'Records sync when connected - milestone verified automatically',
  'Family receives SMS notification and grant payment instantly',
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white px-4 py-16 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">How It Works</h2>
        <div className="mt-8 space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-primary text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="text-base text-gray-800">{step}</p>
              </div>
              {index < steps.length - 1 ? (
                <div className="mt-3 pl-10 text-teal-primary">
                  <ArrowRight className="h-4 w-4" />
                </div>
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

