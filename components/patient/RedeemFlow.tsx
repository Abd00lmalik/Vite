'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PaymentReceipt } from '@/components/shared/PaymentReceipt';
import { db } from '@/lib/db/schema';
import { SMS } from '@/lib/notifications/sms';
import type { GrantRelease, Patient } from '@/types';

interface RedeemFlowProps {
  patient: Patient;
  grants: GrantRelease[];
  onComplete: () => void;
}

const PROCESSING_STEPS = [
  'Processing your transfer...',
  'Verifying your account...',
  'Initiating mobile money transfer...',
];

function maskPhone(phone: string) {
  const compact = phone.replace(/\s+/g, '');
  if (compact.length <= 4) return compact;
  return `${compact.slice(0, Math.max(0, compact.length - 4)).replace(/\d/g, 'X')}${compact.slice(-4)}`;
}

export function RedeemFlow({ patient, grants, onComplete }: RedeemFlowProps) {
  const [step, setStep] = useState<'confirm' | 'processing' | 'success'>('confirm');
  const [phone, setPhone] = useState(patient.parentPhone);
  const [receiptId, setReceiptId] = useState('');
  const [progressIndex, setProgressIndex] = useState(0);

  const available = useMemo(() => grants.filter((grant) => grant.status === 'released'), [grants]);
  const amount = useMemo(() => available.reduce((sum, grant) => sum + grant.amount, 0), [available]);

  useEffect(() => {
    if (step !== 'processing') return;
    setProgressIndex(0);

    const timer = window.setInterval(() => {
      setProgressIndex((prev) => {
        if (prev >= PROCESSING_STEPS.length - 1) {
          window.clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 700);

    return () => window.clearInterval(timer);
  }, [step]);

  if (step === 'success') {
    return (
      <div className="space-y-3">
        <PaymentReceipt
          amount={amount}
          phone={phone}
          patientName={patient.name}
          provider="OPay (Simulated)"
          transactionId={receiptId}
          timestamp={new Date().toISOString()}
        />
        <Button className="w-full" variant="outline" onClick={onComplete}>
          Close
        </Button>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <Card>
        <CardContent className="space-y-3 p-5 text-sm text-gray-700">
          {PROCESSING_STEPS.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              {index <= progressIndex ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-teal-primary" />
              )}
              <p className={index <= progressIndex ? 'text-green-700' : 'text-gray-600'}>{label}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm text-gray-700">
          You have ${amount.toFixed(2)} available. Confirm transfer to {maskPhone(phone)}?
        </p>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="h-12 w-full rounded-lg border border-gray-300 px-3 text-base"
        />
        <Button
          className="w-full"
          onClick={async () => {
            setStep('processing');
            await new Promise((resolve) => setTimeout(resolve, 2100));

            const transactionId = `VH-${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
            for (const grant of available) {
              await db.grantReleases.update(grant.id, {
                status: 'redeemed',
                mobileMoneyReceipt: {
                  transactionId,
                  phone,
                  amount: grant.amount,
                  currency: 'USD',
                  provider: 'OPay (Simulated)',
                  timestamp: new Date().toISOString(),
                  status: 'success',
                },
              });
            }

            await SMS.redemption(phone, amount, phone);
            setReceiptId(transactionId);
            setStep('success');
            toast.success('Transfer confirmed.');
          }}
        >
          Confirm Redemption
        </Button>
      </CardContent>
    </Card>
  );
}
