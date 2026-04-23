'use client';

import { motion } from 'framer-motion';

const stats = [
  { label: 'Vaccination records created', value: '5,000+' },
  { label: 'Completion rate improvement in pilot', value: '42% -> 67%' },
  { label: 'Cost per verified transaction', value: '$0.03' },
  { label: 'Average time from clinic visit to grant payment', value: '< 7 days' },
];

export function ImpactSection() {
  return (
    <section className="bg-teal-50 px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">Impact Numbers</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="rounded-xl border border-teal-100 bg-white p-5"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
            >
              <p className="text-3xl font-bold text-teal-dark">{stat.value}</p>
              <p className="mt-2 text-sm text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}




