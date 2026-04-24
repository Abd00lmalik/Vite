'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertCircle } from 'lucide-react';
import { useXion } from '@/hooks/useXion';
import { txFundProgram } from '@/lib/xion/contracts';
import { db } from '@/lib/db/schema';
import { TxSuccessCard } from '@/components/shared/TxSuccessCard';
import { XionConnectButton } from '@/components/shared/XionConnectButton';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { toastErrorOnce } from '@/lib/utils/toastOnce';
import type { Program } from '@/types';

const schema = z.object({
  amountUxion: z.number({ invalid_type_error: 'Enter a valid amount' })
    .min(1000, 'Minimum 1000 uxion (0.001 XION)')
    .max(10_000_000_000, 'Maximum 10,000 XION'),
  reference: z.string().min(3, 'Add a payment reference'),
});
type FormData = z.infer<typeof schema>;
type Step = 'connect' | 'form' | 'processing' | 'success';

interface Props {
  program: Program;
  onClose: () => void;
  onSuccess: () => void;
}

export function FundingModal({ program, onClose, onSuccess }: Props) {
  const { address, signingClient, isConnected, isLoading: xionLoading } =
    useXion();
  const [step, setStep] = useState<Step>(isConnected ? 'form' : 'connect');
  const [txResult, setTxResult] = useState<any>(null);
  const [processingMsg, setProcessingMsg] = useState('');

  useEffect(() => {
    if (isConnected && step === 'connect') setStep('form');
  }, [isConnected]);

  const { register, handleSubmit, watch, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { amountUxion: 1_000_000, reference: '' },
    });

  const amountUxion = watch('amountUxion');
  const amountXion  = amountUxion ? (amountUxion / 1_000_000).toFixed(3) : '0';

  async function onSubmit(data: FormData) {
    if (!signingClient || !address) {
      toastErrorOnce('Please connect your XION account first', (message) => toast.error(message));
      return;
    }

    setStep('processing');

    try {
      setProcessingMsg('Submitting to XION testnet-2...');
      const result = await txFundProgram(
        signingClient,
        address,
        program.id,
        String(data.amountUxion)
      );

      // Update local DB
      const current = await db.programs.get(program.id);
      if (current) {
        await db.programs.update(program.id, {
          escrowBalance: (current.escrowBalance ?? 0) + data.amountUxion / 1_000_000,
        });
      }

      // Audit log
      await db.auditLogs.put({
        id:          crypto.randomUUID(),
        entityId:    program.id,
        entityType:  'program',
        action:      `Funded ${data.amountUxion} uxion. Tx: ${result.txHash}. Ref: ${data.reference}`,
        performedBy: address,
        timestamp:   new Date().toISOString(),
      });

      setTxResult({ ...result, amountUxion: data.amountUxion });
      setStep('success');
      onSuccess();
      toast.success('Program funded successfully!');

    } catch (err: any) {
      // Error is handled by UI toast
      toastErrorOnce(
        err.message ?? 'Transaction failed. Check your balance and try again.',
        (message) => toast.error(message)
      );
      setStep('form');
    }
  }

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center
                 justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-modal w-full max-w-lg
                      max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ui-border">
          <div>
            <h2 className="text-lg font-semibold text-ui-text">Fund Program</h2>
            <p className="text-sm text-ui-text-muted mt-0.5">{program.name}</p>
          </div>
          <button onClick={onClose}
                  className="text-ui-text-muted hover:text-ui-text transition-colors p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">

          {/* STEP: Connect */}
          {step === 'connect' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-who-blue-light rounded-full
                              flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-who-blue" />
              </div>
              <h3 className="font-semibold text-ui-text mb-2">
                Connect Your XION Account
              </h3>
              <p className="text-sm text-ui-text-muted mb-6">
                You need to connect your XION Meta Account to fund this program
                with real testnet tokens.
              </p>
              {xionLoading ? (
                <div className="flex justify-center">
                  <div className="animate-spin h-6 w-6 border-2 border-who-blue
                                  border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="flex justify-center">
                  <XionConnectButton />
                </div>
              )}
              <p className="text-xs text-ui-text-muted mt-4">
                Log in with email or Google - no crypto wallet needed.
                Get testnet tokens at{' '}
                <a href="https://faucet.xion.burnt.com" target="_blank"
                   rel="noopener noreferrer"
                   className="text-who-blue hover:underline">
                  faucet.xion.burnt.com
                </a>
              </p>
            </div>
          )}

          {/* STEP: Form */}
          {step === 'form' && (
            <div className="space-y-5">
              {/* Balance info */}
              <div className="bg-ui-bg border border-ui-border rounded-lg p-4
                              flex justify-between items-center">
                <div>
                  <p className="text-xs text-ui-text-muted">Current Escrow Balance</p>
                  <p className="text-xl font-bold text-who-blue">
                    ${(program.escrowBalance ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ui-text-muted">Connected as</p>
                  <p className="text-sm font-mono text-ui-text">
                    {address?.slice(0, 10)}...{address?.slice(-6)}
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-ui-text mb-1.5">
                  Amount (uxion) *
                </label>
                <input
                  {...register('amountUxion', { valueAsNumber: true })}
                  type="number"
                  placeholder="1000000"
                  className="input"
                />
                {errors.amountUxion && (
                  <p className="text-who-red text-xs mt-1">
                    {errors.amountUxion.message}
                  </p>
                )}
                {amountUxion > 0 && (
                  <p className="text-xs text-who-blue mt-1.5">
                    = {amountXion} XION (testnet)
                  </p>
                )}
                {/* Quick amounts */}
                <div className="flex gap-2 mt-2">
                  {[1_000_000, 5_000_000, 10_000_000, 50_000_000].map(v => (
                    <button key={v} type="button"
                            onClick={() => {
                              const input = document.querySelector<HTMLInputElement>(
                                'input[type="number"]'
                              );
                              if (input) {
                                const nativeInputValueSetter =
                                  Object.getOwnPropertyDescriptor(
                                    window.HTMLInputElement.prototype, 'value'
                                  )?.set;
                                nativeInputValueSetter?.call(input, String(v));
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                              }
                            }}
                            className="flex-1 text-xs py-1.5 rounded border
                                       border-ui-border hover:border-who-blue
                                       hover:text-who-blue hover:bg-who-blue-light
                                       transition-colors text-ui-text-light">
                      {(v / 1_000_000).toFixed(0)} XION
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-ui-text mb-1.5">
                  Payment Reference *
                </label>
                <input
                  {...register('reference')}
                  placeholder="e.g. GIA-2026-001"
                  className="input"
                />
                {errors.reference && (
                  <p className="text-who-red text-xs mt-1">
                    {errors.reference.message}
                  </p>
                )}
              </div>

              {/* Notice */}
              <div className="bg-who-blue-light border border-who-blue/20
                              rounded-lg p-3 text-xs text-who-blue leading-relaxed">
                <strong>Testnet transaction:</strong> This sends real uxion tokens
                from your XION Meta Account to the program escrow contract on
                testnet-2. Gas fees are covered by the Treasury. Get testnet
                tokens free at{' '}
                <a href="https://faucet.xion.burnt.com" target="_blank"
                   rel="noopener noreferrer" className="underline">
                  faucet.xion.burnt.com
                </a>
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit(onSubmit)}
                  className="flex-1"
                >
                  Fund Program
                </Button>
              </div>
            </div>
          )}

          {/* STEP: Processing */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-who-blue
                              border-t-transparent rounded-full mx-auto mb-6" />
              <p className="font-semibold text-ui-text mb-2">
                Processing your transaction
              </p>
              <p className="text-sm text-ui-text-muted">{processingMsg}</p>
              <p className="text-xs text-ui-text-muted mt-2">Do not close this window</p>
            </div>
          )}

          {/* STEP: Success */}
          {step === 'success' && txResult && (
            <div className="space-y-4">
              <TxSuccessCard
                txHash={txResult.txHash}
                title="Program funded successfully"
                details={[
                  { label: 'Amount', value: `${txResult.amountUxion} uxion` },
                  { label: 'Program', value: program.name },
                  { label: 'Block', value: String(txResult.height) },
                ]}
              />
              <Button variant="primary" onClick={onClose} className="w-full">
                Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



