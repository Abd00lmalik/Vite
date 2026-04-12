'use client';

import { motion } from 'framer-motion';
import { Clock3, FileX, ShieldX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const items = [
  {
    title: 'Paper cards get lost.',
    text: 'A child vaccinated in Kano has no record when her family moves to Abuja. The next clinic starts from zero. Vaccine doses are wasted. Protection is incomplete.',
    icon: FileX,
  },
  {
    title: 'Grants take months to reach families.',
    text: 'Conditional health programs work, but manual verification drives 3-6 month payment delays. The behavioral incentive arrives too late and dropout rates climb.',
    icon: Clock3,
  },
  {
    title: "Donors can't verify impact.",
    text: 'Narrative reports substitute for evidence. Fraud rises. Programs get cut when trust collapses, hurting families who complied honestly.',
    icon: ShieldX,
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="bg-white px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">The Problem</h2>
        <p className="mt-3 max-w-3xl text-base text-gray-700">
          Immunization systems fail at the handoff points. Families move, records fragment, and verification delays break incentives.
        </p>

        <motion.div
          className="mt-8 grid gap-4 md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.title} variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}>
                <Card className="h-full">
                  <CardContent className="p-5">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-dark">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-gray-700">{item.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}


