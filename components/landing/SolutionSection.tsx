'use client';

import { motion } from 'framer-motion';

const panels = [
  {
    title: 'Universal Records',
    text: "Any clinic, any device, offline or online. A child's vaccination history follows them everywhere and is accessible via QR in seconds.",
    className: 'bg-teal-primary text-white',
  },
  {
    title: 'Automated Grants',
    text: 'When a health worker records a vaccination, that record is the verification. Grants release automatically with no paperwork delay.',
    className: 'bg-gray-900 text-white',
  },
  {
    title: 'Verified Impact',
    text: 'Every disbursement has an audit trail. Donors see real-time milestone completion instead of delayed narrative reporting.',
    className:
      'text-white bg-[linear-gradient(120deg,rgba(0,90,97,0.95),rgba(0,123,131,0.72)),url(https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80)] bg-cover bg-center',
  },
];

export function SolutionSection() {
  return (
    <section className="bg-gray-50 px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">What VITE Does</h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {panels.map((panel, index) => (
            <motion.article
              key={panel.title}
              className={`rounded-2xl p-6 ${panel.className}`}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <h3 className="text-xl font-semibold">{panel.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-white/90">{panel.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}




