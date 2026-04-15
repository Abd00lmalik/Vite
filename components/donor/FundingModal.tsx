'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/db/schema';
import { GrantEscrow } from '@/lib/blockchain/contracts';
import { useAuthStore } from '@/store/authStore';
import type { Program } from '@/types';

const schema = z.object({
  amount: z
    .number({ invalid_type_error: 'Enter a valid amount' })
    .min(10, 'Minimum deposit is $10')
    .max(1000000, 'Maximum is $1,000,000'),
  paymentMethod: z.enum(['bank_transfer', 'card', 'crypto']),
  reference: z.string().min(3, 'Add a payment reference'),
});

type FormData = z.infer<typeof schema>;
type Step = 'form' | 'processing' | 'success';

interface Props {
  program: Program;
  onClose: () => void;
  onSuccess: () => void;
}

const PROCESSING_STEPS = [
  'Verifying payment details...',
  'Submitting to XION escrow contract...',
  'Confirming on-chain...',
];

export function FundingModal({ program, onClose, onSuccess }: Props) {
  const { session } = useAuthStore();
  const [step, setStep] = useState<Step>('form');
  const [txHash, setTxHash] = useState('');
  const [fundedAmount, setFundedAmount] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'bank_transfer', reference: '' },
  });

  const amount = watch('amount');

  async function onSubmit(data: FormData) {
    setStep('processing');
    setFundedAmount(data.amount);

    try {
      for (let i = 0; i < PROCESSING_STEPS.length; i += 1) {
        setProcessingStep(i);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const result = await GrantEscrow.fundEscrow(program.id, data.amount, session?.userId ?? 'donor');
      setTxHash(result.txHash);

      const current = await db.programs.get(program.id);
      if (current) {
        await db.programs.update(program.id, {
          escrowBalance: (current.escrowBalance ?? 0) + data.amount,
        });
      }

      await db.auditLogs.put({
        id: crypto.randomUUID(),
        entityId: program.id,
        entityType: 'program',
        action: `Escrow funded $${data.amount} via ${data.paymentMethod}. Ref: ${data.reference}. Tx: ${result.txHash}`,
        performedBy: session?.userId ?? 'donor',
        timestamp: new Date().toISOString(),
      });

      await db.grantReleases.put({
        id: crypto.randomUUID(),
        patientId: 'escrow-deposit',
        patientName: 'Escrow Deposit',
        milestoneId: 'funding-event',
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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl"
      >
        <div className="sticky top-0 flex items-start justify-between bg-teal-primary px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-white">Fund Program Escrow</h2>
            <p className="mt-0.5 line-clamp-1 text-sm text-white/70">{program.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/70 transition-colors hover:text-white"
            aria-label="Close funding modal"
          >
            <X className="h-5 w-5" />
          </button>
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
                  <p className="text-2xl font-bold text-teal-dark">${(program.escrowBalance ?? 0).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Enrolled Patients</p>
                  <p className="text-xl font-bold text-gray-700">{program.enrolledPatients ?? 0}</p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Deposit Amount (USD) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-gray-400">$</span>
                  <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-200 py-3.5 pl-8 pr-4 text-lg font-semibold outline-none focus:border-transparent focus:ring-2 focus:ring-teal-primary"
                  />
                </div>
                {errors.amount ? <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p> : null}
                <div className="mt-2.5 flex gap-2">
                  {[500, 1000, 5000, 10000].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('amount', value, { shouldValidate: true })}
                      className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-teal-primary hover:bg-teal-pale"
                    >
                      ${value >= 1000 ? `${value / 1000}k` : value}
                    </button>
                  ))}
                </div>
                {amount > 0 && !Number.isNaN(amount) ? (
                  <p className="mt-2 text-xs font-medium text-teal-primary">
                    ~ funds {Math.floor(amount / 15)} complete vaccination courses at $15 per child
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Payment Method *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'bank_transfer', label: 'Bank Transfer', icon: 'BANK' },
                    { value: 'card', label: 'Credit Card', icon: 'CARD' },
                    { value: 'crypto', label: 'XION/Crypto', icon: 'XION' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="cursor-pointer rounded-xl border-2 border-gray-200 p-3 transition-all has-[:checked]:border-teal-primary has-[:checked]:bg-teal-pale hover:border-gray-300"
                    >
                      <input {...register('paymentMethod')} type="radio" value={option.value} className="sr-only" />
                      <div className="flex flex-col items-center">
                        <span className="mb-1 text-xs font-bold tracking-wide text-gray-600">{option.icon}</span>
                        <span className="text-center text-xs font-medium leading-tight">{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Payment Reference *</label>
                <input
                  {...register('reference')}
                  placeholder="e.g. GIA-2026-001 or grant reference"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-teal-primary"
                />
                {errors.reference ? <p className="mt-1 text-xs text-red-500">{errors.reference.message}</p> : null}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs leading-relaxed text-amber-700">
                  <strong>Demo Mode:</strong> This simulates an escrow deposit. In production, funds would be
                  cryptographically locked in a XION smart contract and released only when vaccination milestones are
                  verified on-chain.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-gray-200 py-3.5 font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  className="flex-1 rounded-xl bg-teal-primary py-3.5 font-bold text-white transition-colors hover:bg-teal-dark"
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
              className="space-y-6 p-10 text-center"
            >
              <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-teal-pale border-t-teal-primary" />
              <div>
                <h3 className="mb-1 text-lg font-semibold text-gray-800">Processing your deposit</h3>
                <p className="text-sm text-gray-400">Do not close this window</p>
              </div>
              <div className="space-y-2.5">
                {PROCESSING_STEPS.map((label, index) => {
                  const done = index < processingStep;
                  const active = index === processingStep;
                  return (
                    <div
                      key={label}
                      className={`flex items-center gap-3 text-sm transition-all ${
                        done ? 'text-green-600' : active ? 'font-medium text-teal-primary' : 'text-gray-300'
                      }`}
                    >
                      <span className="w-5 text-center">{done ? 'OK' : active ? '...' : 'o'}</span>
                      {label}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5 p-8 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                OK
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">${fundedAmount.toLocaleString()} deposited</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Funds are locked in escrow and will be released automatically as vaccination milestones are verified.
                </p>
              </div>

              <div className="space-y-2.5 rounded-xl bg-gray-50 p-4 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">New Escrow Balance</span>
                  <span className="font-semibold text-gray-800">
                    ${((program.escrowBalance ?? 0) + fundedAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Courses Funded</span>
                  <span className="font-semibold text-gray-800">~{Math.floor(fundedAmount / 15)} children</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tx Hash</span>
                  <span className="font-mono text-xs text-gray-700">
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="font-semibold text-gray-800">Confirmed (Simulated)</span>
                </div>
              </div>

              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-600">SIMULATED - Demo Mode</p>

              <button
                type="button"
                onClick={onSuccess}
                className="w-full rounded-xl bg-teal-primary py-3.5 font-bold text-white transition-colors hover:bg-teal-dark"
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
