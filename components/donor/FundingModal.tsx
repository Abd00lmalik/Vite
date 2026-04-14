'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/db/schema';
import { GrantEscrow } from '@/lib/blockchain/contracts';
import { useAuthStore } from '@/store/authStore';
import type { Program } from '@/types';

const schema = z.object({
  amount: z
    .number({ invalid_type_error: 'Enter an amount' })
    .min(10, 'Minimum deposit is $10')
    .max(1000000, 'Maximum single deposit is $1,000,000'),
  paymentMethod: z.enum(['bank_transfer', 'card', 'crypto']),
  reference: z.string().min(3, 'Add a payment reference'),
});

type FormData = z.infer<typeof schema>;
type Step = 'form' | 'processing' | 'success';

interface FundingModalProps {
  program: Program;
  onClose: () => void;
  onSuccess: () => void;
}

export function FundingModal({ program, onClose, onSuccess }: FundingModalProps) {
  const { session } = useAuthStore();
  const [step, setStep] = useState<Step>('form');
  const [txHash, setTxHash] = useState('');
  const [fundedAmount, setFundedAmount] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'bank_transfer' },
  });

  const amount = watch('amount');

  async function onSubmit(data: FormData) {
    setStep('processing');
    setFundedAmount(data.amount);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await new Promise((resolve) => setTimeout(resolve, 800));

      const result = await GrantEscrow.fundEscrow(program.id, data.amount, session?.userId ?? 'donor');
      setTxHash(result.txHash);

      await db.programs.update(program.id, {
        escrowBalance: program.escrowBalance + data.amount,
      });

      await db.auditLogs.put({
        id: crypto.randomUUID(),
        entityId: program.id,
        entityType: 'program',
        action: `Escrow funded: $${data.amount} deposited via ${data.paymentMethod}. Ref: ${data.reference}. Tx: ${result.txHash}`,
        performedBy: session?.userId ?? 'donor',
        timestamp: new Date().toISOString(),
      });

      await db.grantReleases.put({
        id: crypto.randomUUID(),
        patientId: 'escrow-deposit',
        patientName: 'Escrow Deposit',
        milestoneId: 'funding',
        milestoneName: `Program Funded: ${program.name}`,
        amount: data.amount,
        status: 'released',
        xionTxHash: result.txHash,
        releasedAt: new Date().toISOString(),
      });

      setStep('success');
    } catch (_error) {
      toast.error('Funding failed. Please try again.');
      setStep('form');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="bg-teal-primary px-6 py-5">
          <h2 className="text-lg font-bold text-white">Fund Program Escrow</h2>
          <p className="mt-1 text-sm text-teal-pale">{program.name}</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5 p-6"
            >
              <div className="flex items-center justify-between rounded-xl bg-teal-pale p-4">
                <div>
                  <p className="text-xs text-gray-500">Current Escrow Balance</p>
                  <p className="text-2xl font-bold text-teal-dark">${program.escrowBalance.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Enrolled Patients</p>
                  <p className="text-lg font-semibold text-gray-700">{program.enrolledPatients}</p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Deposit Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-gray-400">$</span>
                  <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-200 py-3 pl-7 pr-4 text-lg font-semibold outline-none focus:border-transparent focus:ring-2 focus:ring-teal-primary"
                  />
                </div>
                {errors.amount ? <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p> : null}

                <div className="mt-2 flex gap-2">
                  {[500, 1000, 5000, 10000].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setValue('amount', quick, { shouldValidate: true })}
                      className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs transition-colors hover:border-teal-primary hover:bg-teal-pale"
                    >
                      ${quick.toLocaleString()}
                    </button>
                  ))}
                </div>
                {amount > 0 ? (
                  <p className="mt-2 text-xs text-teal-primary">
                    This funds approximately {Math.floor(amount / 15)} complete vaccination courses at $15 per child
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'bank_transfer', label: 'Bank Transfer', icon: 'BANK' },
                    { value: 'card', label: 'Credit Card', icon: 'CARD' },
                    { value: 'crypto', label: 'XION/Crypto', icon: 'XION' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="cursor-pointer rounded-xl border-2 border-gray-200 p-3 transition-all has-[:checked]:border-teal-primary has-[:checked]:bg-teal-pale"
                    >
                      <input {...register('paymentMethod')} type="radio" value={option.value} className="sr-only" />
                      <div className="flex flex-col items-center">
                        <span className="mb-1 text-xs font-bold tracking-wide text-gray-600">{option.icon}</span>
                        <span className="text-center text-xs font-medium">{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Payment Reference</label>
                <input
                  {...register('reference')}
                  placeholder="e.g. PO-2026-001 or grant reference number"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-teal-primary"
                />
                {errors.reference ? <p className="mt-1 text-xs text-red-500">{errors.reference.message}</p> : null}
              </div>

              <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-400">
                This is a simulated escrow for demo purposes. In production, funds would be locked in a XION smart
                contract and released only when vaccination milestones are cryptographically verified.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  className="flex-1 rounded-xl bg-teal-primary py-3 font-semibold text-white transition-colors hover:bg-teal-dark"
                >
                  Deposit Funds
                </button>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 p-8 text-center"
            >
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-teal-pale border-t-teal-primary" />
              <h3 className="text-lg font-semibold text-gray-800">Processing your deposit</h3>
              <div className="space-y-2 text-sm text-gray-500">
                <ProcessingStep label="Verifying payment details" delay={0} />
                <ProcessingStep label="Submitting to XION escrow contract" delay={1000} />
                <ProcessingStep label="Confirming on-chain" delay={2000} />
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 p-8 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">${fundedAmount.toLocaleString()} deposited successfully</h3>
              <p className="text-sm text-gray-500">
                Funds are now locked in the program escrow. They will be released automatically as vaccination
                milestones are verified.
              </p>
              <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">New Escrow Balance</span>
                  <span className="font-bold text-teal-primary">
                    ${(program.escrowBalance + fundedAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tx Hash</span>
                  <span className="font-mono text-xs text-gray-700">
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Courses Funded</span>
                  <span className="font-medium text-gray-700">~{Math.floor(fundedAmount / 15)} children</span>
                </div>
              </div>
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-600">SIMULATED - Demo Mode</p>
              <button
                onClick={onSuccess}
                className="w-full rounded-xl bg-teal-primary py-3 font-semibold text-white transition-colors hover:bg-teal-dark"
              >
                Back to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function ProcessingStep({ label, delay }: { label: string; delay: number }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), delay + 800);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="flex items-center justify-center gap-2">
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-teal-primary" />
      )}
      <span className={done ? 'text-green-600' : 'text-gray-500'}>{label}</span>
    </div>
  );
}
